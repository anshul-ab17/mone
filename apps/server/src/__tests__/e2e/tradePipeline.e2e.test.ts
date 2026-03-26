/**
 * E2E: full trade pipeline against a real DB.
 *
 * Requires Postgres + PgBouncer to be running (docker-compose up).
 * Uses unique asset names per run so tests are isolated from each other
 * and from the in-memory engine's accumulated state.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "@repo/db";
import { OrderService } from "../../services/orderService";

const RUN = crypto.randomUUID().slice(0, 8);
const BASE = `BTC-${RUN}`;
const QUOTE = `USDT-${RUN}`;

describe("E2E: trade pipeline", () => {
  const service = new OrderService();

  let marketId: string;
  let buyerId: string;
  let sellerId: string;

  beforeAll(async () => {
    const market = await prisma.market.create({
      data: { baseAsset: BASE, quoteAsset: QUOTE },
    });
    marketId = market.id;

    const buyer = await prisma.user.create({
      data: { email: `buyer-${RUN}@e2e.test`, password: "hashed" },
    });
    buyerId = buyer.id;

    const seller = await prisma.user.create({
      data: { email: `seller-${RUN}@e2e.test`, password: "hashed" },
    });
    sellerId = seller.id;

    await prisma.wallet.createMany({
      data: [
        { userId: buyerId,  asset: QUOTE, balance: 1000, lockedBalance: 0 },
        { userId: buyerId,  asset: BASE,  balance: 0,    lockedBalance: 0 },
        { userId: sellerId, asset: BASE,  balance: 2,    lockedBalance: 0 },
        { userId: sellerId, asset: QUOTE, balance: 0,    lockedBalance: 0 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.trade.deleteMany({
      where: { buyOrder: { marketId } },
    });
    await prisma.order.deleteMany({ where: { marketId } });
    await prisma.wallet.deleteMany({
      where: { userId: { in: [buyerId, sellerId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [buyerId, sellerId] } },
    });
    await prisma.market.delete({ where: { id: marketId } });
  });

  it("fully matches a LIMIT BUY against a resting LIMIT SELL and settles wallets", async () => {
    // seller posts first — rests in book
    await service.createOrder(sellerId, {
      marketId,
      asset: BASE,
      side: "SELL",
      type: "LIMIT",
      price: 100,
      quantity: 1,
    });

    // buyer crosses — triggers match
    const result = await service.createOrder(buyerId, {
      marketId,
      asset: QUOTE,
      side: "BUY",
      type: "LIMIT",
      price: 100,
      quantity: 1,
    });

    // engine result shape
    expect(result.filledQty).toBe(1);
    expect(result.trades).toHaveLength(1);
    expect(result.avgPrice).toBe(100);

    // trade persisted to DB
    const trade = await prisma.trade.findUnique({
      where: { id: result.trades[0].id },
    });
    if (!trade) throw new Error("Trade not found in DB");
    expect(trade.price).toBe(100);
    expect(trade.quantity).toBe(1);

    // buyer wallet: USDT locked released, BTC credited
    const buyerQuote = await prisma.wallet.findUnique({
      where: { userId_asset: { userId: buyerId, asset: QUOTE } },
    });
    const buyerBase = await prisma.wallet.findUnique({
      where: { userId_asset: { userId: buyerId, asset: BASE } },
    });
    if (!buyerQuote || !buyerBase) throw new Error("Buyer wallets not found");
    expect(buyerQuote.lockedBalance).toBe(0);
    expect(buyerBase.balance).toBe(1);

    // seller wallet: BTC locked released, USDT credited
    const sellerBase = await prisma.wallet.findUnique({
      where: { userId_asset: { userId: sellerId, asset: BASE } },
    });
    const sellerQuote = await prisma.wallet.findUnique({
      where: { userId_asset: { userId: sellerId, asset: QUOTE } },
    });
    if (!sellerBase || !sellerQuote) throw new Error("Seller wallets not found");
    expect(sellerBase.lockedBalance).toBe(0);
    expect(sellerQuote.balance).toBe(100);
  });

  it("rejects a MARKET order when there is no liquidity", async () => {
    // fresh user with funded QUOTE wallet
    const user = await prisma.user.create({
      data: { email: `nomarket-${RUN}@e2e.test`, password: "hashed" },
    });
    await prisma.wallet.create({
      data: { userId: user.id, asset: QUOTE, balance: 500, lockedBalance: 0 },
    });

    await expect(
      service.createOrder(user.id, {
        marketId,
        asset: QUOTE,
        side: "BUY",
        type: "MARKET",
        quantity: 1,
      })
    ).rejects.toThrow("No liquidity available");

    // funds should be unlocked (wallet back to original state)
    const wallet = await prisma.wallet.findUnique({
      where: { userId_asset: { userId: user.id, asset: QUOTE } },
    });
    if (!wallet) throw new Error("Wallet not found");
    expect(wallet.balance).toBe(500);
    expect(wallet.lockedBalance).toBe(0);

    // cleanup inline
    await prisma.order.deleteMany({ where: { userId: user.id } });
    await prisma.wallet.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it("rejects lockBalance when balance is insufficient (atomic check)", async () => {
    await expect(
      service.createOrder(buyerId, {
        marketId,
        asset: QUOTE,
        side: "BUY",
        type: "LIMIT",
        price: 100000, // needs 100,000 USDT — buyer only has ~900 left
        quantity: 1,
      })
    ).rejects.toThrow("INSUFFICIENT_BALANCE");
  });
});
