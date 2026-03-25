import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock @repo/db before any import that depends on it.
// The factory runs when OrderRepo first loads the module, at which point
// mock() functions are already initialised — they are re-used via the
// shared `prisma` import below.
mock.module("@repo/db", () => ({
  prisma: {
    order: {
      create:     mock(async () => ({})),
      findUnique: mock(async () => null),
      update:     mock(async () => ({})),
      findMany:   mock(async () => []),
    },
  },
}));

import { OrderRepo } from "../../repo/orderRepo";
import { prisma } from "@repo/db";

// Cast helpers — prisma methods are typed by Prisma but are mock fns at runtime.
const orderMocks = prisma.order as Record<string, any>;

const USER_ID  = "user-1";
const ORDER_ID = "order-1";

const mockOrder = {
  id:         ORDER_ID,
  userId:     USER_ID,
  marketId:   "market-1",
  side:       "BUY",
  type:       "LIMIT",
  price:      50000,
  quantity:   2,
  filledQty:  0,
  status:     "OPEN",
  createdAt:  new Date(),
  updatedAt:  new Date(),
};

const mockMarket = { id: "market-1", baseAsset: "BTC", quoteAsset: "USDT" };

describe("OrderRepo", () => {
  let repo: OrderRepo;

  beforeEach(() => {
    repo = new OrderRepo();
    orderMocks.create.mockReset();
    orderMocks.findUnique.mockReset();
    orderMocks.update.mockReset();
    orderMocks.findMany.mockReset();
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe("create", () => {
    it("calls prisma.order.create with the supplied data", async () => {
      orderMocks.create.mockResolvedValue(mockOrder);

      const result = await repo.create(mockOrder as any);

      expect(orderMocks.create).toHaveBeenCalledWith({ data: mockOrder });
      expect(result).toEqual(mockOrder);
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────

  describe("findById", () => {
    it("queries by id and includes the market relation", async () => {
      const orderWithMarket = { ...mockOrder, market: mockMarket };
      orderMocks.findUnique.mockResolvedValue(orderWithMarket);

      const result = await repo.findById(ORDER_ID);

      expect(orderMocks.findUnique).toHaveBeenCalledWith({
        where:   { id: ORDER_ID },
        include: { market: true },
      });
      expect(result).toEqual(orderWithMarket);
    });

    it("returns null when the order does not exist", async () => {
      orderMocks.findUnique.mockResolvedValue(null);

      const result = await repo.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe("update", () => {
    it("updates the order by id with the supplied data", async () => {
      const updated = { ...mockOrder, status: "CANCELLED" };
      orderMocks.update.mockResolvedValue(updated);

      const result = await repo.update(ORDER_ID, { status: "CANCELLED" });

      expect(orderMocks.update).toHaveBeenCalledWith({
        where: { id: ORDER_ID },
        data:  { status: "CANCELLED" },
      });
      expect(result).toEqual(updated);
    });
  });

  // ─── findUserOrders ──────────────────────────────────────────────────────

  describe("findUserOrders", () => {
    it("returns orders for the user sorted by createdAt desc", async () => {
      orderMocks.findMany.mockResolvedValue([mockOrder]);

      const result = await repo.findUserOrders(USER_ID);

      expect(orderMocks.findMany).toHaveBeenCalledWith({
        where:   { userId: USER_ID },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual([mockOrder]);
    });

    it("returns an empty array when the user has no orders", async () => {
      orderMocks.findMany.mockResolvedValue([]);

      const result = await repo.findUserOrders(USER_ID);

      expect(result).toEqual([]);
    });
  });
});
