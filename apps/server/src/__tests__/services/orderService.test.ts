import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { OrderService } from "../../services/orderService";
import { OrderRepo } from "../../repo/orderRepo";
import { WalletService } from "../../services/walletService";
import { engine } from "../../engine/v1";

const USER_ID = "user-1";
const ORDER_ID = "order-1";

const mockMarket = { id: "market-1", baseAsset: "BTC", quoteAsset: "USDT" };

const mockOrder = {
  id: ORDER_ID,
  userId: USER_ID,
  marketId: "market-1",
  side: "BUY" as const,
  type: "LIMIT" as const,
  price: 50000,
  quantity: 2,
  filledQty: 0,
  status: "OPEN" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  market: mockMarket,
};

describe("OrderService", () => {
  let service: OrderService;
  const spies: ReturnType<typeof spyOn>[] = [];

  const spy = <T extends object>(obj: T, method: keyof T) => {
    const s = spyOn(obj, method as any);
    spies.push(s);
    return s;
  };

  beforeEach(() => {
    service = new OrderService();
  });

  afterEach(() => {
    spies.forEach((s) => s.mockRestore());
    spies.length = 0;
  });

  const noTrades = { trades: [], filledQty: 0, remainingQty: 0 };

  //  createOrder

  describe("createOrder", () => {
    it("locks price × quantity for BUY orders", async () => {
      const lockSpy = spy(WalletService.prototype, "lockBalance").mockResolvedValue({} as any);
      spy(OrderRepo.prototype, "create").mockResolvedValue(mockOrder);
      spy(engine, "process").mockReturnValue(noTrades);

      await service.createOrder(USER_ID, {
        asset: "USDT",
        side: "BUY",
        type: "LIMIT",
        price: 50000,
        quantity: 2,
      });

      expect(lockSpy).toHaveBeenCalledWith(USER_ID, "USDT", 100000);
    });

    it("locks quantity for SELL orders", async () => {
      const lockSpy = spy(WalletService.prototype, "lockBalance").mockResolvedValue({} as any);
      spy(OrderRepo.prototype, "create").mockResolvedValue({ ...mockOrder, side: "SELL" });
      spy(engine, "process").mockReturnValue(noTrades);

      await service.createOrder(USER_ID, {
        asset: "BTC",
        side: "SELL",
        type: "LIMIT",
        price: 50000,
        quantity: 3,
      });

      expect(lockSpy).toHaveBeenCalledWith(USER_ID, "BTC", 3);
    });

    it("both locks funds and creates the order", async () => {
      const lockSpy = spy(WalletService.prototype, "lockBalance").mockResolvedValue({} as any);
      const createSpy = spy(OrderRepo.prototype, "create").mockResolvedValue(mockOrder);
      spy(engine, "process").mockReturnValue(noTrades);

      await service.createOrder(USER_ID, {
        asset: "USDT",
        side: "BUY",
        type: "LIMIT",
        price: 50000,
        quantity: 2,
      });

      expect(lockSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it("returns orderId, filledQty, trades, avgPrice, slippage", async () => {
      spy(WalletService.prototype, "lockBalance").mockResolvedValue({} as any);
      spy(OrderRepo.prototype, "create").mockResolvedValue(mockOrder);
      spy(engine, "process").mockReturnValue(noTrades);

      const result = await service.createOrder(USER_ID, {
        asset: "USDT",
        side: "BUY",
        type: "LIMIT",
        price: 50000,
        quantity: 2,
      });

      expect(result).toMatchObject({
        orderId: ORDER_ID,
        filledQty: 0,
        trades: [],
        avgPrice: 0,
        slippage: 0,
      });
    });
  });

  //  cancelOrder

  describe("cancelOrder", () => {
    it("throws if order does not exist", async () => {
      spy(OrderRepo.prototype, "findById").mockResolvedValue(null);

      await expect(service.cancelOrder(USER_ID, ORDER_ID)).rejects.toThrow("Order not found");
    });

    it("throws if order belongs to a different user", async () => {
      spy(OrderRepo.prototype, "findById").mockResolvedValue({
        ...mockOrder,
        userId: "other-user",
      });

      await expect(service.cancelOrder(USER_ID, ORDER_ID)).rejects.toThrow("Order not found");
    });

    it("throws if order is FILLED", async () => {
      spy(OrderRepo.prototype, "findById").mockResolvedValue({
        ...mockOrder,
        status: "FILLED",
      });

      await expect(service.cancelOrder(USER_ID, ORDER_ID)).rejects.toThrow("Cannot cancel this order");
    });

    it("throws if order is already CANCELLED", async () => {
      spy(OrderRepo.prototype, "findById").mockResolvedValue({
        ...mockOrder,
        status: "CANCELLED",
      });

      await expect(service.cancelOrder(USER_ID, ORDER_ID)).rejects.toThrow("Cannot cancel this order");
    });

    it("unlocks remaining qty of quoteAsset for a partially-filled BUY", async () => {
      spy(OrderRepo.prototype, "findById").mockResolvedValue({
        ...mockOrder,
        side: "BUY",
        quantity: 2,
        filledQty: 0.5,
      });
      const unlockSpy = spy(WalletService.prototype, "unlockBalance").mockResolvedValue({} as any);
      spy(OrderRepo.prototype, "update").mockResolvedValue({ ...mockOrder, status: "CANCELLED" });

      await service.cancelOrder(USER_ID, ORDER_ID);

      expect(unlockSpy).toHaveBeenCalledWith(USER_ID, "USDT", 1.5);
    });

    it("unlocks remaining qty of baseAsset for a partially-filled SELL", async () => {
      spy(OrderRepo.prototype, "findById").mockResolvedValue({
        ...mockOrder,
        side: "SELL",
        quantity: 3,
        filledQty: 1,
      });
      const unlockSpy = spy(WalletService.prototype, "unlockBalance").mockResolvedValue({} as any);
      spy(OrderRepo.prototype, "update").mockResolvedValue({ ...mockOrder, status: "CANCELLED" });

      await service.cancelOrder(USER_ID, ORDER_ID);

      expect(unlockSpy).toHaveBeenCalledWith(USER_ID, "BTC", 2);
    });

    it("unlocks full qty when no fills have occurred", async () => {
      spy(OrderRepo.prototype, "findById").mockResolvedValue({
        ...mockOrder,
        quantity: 5,
        filledQty: 0,
      });
      const unlockSpy = spy(WalletService.prototype, "unlockBalance").mockResolvedValue({} as any);
      spy(OrderRepo.prototype, "update").mockResolvedValue({ ...mockOrder, status: "CANCELLED" });

      await service.cancelOrder(USER_ID, ORDER_ID);

      expect(unlockSpy).toHaveBeenCalledWith(USER_ID, "USDT", 5);
    });

    it("updates the order status to CANCELLED", async () => {
      spy(OrderRepo.prototype, "findById").mockResolvedValue(mockOrder);
      spy(WalletService.prototype, "unlockBalance").mockResolvedValue({} as any);
      const updateSpy = spy(OrderRepo.prototype, "update").mockResolvedValue({
        ...mockOrder,
        status: "CANCELLED",
      });

      await service.cancelOrder(USER_ID, ORDER_ID);

      expect(updateSpy).toHaveBeenCalledWith(ORDER_ID, { status: "CANCELLED" });
    });
  });

  //  getUserOrders

  describe("getUserOrders", () => {
    it("returns all orders for the user from the repo", async () => {
      spy(OrderRepo.prototype, "findUserOrders").mockResolvedValue([mockOrder] as any);

      const result = await service.getUserOrders(USER_ID);

      expect(result).toEqual([mockOrder]);
    });

    it("passes the correct userId to the repo", async () => {
      const repoSpy = spy(OrderRepo.prototype, "findUserOrders").mockResolvedValue([]);

      await service.getUserOrders(USER_ID);

      expect(repoSpy).toHaveBeenCalledWith(USER_ID);
    });
  });
});
