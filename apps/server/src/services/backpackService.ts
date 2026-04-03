/**
 * Backpack Exchange public market data proxy.
 * Respects rate limits via per-endpoint in-memory caches.
 */

const BASE = "https://api.backpack.exchange/api/v1";
const HEADERS = { "User-Agent": "mone-exchange/1.0" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackpackTicker {
  symbol: string; lastPrice: string; firstPrice: string;
  high: string; low: string; priceChange: string;
  priceChangePercent: string; volume: string; quoteVolume: string; trades: string;
}
interface BackpackMarkPrice {
  symbol: string; markPrice: string; indexPrice: string;
  fundingRate: string; nextFundingTimestamp: number;
}

export interface LiveTicker {
  symbol: string; lastPrice: number; high24h: number; low24h: number;
  change24hPct: number; volume24h: number; quoteVolume24h: number;
  markPrice: number | null; indexPrice: number | null;
  fundingRate: number | null; nextFundingTimestamp: number | null;
}

export interface OrderBookLevel { price: number; qty: number }
export interface Depth {
  asks: OrderBookLevel[]; bids: OrderBookLevel[]; timestamp: number;
}

export interface Kline {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

// ─── Tickers cache (5 s) ──────────────────────────────────────────────────────

let tickersCache: BackpackTicker[] = [];
let markPricesCache: BackpackMarkPrice[] = [];
let tickersFetchedAt = 0;

async function refreshTickers() {
  const now = Date.now();
  if (now - tickersFetchedAt < 5_000) return;
  tickersFetchedAt = now;
  const [tRes, mRes] = await Promise.all([
    fetch(`${BASE}/tickers`, { headers: HEADERS }),
    fetch(`${BASE}/markPrices`, { headers: HEADERS }),
  ]);
  if (tRes.ok) tickersCache = await tRes.json();
  if (mRes.ok) markPricesCache = await mRes.json();
}

function buildTicker(t: BackpackTicker): LiveTicker {
  // Mark prices use the same symbol as the perp ticker (e.g. BTC_USDC_PERP)
  const m = markPricesCache.find(x => x.symbol === t.symbol);
  return {
    symbol: t.symbol,
    lastPrice: parseFloat(t.lastPrice),
    high24h: parseFloat(t.high),
    low24h: parseFloat(t.low),
    change24hPct: parseFloat(t.priceChangePercent) * 100,
    volume24h: parseFloat(t.volume),
    quoteVolume24h: parseFloat(t.quoteVolume),
    markPrice: m ? parseFloat(m.markPrice) : null,
    indexPrice: m ? parseFloat(m.indexPrice) : null,
    fundingRate: m ? parseFloat(m.fundingRate) : null,
    nextFundingTimestamp: m ? m.nextFundingTimestamp : null,
  };
}

export async function getLiveTicker(symbol: string): Promise<LiveTicker | null> {
  await refreshTickers();
  const t = tickersCache.find(x => x.symbol === symbol);
  return t ? buildTicker(t) : null;
}

export async function getAllLiveTickers(): Promise<LiveTicker[]> {
  await refreshTickers();
  return tickersCache.map(buildTicker);
}

// ─── Depth cache (1.5 s per symbol) ──────────────────────────────────────────

const depthCache = new Map<string, { data: Depth; ts: number }>();

export async function getDepth(symbol: string): Promise<Depth> {
  const cached = depthCache.get(symbol);
  if (cached && Date.now() - cached.ts < 1_500) return cached.data;

  const res = await fetch(`${BASE}/depth?symbol=${symbol}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Depth fetch failed: ${res.status}`);

  const raw: { asks: [string, string][]; bids: [string, string][]; timestamp: number } = await res.json();

  const data: Depth = {
    asks: raw.asks.map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
    bids: raw.bids.map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
    timestamp: raw.timestamp,
  };
  depthCache.set(symbol, { data, ts: Date.now() });
  return data;
}

// ─── Klines cache (30 s per symbol+interval) ─────────────────────────────────

const klinesCache = new Map<string, { data: Kline[]; ts: number }>();

function intervalToMs(i: string): number {
  const map: Record<string, number> = {
    "1m": 60_000, "5m": 300_000, "15m": 900_000, "30m": 1_800_000,
    "1h": 3_600_000, "4h": 14_400_000, "1d": 86_400_000,
  };
  return map[i] ?? 3_600_000;
}

interface BackpackKline {
  start: string; end: string;
  open: string; high: string; low: string; close: string;
  volume: string; quoteVolume: string; trades: string;
}

export async function getKlines(symbol: string, interval = "1h", limit = 100): Promise<Kline[]> {
  const key = `${symbol}:${interval}:${limit}`;
  const cached = klinesCache.get(key);
  if (cached && Date.now() - cached.ts < 30_000) return cached.data;

  // Backpack startTime must be in seconds
  const startTimeSec = Math.floor(Date.now() / 1000) - Math.floor(intervalToMs(interval) / 1000) * limit;
  const url = `${BASE}/klines?symbol=${symbol}&interval=${interval}&startTime=${startTimeSec}&limit=${limit}`;
  const res = await fetch(url, { headers: HEADERS });

  if (!res.ok) return [];

  // Backpack klines: array of objects { start, end, open, high, low, close, volume, ... }
  const raw: BackpackKline[] = await res.json();
  const data: Kline[] = raw.map(r => ({
    time: Math.floor(new Date(r.start + " UTC").getTime() / 1000),
    open: parseFloat(r.open),
    high: parseFloat(r.high),
    low: parseFloat(r.low),
    close: parseFloat(r.close),
    volume: parseFloat(r.volume),
  }));

  klinesCache.set(key, { data, ts: Date.now() });
  return data;
}
