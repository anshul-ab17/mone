import {
  Connection,
  SystemProgram,
  Transaction,
  PublicKey,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { env } from "@repo/config";
import { prisma } from "@repo/db";
import { deriveDepositKeypair } from "./keypairService";
import { transferSpl } from "./splService";
import { getDailyWithdrawn, getDailyLimit } from "./withdrawalQueue";

export const SPL_MINTS: Record<string, string> = {
  USDC: env.USDC_MINT ?? "",
  ...(env.USDT_MINT ? { USDT: env.USDT_MINT } : {}),
};

// Exported so withdrawalQueue.ts can call them directly
export async function withdrawSOLOnChain(
  withdrawalId: string,
  userId: string,
  destinationAddress: string,
  amountSol: number
): Promise<string> {
  const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  const senderKeypair = deriveDepositKeypair(userId);
  const destination = new PublicKey(destinationAddress);
  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

  const onChainBalance = await connection.getBalance(senderKeypair.publicKey);
  if (onChainBalance < lamports + 5000) {
    throw new Error(
      `Insufficient on-chain SOL. On-chain: ${onChainBalance / LAMPORTS_PER_SOL}, requested: ${amountSol}`
    );
  }

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: senderKeypair.publicKey,
      toPubkey: destination,
      lamports,
    })
  );
  return sendAndConfirmTransaction(connection, tx, [senderKeypair]);
}

export async function withdrawSPLOnChain(
  _withdrawalId: string,
  userId: string,
  asset: string,
  destinationAddress: string,
  amount: number
): Promise<string> {
  const mintAddress = SPL_MINTS[asset];
  if (!mintAddress) throw new Error(`SPL mint not configured for asset: ${asset}`);

  const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  const senderKeypair = deriveDepositKeypair(userId);
  const destinationOwner = new PublicKey(destinationAddress);
  const rawAmount = BigInt(Math.floor(amount * 1_000_000)); // 6 decimals

  return transferSpl(connection, senderKeypair, mintAddress, destinationOwner, rawAmount);
}

// Public entry point — validates, deducts balance, queues for async processing
export async function processWithdrawal(
  userId: string,
  destinationAddress: string,
  amount: number,
  asset = "SOL"
): Promise<{ withdrawalId: string; status: string }> {
  if (!env.SOLANA_MASTER_SECRET) throw new Error("Solana withdrawals not configured");

  try { new PublicKey(destinationAddress); } catch {
    throw new Error("Invalid Solana destination address");
  }

  // Daily limit check
  const alreadyWithdrawn = await getDailyWithdrawn(userId, asset);
  const limit = getDailyLimit(asset);
  if (alreadyWithdrawn + amount > limit) {
    throw new Error(
      `Daily withdrawal limit exceeded. Limit: ${limit} ${asset}, used: ${alreadyWithdrawn.toFixed(4)}`
    );
  }

  // Atomically deduct internal balance and queue the withdrawal
  const withdrawal = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId_asset: { userId, asset } },
    });

    if (!wallet || wallet.balance < amount) {
      throw new Error(`Insufficient ${asset} balance`);
    }

    await tx.wallet.update({
      where: { userId_asset: { userId, asset } },
      data: { balance: { decrement: amount } },
    });

    return tx.withdrawal.create({
      data: { userId, destinationAddress, amount, asset, status: "PENDING" },
    });
  });

  return { withdrawalId: withdrawal.id, status: "PENDING" };
}
