import type { Context } from "hono";
import { z } from "zod";
import { processWithdrawal } from "../services/solana/withdrawalService";
import { WithdrawalRepo } from "../repo/withdrawalRepo";

const repo = new WithdrawalRepo();

const withdrawSchema = z.object({
  destinationAddress: z.string().min(32).max(44),
  amount: z.number().positive(),
  asset: z.string().default("SOL"),
});

export class WithdrawalController {
  async requestWithdrawal(c: Context) {
    const userId = c.get("userId") as string;
    const body = await c.req.json();

    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
    }

    const { destinationAddress, amount, asset } = parsed.data;

    try {
      const result = await processWithdrawal(userId, destinationAddress, amount, asset);
      return c.json({ ...result, message: "Withdrawal queued — funds will arrive within 30 seconds" }, 202);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Withdrawal failed";
      const status = message.includes("Insufficient") ? 400 : 500;
      return c.json({ error: message }, status as 400 | 500);
    }
  }

  async getHistory(c: Context) {
    const userId = c.get("userId") as string;
    const history = await repo.getUserHistory(userId);
    return c.json({ withdrawals: history });
  }
}
