import type { CreateOrderInput } from "@repo/types";
import { OrderRepo } from "../repo/orderRepo";
import { WalletService } from "./walletService";

export class OrderService {
  private repo = new OrderRepo();
  private walletService = new WalletService();

  async createOrder(userId: string, data: CreateOrderInput) {
    let requiredAmount = 0;

    if (data.side === "BUY") {
      requiredAmount = data.price! * data.quantity;
    } else {
      requiredAmount = data.quantity;
    }
 
    await this.walletService.lockBalance(userId, data.asset,requiredAmount
    );
 
    const order = await this.repo.create({
      ...data,
      userId,
      filledQty: 0,
      status: "OPEN",
    });

    return order;
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