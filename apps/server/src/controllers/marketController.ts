import type { Context } from "hono";
import { MarketRepo } from "../repo/marketRepo";
import { getLiveTicker, getAllLiveTickers, getDepth, getKlines } from "../services/backpackService";

const repo = new MarketRepo();

export class MarketController {
  async list(c: Context) {
    const markets = await repo.findAll();
    return c.json({ markets });
  }

  async ticker(c: Context) {
    const id = c.req.param("id");
    const [market, ticker] = await Promise.all([repo.findById(id), repo.getTicker(id)]);
    if (!market) return c.json({ error: "Market not found" }, 404);
    return c.json({ ...market, ...ticker });
  }

  async candles(c: Context) {
    const id = c.req.param("id");
    const interval = Number(c.req.query("interval") ?? 60) * 1000;
    const limit = Number(c.req.query("limit") ?? 100);
    const candles = await repo.getCandles(id, interval, limit);
    return c.json({ candles });
  }

  async recentTrades(c: Context) {
    const id = c.req.param("id");
    const trades = await repo.getRecentTrades(id);
    return c.json({ trades });
  }

  // ── Backpack live data ────────────────────────────────────────────────────

  async liveTicker(c: Context) {
    const symbol = c.req.param("symbol");
    const data = await getLiveTicker(symbol);
    if (!data) return c.json({ error: "Symbol not found" }, 404);
    return c.json(data);
  }

  async allLiveTickers(c: Context) {
    const data = await getAllLiveTickers();
    return c.json({ tickers: data });
  }

  async depth(c: Context) {
    const symbol = c.req.param("symbol");
    try {
      const data = await getDepth(symbol);
      return c.json(data);
    } catch {
      return c.json({ error: "Failed to fetch depth" }, 502);
    }
  }

  async klines(c: Context) {
    const symbol = c.req.param("symbol");
    const interval = c.req.query("interval") ?? "1h";
    const limit = Number(c.req.query("limit") ?? 100);
    try {
      const klines = await getKlines(symbol, interval, limit);
      return c.json({ klines });
    } catch {
      return c.json({ klines: [] });
    }
  }

  async findOrCreateBySymbol(c: Context) {
    const base = c.req.param("base").toUpperCase();
    const quote = c.req.param("quote").toUpperCase();
    let market = await repo.findBySymbol(base, quote);
    if (!market) market = await repo.create(base, quote);
    return c.json(market);
  }
}
