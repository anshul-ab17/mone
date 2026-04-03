import { Keypair } from "@solana/web3.js";
import { createHmac } from "crypto";
import { env } from "@repo/config";

// Derives a deterministic Ed25519 keypair for a user from the master secret.
// Using HMAC-SHA256(masterSecret, "mone:deposit:" + userId) produces a stable
// 32-byte seed so the same keypair can always be recovered from env alone.
export function deriveDepositKeypair(userId: string): Keypair {
  const secret = env.SOLANA_MASTER_SECRET;
  if (!secret) throw new Error("SOLANA_MASTER_SECRET is not configured");

  const seed = createHmac("sha256", secret)
    .update("mone:deposit:" + userId)
    .digest(); // 32 bytes
  return Keypair.fromSeed(seed);
}
