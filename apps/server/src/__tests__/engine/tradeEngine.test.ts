import { describe, it, expect } from "bun:test";
import { TradeEngine } from "../../engine/v1/tradeEngine";
import type { EngineOrder } from "../../engine/v1/types";

const makeOrder = (overrides: Partial<EngineOrder> = {}): EngineOrder => ({
  id: "order-1",
  userId: "user-1",
  marketId: "BTC-USDT",
  price: 100,
  quantity: 1,
  filled: 0,
  side: "BUY",
  timestamp: 1000,
  ...overrides,
});

describe("TradeEngine", () => {
  const engine = new TradeEngine();

  describe("execute", () => {
    it("returns a trade with the correct marketId", () => {
      const buy = makeOrder({ id: "b1", side: "BUY" });
      const sell = makeOrder({ id: "s1", side: "SELL" });
      const trade = engine.execute(buy, sell, 1, 100);
      expect(trade.marketId).toBe("BTC-USDT");
    });

    it("returns a trade with the correct buyOrderId and sellOrderId", () => {
      const buy = makeOrder({ id: "buy-id", side: "BUY" });
      const sell = makeOrder({ id: "sell-id", side: "SELL" });
      const trade = engine.execute(buy, sell, 1, 100);
      expect(trade.buyOrderId).toBe("buy-id");
      expect(trade.sellOrderId).toBe("sell-id");
    });

    it("returns a trade with the given price and quantity", () => {
      const buy = makeOrder({ side: "BUY" });
      const sell = makeOrder({ side: "SELL" });
      const trade = engine.execute(buy, sell, 3, 250);
      expect(trade.price).toBe(250);
      expect(trade.quantity).toBe(3);
    });

    it("assigns a unique id to each trade", () => {
      const buy = makeOrder({ side: "BUY" });
      const sell = makeOrder({ side: "SELL" });
      const t1 = engine.execute(buy, sell, 1, 100);
      const t2 = engine.execute(buy, sell, 1, 100);
      expect(t1.id).not.toBe(t2.id);
    });

    it("sets a timestamp on the trade", () => {
      const buy = makeOrder({ side: "BUY" });
      const sell = makeOrder({ side: "SELL" });
      const before = Date.now();
      const trade = engine.execute(buy, sell, 1, 100);
      const after = Date.now();
      expect(trade.timestamp).toBeGreaterThanOrEqual(before);
      expect(trade.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
