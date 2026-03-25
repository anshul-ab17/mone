import { describe, it, expect } from "bun:test";
import app from "../app";

//  Health

describe("GET /health", () => {
  it("returns 200 with status OK", async () => {
    const res = await app.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "OK" });
  });
});

//  Auth guard
// Every protected route must reject requests that carry no session cookie.

describe("Auth guard — unauthenticated requests", () => {
  const cases: { method: string; path: string }[] = [
    { method: "POST",   path: "/api/orders" },
    { method: "GET",    path: "/api/orders" },
    { method: "DELETE", path: "/api/orders/some-id" },
    { method: "GET",    path: "/api/wallet" },
    { method: "POST",   path: "/api/wallet/deposit" },
  ];

  for (const { method, path } of cases) {
    it(`${method} ${path} → 401`, async () => {
      const res = await app.fetch(
        new Request(`http://localhost${path}`, { method })
      );
      expect(res.status).toBe(401);
    });
  }
});
