import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { env } from "@repo/config";
import { prisma } from "@repo/db";
import { DepositRepo } from "../../repo/depositRepo";
import { deriveDepositKeypair } from "./keypairService";

const POLL_INTERVAL_MS = 10_000;
const repo = new DepositRepo();

// Supported SPL tokens: asset label → mint address
function getSplMints(): Record<string, string> {
  const mints: Record<string, string> = {};
  if (env.USDC_MINT) mints["USDC"] = env.USDC_MINT;
  if (env.USDT_MINT) mints["USDT"] = env.USDT_MINT;
  return mints;
}

async function checkSolDeposits(
  connection: Connection,
  userId: string,
  publicKey: string
) {
  const pubkey = new PublicKey(publicKey);
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 20 });

  for (const sigInfo of signatures) {
    if (sigInfo.err) continue;
    if (await repo.isTxProcessed(sigInfo.signature)) continue;

    const tx = await connection.getParsedTransaction(sigInfo.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (!tx || !tx.meta) continue;

    const accountKeys = tx.transaction.message.accountKeys;
    const accountIndex = accountKeys.findIndex(
      (k) => ("pubkey" in k ? k.pubkey : k).toBase58() === publicKey
    );
    if (accountIndex === -1) continue;

    const lamportsDiff =
      tx.meta.postBalances[accountIndex] - tx.meta.preBalances[accountIndex];
    if (lamportsDiff <= 0) continue;

    const solAmount = lamportsDiff / LAMPORTS_PER_SOL;

    await prisma.$transaction(async (tx_) => {
      await tx_.wallet.upsert({
        where: { userId_asset: { userId, asset: "SOL" } },
        update: { balance: { increment: solAmount } },
        create: { userId, asset: "SOL", balance: solAmount },
      });
      await tx_.processedTx.create({
        data: { signature: sigInfo.signature, userId, amount: solAmount, asset: "SOL" },
      });
    });

    console.log(`Credited ${solAmount} SOL to user ${userId} (tx: ${sigInfo.signature})`);
  }
}

async function checkSplDeposits(
  connection: Connection,
  userId: string,
  publicKey: string
) {
  const splMints = getSplMints();
  if (Object.keys(splMints).length === 0) return;

  const keypair = deriveDepositKeypair(userId);

  for (const [asset, mintAddress] of Object.entries(splMints)) {
    const mint = new PublicKey(mintAddress);
    let ata: PublicKey;
    try {
      ata = await getAssociatedTokenAddress(mint, keypair.publicKey);
    } catch {
      continue;
    }

    // Get transaction history for the ATA
    const signatures = await connection
      .getSignaturesForAddress(ata, { limit: 20 })
      .catch(() => []);

    for (const sigInfo of signatures) {
      if (sigInfo.err) continue;
      if (await repo.isTxProcessed(sigInfo.signature)) continue;

      const tx = await connection.getParsedTransaction(sigInfo.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      if (!tx || !tx.meta) continue;

      // Find SPL token transfer to our ATA in parsed instructions
      const innerInstructions = tx.meta.innerInstructions ?? [];
      let received = 0;

      for (const inner of innerInstructions) {
        for (const ix of inner.instructions) {
          if (
            "parsed" in ix &&
            ix.parsed?.type === "transfer" &&
            ix.parsed?.info?.destination === ata.toBase58()
          ) {
            received += Number(ix.parsed.info.amount ?? 0);
          }
        }
      }

      // Also check top-level parsed instructions
      for (const ix of tx.transaction.message.instructions) {
        if (
          "parsed" in ix &&
          ix.parsed?.type === "transferChecked" &&
          ix.parsed?.info?.destination === ata.toBase58()
        ) {
          received += Number(ix.parsed.info.tokenAmount?.amount ?? 0);
        }
      }

      if (received <= 0) continue;

      // Get mint decimals for UI amount
      let decimals = 6; // USDC/USDT default
      try {
        const mintInfo = await connection.getParsedAccountInfo(mint);
        const data = (mintInfo.value?.data as any)?.parsed?.info;
        decimals = data?.decimals ?? 6;
      } catch {}

      const uiAmount = received / 10 ** decimals;

      await prisma.$transaction(async (tx_) => {
        await tx_.wallet.upsert({
          where: { userId_asset: { userId, asset } },
          update: { balance: { increment: uiAmount } },
          create: { userId, asset, balance: uiAmount },
        });
        await tx_.processedTx.create({
          data: { signature: sigInfo.signature, userId, amount: uiAmount, asset },
        });
      });

      console.log(`Credited ${uiAmount} ${asset} to user ${userId} (tx: ${sigInfo.signature})`);
    }
  }
}

async function runPoll(connection: Connection) {
  const addresses = await repo.getAllAddresses();
  await Promise.allSettled(
    addresses.flatMap((a) => [
      checkSolDeposits(connection, a.userId, a.publicKey),
      checkSplDeposits(connection, a.userId, a.publicKey),
    ])
  );
}

export function startDepositMonitor() {
  if (!env.SOLANA_MASTER_SECRET) {
    console.warn("SOLANA_MASTER_SECRET not set — deposit monitor disabled");
    return;
  }

  const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  console.log(`Deposit monitor started (RPC: ${env.SOLANA_RPC_URL})`);

  const poll = async () => {
    try {
      await runPoll(connection);
    } catch (err) {
      console.error("Deposit monitor error:", err);
    } finally {
      setTimeout(poll, POLL_INTERVAL_MS);
    }
  };

  poll();
}
