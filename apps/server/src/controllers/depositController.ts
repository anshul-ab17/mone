import type { Context } from "hono";
import { DepositRepo } from "../repo/depositRepo";
import { deriveDepositKeypair } from "../services/solana/keypairService";
import { env } from "@repo/config";

const repo = new DepositRepo();

export class DepositController {
  async getAddress(c: Context) {
    if (!env.SOLANA_MASTER_SECRET) {
      return c.json({ error: "Solana deposits not configured" }, 503);
    }

    const userId = c.get("userId") as string;
    const keypair = deriveDepositKeypair(userId);
    const publicKey = keypair.publicKey.toBase58();

    await repo.findOrCreateAddress(userId, publicKey);

    return c.json({ publicKey, network: env.SOLANA_RPC_URL.includes("devnet") ? "devnet" : "mainnet" });
  }

  async getHistory(c: Context) {
    const userId = c.get("userId") as string;
    const history = await repo.getUserHistory(userId);
    return c.json({ deposits: history });
  }
}
