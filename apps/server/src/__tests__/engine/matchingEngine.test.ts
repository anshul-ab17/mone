import { describe, it, expect, beforeEach, spyOn, afterEach } from "bun:test";
import { MatchingEngine } from "../../engine/v1/matchingEngine";
import { TradeEngine } from "../../engine/v1/tradeEngine";
import type { EngineOrder } from "../../engine/v1/types";

let counter = 0;
const makeOrder = (overrides: Partial<EngineOrder> = {}): EngineOrder => ({
  id: `order-${++counter}`,
  userId: "user-1",
  marketId: "BTC-USDT",
  price: 100,
  quantity: 1,
  filled: 0,
  side: "BUY",
  timeStamp: Date.now(),
  ...overrides,
});

describe("MatchingEngine", () => {
  let engine: MatchingEngine;

  beforeEach(() => {
    engine = new MatchingEngine();
  });

  // ── no match ──────────────────────────────────────────────────────────────

  describe("no match", () => {
    it("adds a BUY to the book when no asks exist", () => {
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 1 });
      engine.process(buy);
      expect(buy.filled).toBe(0);
    });

    it("adds a SELL to the book when no bids exist", () => {
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      engine.process(sell);
      expect(sell.filled).toBe(0);
    });

    it("does not fill a BUY whose price is below the best ask", () => {
      const sell = makeOrder({ side: "SELL", price: 200, quantity: 1 });
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 1 });
      engine.process(sell);
      engine.process(buy);
      expect(buy.filled).toBe(0);
      expect(sell.filled).toBe(0);
    });

    it("does not fill a SELL whose price is above the best bid", () => {
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 1 });
      const sell = makeOrder({ side: "SELL", price: 200, quantity: 1 });
      engine.process(buy);
      engine.process(sell);
      expect(sell.filled).toBe(0);
      expect(buy.filled).toBe(0);
    });
  });

  // ── full match ────────────────────────────────────────────────────────────

  describe("full match", () => {
    it("fully fills a BUY against an exact resting SELL", () => {
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 2 });
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 2 });
      engine.process(sell);
      engine.process(buy);
      expect(buy.filled).toBe(2);
      expect(sell.filled).toBe(2);
    });

    it("fully fills a SELL against an exact resting BUY", () => {
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 3 });
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 3 });
      engine.process(buy);
      engine.process(sell);
      expect(sell.filled).toBe(3);
      expect(buy.filled).toBe(3);
    });

    it("executes the trade at the ask price when a BUY crosses", () => {
      const executeSpy = spyOn(TradeEngine.prototype, "execute");
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      const buy = makeOrder({ side: "BUY", price: 150, quantity: 1 });
      engine.process(sell);
      engine.process(buy);
      expect(executeSpy).toHaveBeenCalledWith(buy, sell, 1, 100);
      executeSpy.mockRestore();
    });

    it("executes the trade at the bid price when a SELL crosses", () => {
      const executeSpy = spyOn(TradeEngine.prototype, "execute");
      const buy = makeOrder({ side: "BUY", price: 150, quantity: 1 });
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      engine.process(buy);
      engine.process(sell);
      expect(executeSpy).toHaveBeenCalledWith(buy, sell, 1, 150);
      executeSpy.mockRestore();
    });
  });

  // ── partial fill ──────────────────────────────────────────────────────────

  describe("partial fill", () => {
    it("partially fills a BUY when the resting SELL has less quantity", () => {
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 3 });
      engine.process(sell);
      engine.process(buy);
      expect(sell.filled).toBe(1);
      expect(buy.filled).toBe(1);
    });

    it("places the residual BUY into the book so it can match later", () => {
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 3 });
      engine.process(sell);
      engine.process(buy);

      const sell2 = makeOrder({ side: "SELL", price: 100, quantity: 2 });
      engine.process(sell2);
      expect(sell2.filled).toBe(2);
      expect(buy.filled).toBe(3);
    });

    it("partially fills a SELL when the resting BUY has less quantity", () => {
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 1 });
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 3 });
      engine.process(buy);
      engine.process(sell);
      expect(buy.filled).toBe(1);
      expect(sell.filled).toBe(1);
    });

    it("places the residual SELL into the book so it can match later", () => {
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 1 });
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 3 });
      engine.process(buy);
      engine.process(sell);

      const buy2 = makeOrder({ side: "BUY", price: 100, quantity: 2 });
      engine.process(buy2);
      expect(buy2.filled).toBe(2);
      expect(sell.filled).toBe(3);
    });
  });

  // ── multi-level matching ──────────────────────────────────────────────────

  describe("multi-level matching", () => {
    it("sweeps multiple ask price levels for a single BUY", () => {
      const sell1 = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      const sell2 = makeOrder({ side: "SELL", price: 110, quantity: 1 });
      const buy = makeOrder({ side: "BUY", price: 150, quantity: 2 });
      engine.process(sell1);
      engine.process(sell2);
      engine.process(buy);
      expect(buy.filled).toBe(2);
      expect(sell1.filled).toBe(1);
      expect(sell2.filled).toBe(1);
    });

    it("sweeps multiple bid price levels for a single SELL", () => {
      const buy1 = makeOrder({ side: "BUY", price: 110, quantity: 1 });
      const buy2 = makeOrder({ side: "BUY", price: 100, quantity: 1 });
      const sell = makeOrder({ side: "SELL", price: 90, quantity: 2 });
      engine.process(buy1);
      engine.process(buy2);
      engine.process(sell);
      expect(sell.filled).toBe(2);
      expect(buy1.filled).toBe(1);
      expect(buy2.filled).toBe(1);
    });

    it("stops sweeping asks when the price condition no longer holds", () => {
      const sell1 = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      const sell2 = makeOrder({ side: "SELL", price: 200, quantity: 1 });
      const buy = makeOrder({ side: "BUY", price: 150, quantity: 2 });
      engine.process(sell1);
      engine.process(sell2);
      engine.process(buy);
      expect(buy.filled).toBe(1);
      expect(sell1.filled).toBe(1);
      expect(sell2.filled).toBe(0);
    });

    it("stops sweeping bids when the price condition no longer holds", () => {
      const buy1 = makeOrder({ side: "BUY", price: 110, quantity: 1 });
      const buy2 = makeOrder({ side: "BUY", price: 50, quantity: 1 });
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 2 });
      engine.process(buy1);
      engine.process(buy2);
      engine.process(sell);
      expect(sell.filled).toBe(1);
      expect(buy1.filled).toBe(1);
      expect(buy2.filled).toBe(0);
    });
  });

  // ── market isolation ──────────────────────────────────────────────────────

  describe("market isolation", () => {
    it("orders in different markets do not interact", () => {
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 1, marketId: "BTC-USDT" });
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 1, marketId: "ETH-USDT" });
      engine.process(sell);
      engine.process(buy);
      expect(sell.filled).toBe(0);
      expect(buy.filled).toBe(0);
    });
  });

  // ── trade execution count ─────────────────────────────────────────────────

  describe("trade execution", () => {
    it("calls TradeEngine.execute once for a single match", () => {
      const executeSpy = spyOn(TradeEngine.prototype, "execute");
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      const buy = makeOrder({ side: "BUY", price: 100, quantity: 1 });
      engine.process(sell);
      engine.process(buy);
      expect(executeSpy).toHaveBeenCalledTimes(1);
      executeSpy.mockRestore();
    });

    it("calls TradeEngine.execute once per price level swept", () => {
      const executeSpy = spyOn(TradeEngine.prototype, "execute");
      const sell1 = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      const sell2 = makeOrder({ side: "SELL", price: 110, quantity: 1 });
      const buy = makeOrder({ side: "BUY", price: 150, quantity: 2 });
      engine.process(sell1);
      engine.process(sell2);
      engine.process(buy);
      expect(executeSpy).toHaveBeenCalledTimes(2);
      executeSpy.mockRestore();
    });

    it("does not call TradeEngine.execute when there is no match", () => {
      const executeSpy = spyOn(TradeEngine.prototype, "execute");
      const buy = makeOrder({ side: "BUY", price: 50, quantity: 1 });
      const sell = makeOrder({ side: "SELL", price: 100, quantity: 1 });
      engine.process(buy);
      engine.process(sell);
      expect(executeSpy).not.toHaveBeenCalled();
      executeSpy.mockRestore();
    });
  });
});
