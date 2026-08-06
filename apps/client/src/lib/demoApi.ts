// ─────────────────────────────────────────────────────────────────────────────
// demoApi.ts — mock "API" data source for the /demo trading experience.
//
// Everything here is synthetic but realistic and DETERMINISTIC per market slug
// (seeded PRNG), so the demo renders stable, believable order books / candles /
// trades instead of reshuffling on every re-render. The real app talks to the
// backend via lib/api.ts; this module is purely for the front-end demo.
// ─────────────────────────────────────────────────────────────────────────────

import { MARKETS, type MarketInfo } from "./markets";

// ── seeded PRNG (mulberry32) ────────────────────────────────────────────────
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DemoTicker {
  slug: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  turnover24h: string;
  fundingRate: string;
  countdown: string;
  markPrice: number;
}

export interface OrderBookRow {
  price: number;
  size: number;
  total: number;
  depthPct: number;
}

export interface TradeItem {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  time: string;
}

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface DemoBalance {
  coin: string;
  total: string;
  available: string;
  usdValue: string;
}

export interface DemoPosition {
  pair: string;
  side: "LONG" | "SHORT";
  size: string;
  entryPrice: number;
  markPrice: number;
  liqPrice: number;
  margin: string;
  unrealizedPnl: number;
  pnlPct: number;
}

export function getDemoMarket(slug: string): MarketInfo {
  return (
    MARKETS[slug.toUpperCase()] ?? {
      slug: slug.toUpperCase(),
      base: slug.split("_")[0] ?? "HYPE",
      quote: slug.split("_")[1] ?? "USD",
      name: slug.split("_")[0] ?? "Hype",
      price: 28.45,
      change24h: 5.2,
      high24h: 30.1,
      low24h: 26.5,
      volume24h: "1.2M",
      turnover24h: "$34M",
      fundingRate: "+0.0050%",
      countdown: "04:12:35",
      decimals: 2,
      stepSize: 0.1,
    }
  );
}

export function getDemoTicker(slug: string): DemoTicker {
  const m = getDemoMarket(slug);
  const rnd = mulberry32(hashSeed(slug + ":ticker"));
  const drift = (rnd() - 0.45) * 0.06; // ±3%
  const price = +(m.price * (1 + drift)).toFixed(m.decimals);
  const change = +(m.change24h + (rnd() - 0.5) * 2).toFixed(2);
  const high = +(price * (1 + 0.01 + rnd() * 0.03)).toFixed(m.decimals);
  const low = +(price * (1 - 0.01 - rnd() * 0.03)).toFixed(m.decimals);
  const turnover = (price * (800_000 + rnd() * 4_000_000)) / 1_000_000;
  return {
    slug,
    price,
    change24h: change,
    high24h: high,
    low24h: low,
    volume24h: `${(1.2 + rnd() * 5).toFixed(2)}M ${m.base}`,
    turnover24h: `$${turnover.toFixed(1)}M`,
    fundingRate: `${change >= 0 ? "+" : ""}${(0.002 + rnd() * 0.01).toFixed(4)}%`,
    countdown: "04:12:35",
    markPrice: +(price * (1 + (rnd() - 0.5) * 0.0008)).toFixed(m.decimals),
  };
}

export function getDemoOrderBook(slug: string): { asks: OrderBookRow[]; bids: OrderBookRow[] } {
  const m = getDemoMarket(slug);
  const rnd = mulberry32(hashSeed(slug + ":book"));
  const step = m.price * 0.0004;
  const asks: OrderBookRow[] = [];
  const bids: OrderBookRow[] = [];
  let cumAsk = 0;
  for (let i = 8; i >= 1; i--) {
    const price = +(m.price + i * step).toFixed(m.decimals);
    const size = +((0.5 + rnd() * 1.4) * (1 + (8 - i) * 0.08)).toFixed(2);
    cumAsk += size;
    asks.push({ price, size, total: +cumAsk.toFixed(2), depthPct: Math.min(100, (cumAsk / 14) * 100) });
  }
  let cumBid = 0;
  for (let i = 1; i <= 8; i++) {
    const price = +(m.price - i * step).toFixed(m.decimals);
    const size = +((0.5 + rnd() * 1.4) * (1 + i * 0.08)).toFixed(2);
    cumBid += size;
    bids.push({ price, size, total: +cumBid.toFixed(2), depthPct: Math.min(100, (cumBid / 14) * 100) });
  }
  return { asks, bids };
}

