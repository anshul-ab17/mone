import { prisma } from "@repo/db";
import { WalletRepo } from "../repo/walletRepo";
import { AppError } from "../lib/appError";

export class WalletService {
  private repo = new WalletRepo();
 
  public async getWallets(userId: string) {
    return this.repo.getUserWallet(userId);
  }
 
  public async deposit(userId: string, asset: string, amount: number) {
    return prisma.$transaction(async (transaction) => {
      let wallet = await transaction.wallet.findUnique({
        where: {
          userId_asset: { userId, asset },
        },
      });

      if (!wallet) {
        wallet = await transaction.wallet.create({
          data: { userId,asset, balance: 0, lockedBalance: 0}
        });
      }

      return transaction.wallet.update({
        where: {
          userId_asset: { userId, asset },
        },
        data: {
          balance: { increment: amount },
        },
      });
    });
  }
  
  private async getRequiredWallet(
    transaction: any,
    userId: string,
    asset: string
  ) {
    const wallet = await transaction.wallet.findUnique({
      where: {
        userId_asset: { userId, asset },
      },
    });

    if (!wallet) {
      throw new AppError("WALLET_NOT_FOUND", 404);
    }

    return wallet;
  } 

  public async lockBalance(
    userId: string,
    asset: string,
    amount: number
  ) {
    const result = await prisma.wallet.updateMany({
      where: { userId, asset, balance: { gte: amount } },
      data: {
        balance: { decrement: amount },
        lockedBalance: { increment: amount },
      },
    });

    if (result.count === 0) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId_asset: { userId, asset } },
      });
      if (!wallet) throw new AppError("WALLET_NOT_FOUND", 404);
      throw new AppError("INSUFFICIENT_BALANCE", 400);
    }
  }
 
  public async unlockBalance(
    userId: string,
    asset: string,
    amount: number
  ) {
    return prisma.$transaction(async (transaction) => {
      const wallet = await this.getRequiredWallet(transaction, userId, asset);

      if (wallet.lockedBalance < amount) {
        throw new AppError("INVALID_UNLOCK_AMOUNT", 400);
      }

      return transaction.wallet.update({
        where: { userId_asset: { userId, asset } },
        data: {
          lockedBalance: { decrement: amount },
          balance: { increment: amount },
        },
      });
    });
  }
}