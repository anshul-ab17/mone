import type { Context } from "hono";
import { WalletService } from "../services/walletService";
import { AppError } from "../lib/appError";

export class WalletController {
  private service = new WalletService();

  private getUserId(c: Context): string {
    const userId = c.get("userId");
    if (!userId) {
      throw new AppError("UNAUTHORIZED", 401);
    }
    return userId;
  }

  private getBody(c: Context) {
    return c.get("validatedBody");
  }

  public getWallets = async (c: Context) => {
    const userId = this.getUserId(c);

    const wallets = await this.service.getWallets(userId);

    return c.json({
      success: true,
      data: wallets,
    });
  };

  public deposit = async (c: Context) => {
    const userId = this.getUserId(c);
    const body = this.getBody(c);

    const result = await this.service.deposit(
      userId,
      body.asset,
      body.amount
    );

    return c.json({
      success: true,
      data: result,
    });
  };

  public lockBalance = async (c: Context) => {
    const userId = this.getUserId(c);
    const body = this.getBody(c);

    const result = await this.service.lockBalance(
      userId,
      body.asset,
      body.amount
    );

    return c.json({
      success: true,
      data: result,
    });
  };

  public unlockBalance = async (c: Context) => {
    const userId = this.getUserId(c);
    const body = this.getBody(c);

    const result = await this.service.unlockBalance(
      userId,
      body.asset,
      body.amount
    );

    return c.json({
      success: true,
      data: result,
    });
  };
}