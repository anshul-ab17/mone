import { prisma } from "@repo/db";
import { withdrawSOLOnChain, withdrawSPLOnChain } from "./withdrawalService";

const POLL_INTERVAL_MS = 30_000;
const MAX_RETRIES = 5;
const DAILY_LIMIT_SOL = 10; // SOL per user per day
const DAILY_LIMIT_SPL: Record<string, number> = { USDC: 5000, USDT: 5000 };

export async function getDailyWithdrawn(userId: string, asset: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const agg = await prisma.withdrawal.aggregate({
    where: {
      userId,
      asset,
      status: { in: ["SUBMITTED", "CONFIRMED"] },
      createdAt: { gte: since },
    },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

export function getDailyLimit(asset: string): number {
  if (asset === "SOL") return DAILY_LIMIT_SOL;
  return DAILY_LIMIT_SPL[asset] ?? 1000;
}

async function processPendingWithdrawals() {
  const pending = await prisma.withdrawal.findMany({
    where: {
      status: "PENDING",
      retryCount: { lt: MAX_RETRIES },
      processAfter: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  for (const w of pending) {
    try {
      await prisma.withdrawal.update({
        where: { id: w.id },
        data: { status: "SUBMITTED" },
      });

      const isSpl = w.asset !== "SOL";
      const signature = isSpl
        ? await withdrawSPLOnChain(w.id, w.userId, w.asset, w.destinationAddress, w.amount)
        : await withdrawSOLOnChain(w.id, w.userId, w.destinationAddress, w.amount);

      await prisma.withdrawal.update({
        where: { id: w.id },
        data: { status: "CONFIRMED", txSignature: signature },
      });

      console.log(`Withdrawal ${w.id} confirmed: ${signature}`);
    } catch (err) {
      const nextRetry = w.retryCount + 1;
      const backoffMs = Math.min(60_000 * 2 ** nextRetry, 3_600_000); // max 1h backoff
      const isFinal = nextRetry >= MAX_RETRIES;

      await prisma.withdrawal.update({
        where: { id: w.id },
        data: {
          status: isFinal ? "FAILED" : "PENDING",
          retryCount: nextRetry,
          processAfter: new Date(Date.now() + backoffMs),
        },
      });

      if (isFinal) {
        // Refund internal balance — funds never left the deposit address on-chain
        await prisma.wallet.update({
          where: { userId_asset: { userId: w.userId, asset: w.asset } },
          data: { balance: { increment: w.amount } },
        });
        console.error(`Withdrawal ${w.id} permanently failed after ${MAX_RETRIES} retries — balance refunded`);
      } else {
        console.warn(`Withdrawal ${w.id} failed (attempt ${nextRetry}), retry in ${backoffMs / 1000}s:`, err);
      }
    }
  }
}

export function startWithdrawalQueue() {
  console.log("Withdrawal queue started");

  const poll = async () => {
    try {
      await processPendingWithdrawals();
    } catch (err) {
      console.error("Withdrawal queue error:", err);
    } finally {
      setTimeout(poll, POLL_INTERVAL_MS);
    }
  };

  poll();
}
