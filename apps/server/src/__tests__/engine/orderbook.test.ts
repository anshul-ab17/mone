import { describe, it, expect, beforeEach } from "bun:test";
import { OrderBook } from "../../engine/v1/orderbook";
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
  timestamp: 1000,
  ...overrides,
});

describe("OrderBook", () => {
  let book: OrderBook;

  beforeEach(() => {
    book = new OrderBook();
  });

  describe("add", () => {
    it("adds a BUY order to bids", () => {
      const order = makeOrder({ side: "BUY", price: 100 });
      book.add(order);
      expect(book.bids.get(100)).toEqual([order]);
    });

    it("adds a SELL order to asks", () => {
      const order = makeOrder({ side: "SELL", price: 100 });
      book.add(order);
      expect(book.asks.get(100)).toEqual([order]);
    });

    it("groups multiple orders at the same price in FIFO order", () => {
      const o1 = makeOrder({ side: "BUY", price: 100 });
      const o2 = makeOrder({ side: "BUY", price: 100 });
      book.add(o1);
      book.add(o2);
      expect(book.bids.get(100)).toEqual([o1, o2]);
    });

    it("keeps different price levels separate", () => {
      book.add(makeOrder({ side: "BUY", price: 100 }));
      book.add(makeOrder({ side: "BUY", price: 200 }));
      expect(book.bids.get(100)).toHaveLength(1);
      expect(book.bids.get(200)).toHaveLength(1);
    });
  });

  describe("getBestBid", () => {
    it("returns null when bids is empty", () => {
      expect(book.getBestBid()).toBeNull();
    });

    it("returns the highest bid price", () => {
      book.add(makeOrder({ side: "BUY", price: 100 }));
      book.add(makeOrder({ side: "BUY", price: 200 }));
      book.add(makeOrder({ side: "BUY", price: 150 }));
      expect(book.getBestBid()).toBe(200);
    });
  });

  describe("getBestAsk", () => {
    it("returns null when asks is empty", () => {
      expect(book.getBestAsk()).toBeNull();
    });

    it("returns the lowest ask price", () => {
      book.add(makeOrder({ side: "SELL", price: 300 }));
      book.add(makeOrder({ side: "SELL", price: 100 }));
      book.add(makeOrder({ side: "SELL", price: 200 }));
      expect(book.getBestAsk()).toBe(100);
    });

    it("returns correct result when bids are empty", () => {
      book.add(makeOrder({ side: "SELL", price: 100 }));
      expect(book.getBestAsk()).toBe(100);
    });
  });

  describe("removeEmpty", () => {
    it("removes a BUY price level when its array is empty", () => {
      book.bids.set(100, []);
      book.removeEmpty(100, "BUY");
      expect(book.bids.has(100)).toBe(false);
    });

    it("removes a SELL price level when its array is empty", () => {
      book.asks.set(100, []);
      book.removeEmpty(100, "SELL");
      expect(book.asks.has(100)).toBe(false);
    });

    it("does not remove a price level that still has orders", () => {
      book.add(makeOrder({ side: "BUY", price: 100 }));
      book.removeEmpty(100, "BUY");
      expect(book.bids.has(100)).toBe(true);
    });
  });
});
