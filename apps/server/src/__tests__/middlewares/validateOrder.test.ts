import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { validateOrder } from "../../middlewares/validateOrder";

// Mount the middleware on a minimal test app to get real Hono context behaviour
const testApp = new Hono();
testApp.post("/", validateOrder, (c) => c.json({ ok: true }));

const post = (body: unknown) =>
  testApp.fetch(
    new Request("http://test/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

describe("validateOrder middleware", () => {
  //  valid inputs

  it("accepts a valid LIMIT order", async () => {
    const res = await post({ asset: "BTC", side: "BUY", type: "LIMIT", price: 50000, quantity: 1 });
    expect(res.status).toBe(200);
  });

  it("accepts a valid MARKET order (no price)", async () => {
    const res = await post({ asset: "BTC", side: "SELL", type: "MARKET", quantity: 2 });
    expect(res.status).toBe(200);
  });

  it("accepts a SELL LIMIT order", async () => {
    const res = await post({ asset: "ETH", side: "SELL", type: "LIMIT", price: 3000, quantity: 10 });
    expect(res.status).toBe(200);
  });

  //  LIMIT/MARKET price rules

  it("rejects a LIMIT order without price", async () => {
    const res = await post({ asset: "BTC", side: "BUY", type: "LIMIT", quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("rejects a MARKET order that includes a price", async () => {
    const res = await post({ asset: "BTC", side: "SELL", type: "MARKET", price: 50000, quantity: 1 });
    expect(res.status).toBe(400);
  });

  //  quantity validation

  it("rejects an order with missing quantity", async () => {
    const res = await post({ asset: "BTC", side: "BUY", type: "MARKET" });
    expect(res.status).toBe(400);
  });

  it("rejects an order with zero quantity", async () => {
    const res = await post({ asset: "BTC", side: "BUY", type: "MARKET", quantity: 0 });
    expect(res.status).toBe(400);
  });

  it("rejects an order with negative quantity", async () => {
    const res = await post({ asset: "BTC", side: "BUY", type: "MARKET", quantity: -1 });
    expect(res.status).toBe(400);
  });

  //  field validation

  it("rejects an order with an invalid side", async () => {
    const res = await post({ asset: "BTC", side: "HOLD", type: "MARKET", quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("rejects an order with an invalid type", async () => {
    const res = await post({ asset: "BTC", side: "BUY", type: "STOP", quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("rejects an order with missing asset", async () => {
    const res = await post({ side: "BUY", type: "MARKET", quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("rejects an empty body", async () => {
    const res = await post({});
    expect(res.status).toBe(400);
  });

  //  error shape

  it("returns an error object on failure", async () => {
    const res = await post({ asset: "BTC", side: "BUY", type: "LIMIT", quantity: 1 });
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});