export function getDemoTrades(slug: string): TradeItem[] {
  const m = getDemoMarket(slug);
  const rnd = mulberry32(hashSeed(slug + ":trades"));
  const now = Date.now();
  const list: TradeItem[] = [];
  for (let i = 0; i < 18; i++) {
    const side: "buy" | "sell" = rnd() > 0.5 ? "buy" : "sell";
    const price = +(m.price + (rnd() - 0.5) * m.price * 0.0012).toFixed(m.decimals);
    const size = +((0.1 + rnd() * 2.4) * (1 + (i % 4) * 0.3)).toFixed(2);
    list.push({
      id: `dt-${slug}-${i}`,
      price,
      size,
      side,
      time: new Date(now - i * (2500 + rnd() * 4000)).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });
  }
  return list;
}

export function getDemoCandles(slug: string, tf: string, count = 60): Candle[] {
  const m = getDemoMarket(slug);
  const rnd = mulberry32(hashSeed(slug + ":candles:" + tf));
  const span = tf === "1H" ? 3600 : tf === "15M" ? 900 : tf === "5M" ? 300 : tf === "1D" ? 86400 : 60;
  const vol = m.price * 0.012;
  const out: Candle[] = [];
  let prev = m.price * (1 - m.change24h / 200);
  const now = Math.floor(Date.now() / 1000);
  for (let i = count - 1; i >= 0; i--) {
    const o = prev;
    const drift = (rnd() - 0.5) * 2;
    const c = +(o + drift * vol).toFixed(m.decimals);
    const h = +(Math.max(o, c) + rnd() * vol * 0.6).toFixed(m.decimals);
    const l = +(Math.min(o, c) - rnd() * vol * 0.6).toFixed(m.decimals);
    out.push({ t: now - i * span, o, h, l, c });
    prev = c;
  }
  return out;
}

export function getDemoMarkets(): MarketInfo[] {
  return Object.values(MARKETS);
}

export function getDemoBalances(): DemoBalance[] {
  return [
    { coin: "USD / USDC", total: "$10,450.20", available: "$8,850.20", usdValue: "$10,450.20" },
    { coin: "HYPE", total: "250.00 HYPE", available: "0.00 HYPE", usdValue: "$7,112.50" },
    { coin: "SOL", total: "40.00 SOL", available: "0.00 SOL", usdValue: "$7,384.00" },
    { coin: "BTC", total: "0.1500 BTC", available: "0.1500 BTC", usdValue: "$14,463.08" },
    { coin: "ETH", total: "1.2000 ETH", available: "0.9000 ETH", usdValue: "$3,336.30" },
  ];
}

export function getDemoPositions(): DemoPosition[] {
  const m = getDemoMarket("HYPE_USD");
  const s = getDemoMarket("SOL_USDC");
  return [
    {
      pair: "HYPE/USD",
      side: "LONG",
      size: "250.00 HYPE",
      entryPrice: 26.4,
      markPrice: m.price,
      liqPrice: 19.8,
      margin: "$330.00 (20x)",
      unrealizedPnl: +(250 * (m.price - 26.4)).toFixed(2),
      pnlPct: +(((m.price - 26.4) / 26.4) * 100 * 20).toFixed(2),
    },
    {
      pair: "SOL/USDC",
      side: "LONG",
      size: "40.00 SOL",
      entryPrice: 178.5,
      markPrice: s.price,
      liqPrice: 142.1,
      margin: "$738.40 (10x)",
      unrealizedPnl: +(40 * (s.price - 178.5)).toFixed(2),
      pnlPct: +(((s.price - 178.5) / 178.5) * 100 * 10).toFixed(2),
    },
  ];
}

// Lightweight random-walk tick for the live price pill in the demo header.
export function nextTick(price: number, decimals: number): number {
  const drift = (Math.random() - 0.5) * price * 0.0009;
  return +(price + drift).toFixed(decimals);
}
