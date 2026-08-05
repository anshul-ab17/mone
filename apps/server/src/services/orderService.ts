import type { CreateOrderInput } from "@repo/types";
import { prisma } from "@repo/db";
import { OrderRepo } from "../repo/orderRepo";
import { WalletService } from "./walletService";
import { engine } from "../engine/v1";
import type { EngineOrder } from "../engine/v1/types";
import { calculateSlippage } from "./execution/slippage";
import { settleTrades } from "./execution/settlement";
import { publishOrderbook, publishTrades, publishTicker } from "./pubService";
import { publishOrderPlaced } from "../eventbroker/producer";
import { env } from "@repo/config";

const USE_NATS = env.USE_NATS === "true";

export class OrderService {
  private repo = new OrderRepo();
  private walletService = new WalletService();

  async createOrder(userId: string, data: CreateOrderInput) {
    let requiredAmount = 0;

    if (data.side === "BUY" && data.type === "LIMIT") {
      requiredAmount = data.price! * data.quantity;
    } else {
      // SELL (any type): lock quantity of baseAsset
      // MARKET BUY: lock quantity of quoteAsset (spend budget = quantity units)
      requiredAmount = data.quantity;
    }

    await this.walletService.lockBalance(userId, data.asset, requiredAmount);

    // asset and maxSlippage are service-level fields — not Order columns
    const { asset, maxSlippage, ...orderData } = data;

    const order = await this.repo.create({
      ...orderData,
      userId,
      filledQty: 0,
      status: "OPEN",
    });

    const engineOrder: EngineOrder = {
      id: order.id,
      userId: order.userId,
      marketId: order.marketId,
      side: order.side,
      price: order.price ?? 0,
      quantity: order.quantity,
      filled: 0,
      timestamp: Date.now(),
    };

    // --- NATS path: publish to Go engine, settlement is async ---
    if (USE_NATS) {
      await publishOrderPlaced(engineOrder);
      return {
        orderId: order.id,
        filledQty: 0,
        trades: [],
        avgPrice: 0,
        slippage: 0,
        async: true,
      };
    }

    // --- In-process path (default): synchronous matching + settlement ---
    const result = engine.process(engineOrder);

    if (data.type === "MARKET" && result.trades.length === 0) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await this.walletService.unlockBalance(userId, data.asset, requiredAmount);
      throw new Error("No liquidity available");
    }

    const { avgPrice, slippage } = calculateSlippage(result.trades, data.price ?? 0);

    if (data.maxSlippage !== undefined && result.trades.length > 0 && Math.abs(slippage) > data.maxSlippage) {
      throw new Error(`Slippage ${slippage.toFixed(2)}% exceeds max allowed ${data.maxSlippage}%`);
    }

    if (result.trades.length > 0) {
      await prisma.$transaction(async (tx) => {
        await settleTrades(result.trades, tx);

        await tx.trade.createMany({
          data: result.trades.map((t) => ({
            id: t.id,
            buyOrderId: t.buyOrderId,
            sellOrderId: t.sellOrderId,
            price: t.price,
            quantity: t.quantity,
          })),
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            filledQty: result.filledQty,
            status:
              result.filledQty === order.quantity
                ? "FILLED"
                : result.filledQty > 0
                ? "PARTIALLY_FILLED"
                : "OPEN",
          },
        });
      });
    }

    // Fire-and-forget: publish orderbook, trades, and ticker updates
    publishOrderbook(engineOrder.marketId).catch(console.error);
    if (result.trades.length > 0) {
      publishTrades(engineOrder.marketId, result.trades).catch(console.error);
      publishTicker(engineOrder.marketId).catch(console.error);
    }

    return {
      orderId: order.id,
      filledQty: result.filledQty,
      trades: result.trades,
      avgPrice,
      slippage,
    };
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.repo.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new Error("Order not found");
    }

    if (order.status === "FILLED" || order.status === "CANCELLED") {
      throw new Error("Cannot cancel this order");
    }

    const remainingQty = order.quantity - order.filledQty;
    // buy -> quoteAsset  and sell -> baseAsset
    const asset = order.side === "SELL" ? order.market.baseAsset : order.market.quoteAsset;

    await this.walletService.unlockBalance(userId, asset, remainingQty);

    return this.repo.update(orderId, {
      status: "CANCELLED",
    });
  }

  async getUserOrders(userId: string) {
    return this.repo.findUserOrders(userId);
  }
}
