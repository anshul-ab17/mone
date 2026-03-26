import type { PrismaClient } from "@prisma/client";
import type { Trade } from "../../engine/v1/types";

type SettlementDeps = {
  prisma: PrismaClient;
};

export async function settleTrades(
  trades: Trade[],
  deps: SettlementDeps
) {
  const { prisma } = deps;

  if (trades.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const trade of trades) {
      const { buyOrderId, sellOrderId, price, quantity } = trade;

      const cost = price * quantity;

      const [buyOrder, sellOrder] = await Promise.all([
        tx.order.findUnique({ where: { id: buyOrderId } }),
        tx.order.findUnique({ where: { id: sellOrderId } }),
      ]);

      if (!buyOrder || !sellOrder) {
        throw new Error("Order not found during settlement");
      }

      const buyerId = buyOrder.userId;
      const sellerId = sellOrder.userId;

        const market = await tx.market.findUnique({
        where: { id: buyOrder.marketId },
        });

        if (!market) throw new Error("Market not found during settlement");

        const baseAsset = market.baseAsset;
        const quoteAsset = market.quoteAsset;

      // buyer:
      // decrease locked asset
      await tx.wallet.update({
        where: { userId_asset: { userId: buyerId, asset: quoteAsset } },
        data: {
          lockedBalance: { decrement: cost },
        },
      });

      // increase asset balance
      await tx.wallet.update({
        where: { userId_asset: { userId: buyerId, asset: baseAsset } },
        data: {
          balance: { increment: quantity },
        },
      });

      //seller:
      // decrease locked asset
      await tx.wallet.update({
        where: { userId_asset: { userId: sellerId, asset: baseAsset } },
        data: {
          lockedBalance: { decrement: quantity },
        },
      });

      // increase asset balance
      await tx.wallet.update({
        where: { userId_asset: { userId: sellerId, asset: quoteAsset } },
        data: {
          balance: { increment: cost },
        },
      });
    }
  });
}