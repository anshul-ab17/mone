import { prisma } from "@repo/db";

export class MarketRepo {
  async findAll() {
    return prisma.market.findMany({ orderBy: { baseAsset: "asc" } });
  }

  async findById(id: string) {
    return prisma.market.findUnique({ where: { id } });
  }

  async findBySymbol(base: string, quote: string) {
    return prisma.market.findUnique({
      where: { baseAsset_quoteAsset: { baseAsset: base, quoteAsset: quote } },
    });
  }

  async create(base: string, quote: string) {
    return prisma.market.create({
      data: { id: crypto.randomUUID(), baseAsset: base, quoteAsset: quote },
    });
  }

  async getTicker(marketId: string) {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [lastTrade, agg, openTrade] = await Promise.all([
      prisma.trade.findFirst({ where: { buyOrder: { marketId } }, orderBy: { createdAt: "desc" } }),
      prisma.trade.aggregate({ where: { buyOrder: { marketId }, createdAt: { gte: since24h } }, _sum: { quantity: true } }),
      prisma.trade.findFirst({ where: { buyOrder: { marketId }, createdAt: { gte: since24h } }, orderBy: { createdAt: "asc" } }),
    ]);
    const lastPrice = lastTrade?.price ?? 0;
    const openPrice = openTrade?.price ?? lastPrice;
    const change24h = openPrice ? ((lastPrice - openPrice) / openPrice) * 100 : 0;
    return { lastPrice, volume24h: agg._sum.quantity ?? 0, change24h };
  }

  async getCandles(marketId: string, intervalMs = 60_000, limit = 100) {
    const since = new Date(Date.now() - intervalMs * limit);
    const trades = await prisma.trade.findMany({
      where: { buyOrder: { marketId }, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { price: true, quantity: true, createdAt: true },
    });
    const buckets = new Map<number, { open: number; high: number; low: number; close: number; volume: number }>();
    for (const t of trades) {
      const bucket = Math.floor(t.createdAt.getTime() / intervalMs) * intervalMs;
      const ex = buckets.get(bucket);
      if (!ex) {
        buckets.set(bucket, { open: t.price, high: t.price, low: t.price, close: t.price, volume: t.quantity });
      } else {
        ex.high = Math.max(ex.high, t.price);
        ex.low = Math.min(ex.low, t.price);
        ex.close = t.price;
        ex.volume += t.quantity;
      }
    }
    return [...buckets.entries()].sort(([a], [b]) => a - b).map(([time, ohlcv]) => ({ time: Math.floor(time / 1000), ...ohlcv }));
  }

  async getRecentTrades(marketId: string, limit = 50) {
    return prisma.trade.findMany({
      where: { buyOrder: { marketId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, price: true, quantity: true, createdAt: true },
    });
  }
}
