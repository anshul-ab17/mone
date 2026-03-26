import type { Prisma } from "@prisma/client";
import type { Trade } from "../../engine/v1/types";

export async function settleTrades(
  trades: Trade[],
  tx: Prisma.TransactionClient
) {
  if (trades.length === 0) return;

  // batch load all orders + their markets in one query (kill N+1)
  const orderIds = [...new Set(trades.flatMap((t) => [t.buyOrderId, t.sellOrderId]))];

  const orders = await tx.order.findMany({
    where: { id: { in: orderIds } },
    include: { market: true },
  });

  if (orders.length < orderIds.length) {
    throw new Error("Order not found during settlement");
  }

  const orderMap = new Map(orders.map((o) => [o.id, o]));

  for (const trade of trades) {
    const { buyOrderId, sellOrderId, price, quantity } = trade;
    const cost = price * quantity;

    const buyOrder = orderMap.get(buyOrderId)!;
    const sellOrder = orderMap.get(sellOrderId)!;
    const { market } = buyOrder;

    const buyerId = buyOrder.userId;
    const sellerId = sellOrder.userId;
    const { baseAsset, quoteAsset } = market;

    // buyer: release locked quote, credit base
    await tx.wallet.update({
      where: { userId_asset: { userId: buyerId, asset: quoteAsset } },
      data: { lockedBalance: { decrement: cost } },
    });

    await tx.wallet.update({
      where: { userId_asset: { userId: buyerId, asset: baseAsset } },
      data: { balance: { increment: quantity } },
    });

    // seller: release locked base, credit quote
    await tx.wallet.update({
      where: { userId_asset: { userId: sellerId, asset: baseAsset } },
      data: { lockedBalance: { decrement: quantity } },
    });

    await tx.wallet.update({
      where: { userId_asset: { userId: sellerId, asset: quoteAsset } },
      data: { balance: { increment: cost } },
    });
  }
}
