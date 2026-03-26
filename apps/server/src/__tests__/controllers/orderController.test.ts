import { describe, it, expect, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { OrderController } from "../../controllers/orderController";
import { OrderService } from "../../services/orderService";
import type { CreateOrderInput } from "@repo/types";

type Variables = { userId: string; validatedBody: CreateOrderInput };

const mockOrder = {
  id: "order-1",
  userId: "user-1",
  marketId: "market-1",
  side: "BUY",
  type: "LIMIT",
  price: 50000,
  quantity: 2,
  filledQty: 0,
  status: "OPEN",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─ Test app setup 
// Bypasses real auth — injects userId and validatedBody directly into context.

const controller = new OrderController();
const testApp = new Hono<{ Variables: Variables }>();

testApp.use("*", async (c, next) => {
  c.set("userId", "user-1");
  await next();
});

testApp.post("/orders", async (c, next) => {
  c.set("validatedBody", await c.req.json());
  await next();
}, controller.createOrder);

testApp.delete("/orders/:id", controller.cancelOrder);
testApp.get("/orders", controller.getOrders);

// ─ Helpers ─

const spies: ReturnType<typeof spyOn>[] = [];
const spy = (method: keyof typeof OrderService.prototype) => {
  const s = spyOn(OrderService.prototype, method as any);
  spies.push(s);
  return s;
};

afterEach(() => {
  spies.forEach((s) => s.mockRestore());
  spies.length = 0;
});

// ─ Tests ─

describe("OrderController", () => {
  describe("POST /orders — createOrder", () => {
    it("returns 201 with the created order", async () => {
      spy("createOrder").mockResolvedValue(mockOrder as any);

      const res = await testApp.fetch(
        new Request("http://test/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ asset: "USDT", side: "BUY", type: "LIMIT", price: 50000, quantity: 2 }),
        })
      );

      expect(res.status).toBe(201);
      expect(await res.json()).toMatchObject({ id: "order-1", status: "OPEN" });
    });

    it("passes userId and validated body to the service", async () => {
      const createSpy = spy("createOrder").mockResolvedValue(mockOrder as any);
      const body = { asset: "USDT", side: "BUY", type: "LIMIT", price: 50000, quantity: 2 };

      await testApp.fetch(
        new Request("http://test/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

      expect(createSpy).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("DELETE /orders/:id — cancelOrder", () => {
    it("returns 200 with the cancelled order", async () => {
      spy("cancelOrder").mockResolvedValue({ ...mockOrder, status: "CANCELLED" } as any);

      const res = await testApp.fetch(
        new Request("http://test/orders/order-1", { method: "DELETE" })
      );

      expect(res.status).toBe(200);
      expect((await res.json() as any).status).toBe("CANCELLED");
    });

    it("passes userId and orderId to the service", async () => {
      const cancelSpy = spy("cancelOrder").mockResolvedValue({ ...mockOrder, status: "CANCELLED" } as any);

      await testApp.fetch(
        new Request("http://test/orders/order-abc", { method: "DELETE" })
      );

      expect(cancelSpy).toHaveBeenCalledWith("user-1", "order-abc");
    });
  });

  describe("GET /orders — getOrders", () => {
    it("returns 200 with the list of orders", async () => {
      spy("getUserOrders").mockResolvedValue([mockOrder] as any);

      const res = await testApp.fetch(new Request("http://test/orders"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([
        expect.objectContaining({ id: "order-1", status: "OPEN", userId: "user-1" }),
      ]);
    });

    it("passes userId to the service", async () => {
      const getOrdersSpy = spy("getUserOrders").mockResolvedValue([]);

      await testApp.fetch(new Request("http://test/orders"));

      expect(getOrdersSpy).toHaveBeenCalledWith("user-1");
    });

    it("returns an empty array when user has no orders", async () => {
      spy("getUserOrders").mockResolvedValue([]);

      const res = await testApp.fetch(new Request("http://test/orders"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });
  });
});
