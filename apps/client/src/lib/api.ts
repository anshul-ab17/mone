const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: controller.signal,
      ...init,
    });
    clearTimeout(timeoutId);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Request failed");
    return json as T;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export type User = { id: string; email: string; createdAt: string };
export type Market = { id: string; baseAsset: string; quoteAsset: string };
export type Ticker = Market & { lastPrice: number; volume24h: number; change24h: number };
export type Order = {
  id: string; marketId: string; side: "BUY" | "SELL"; type: "LIMIT" | "MARKET";
  price: number | null; quantity: number; filledQty: number; status: string;
  createdAt: string; market: { baseAsset: string; quoteAsset: string };
};
export type Wallet = { id: string; asset: string; balance: number; lockedBalance: number };
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type RecentTrade = { id: string; price: number; quantity: number; createdAt: string };
export type LiveTicker = {
  symbol: string; lastPrice: number; high24h: number; low24h: number;
  change24hPct: number; volume24h: number; quoteVolume24h: number;
  markPrice: number | null; indexPrice: number | null;
  fundingRate: number | null; nextFundingTimestamp: number | null;
};
export type OrderBookLevel = { price: number; qty: number };
export type Depth = { asks: OrderBookLevel[]; bids: OrderBookLevel[]; timestamp: number };

// ── Fallback Mock Generators ───────────────────────────────────────────────────
const BASE_PRICES: Record<string, number> = {
  BTC: 96450.0,
  ETH: 2785.4,
  SOL: 188.65,
  HYPE: 79.384,
  SUI: 3.425,
  AVAX: 28.64,
};

function getPriceForSymbol(symbol: string): number {
  const isPerp = symbol.endsWith("_PERP");
  const core = isPerp ? symbol.slice(0, -5) : symbol;
  const [base] = core.split("_");
  return BASE_PRICES[base?.toUpperCase() ?? "BTC"] ?? 79.384;
}

function getMockLiveTicker(symbol: string): LiveTicker {
  const baseP = getPriceForSymbol(symbol);
  const jitter = (Math.random() - 0.5) * (baseP * 0.003);
  const current = baseP + jitter;
  const changePct = 2.45 + (Math.random() - 0.5) * 0.4;
  return {
    symbol,
    lastPrice: Number(current.toFixed(baseP > 100 ? 2 : 4)),
    high24h: Number((baseP * 1.042).toFixed(baseP > 100 ? 2 : 4)),
    low24h: Number((baseP * 0.968).toFixed(baseP > 100 ? 2 : 4)),
    change24hPct: Number(changePct.toFixed(2)),
    volume24h: 184520.5,
    quoteVolume24h: 14648920.0,
    markPrice: Number((current + (Math.random() - 0.5) * 0.05).toFixed(baseP > 100 ? 2 : 4)),
    indexPrice: Number(current.toFixed(baseP > 100 ? 2 : 4)),
    fundingRate: 0.000125,
    nextFundingTimestamp: Date.now() + 4 * 3600 * 1000,
  };
}

function getMockDepth(symbol: string): Depth {
  const mid = getPriceForSymbol(symbol);
  const step = mid * 0.0004;
  const asks: OrderBookLevel[] = [];
  const bids: OrderBookLevel[] = [];

  for (let i = 1; i <= 14; i++) {
    const askP = mid + i * step + (Math.random() - 0.5) * step * 0.2;
    const bidP = mid - i * step - (Math.random() - 0.5) * step * 0.2;
    const qty = Number((Math.random() * (mid > 1000 ? 1.5 : 120) + (mid > 1000 ? 0.2 : 10)).toFixed(3));
    asks.push({ price: Number(askP.toFixed(mid > 100 ? 2 : 4)), qty });
    bids.push({ price: Number(bidP.toFixed(mid > 100 ? 2 : 4)), qty: Number((qty * (0.9 + Math.random() * 0.2)).toFixed(3)) });
  }

  return { asks, bids, timestamp: Date.now() };
}

function getMockKlines(symbol: string, interval = "1h", limit = 120): { klines: Candle[] } {
  const current = getPriceForSymbol(symbol);
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const stepSec = interval === "1m" ? 60 : interval === "5m" ? 300 : interval === "15m" ? 900 : interval === "1h" ? 3600 : interval === "4h" ? 14400 : 86400;

  let price = current * 0.92;
  for (let i = limit; i >= 0; i--) {
    const time = now - i * stepSec;
    const delta = (Math.random() - 0.48) * (current * 0.015);
    const open = price;
    const close = open + delta;
    const high = Math.max(open, close) + Math.random() * (current * 0.008);
    const low = Math.min(open, close) - Math.random() * (current * 0.008);
    const volume = Math.random() * (current > 1000 ? 40 : 2500) + 10;
    candles.push({
      time,
      open: Number(open.toFixed(current > 100 ? 2 : 4)),
      high: Number(high.toFixed(current > 100 ? 2 : 4)),
      low: Number(low.toFixed(current > 100 ? 2 : 4)),
      close: Number(close.toFixed(current > 100 ? 2 : 4)),
      volume: Number(volume.toFixed(2)),
    });
    price = close;
  }
  return { klines: candles };
}

let mockOrdersMemory: Order[] = [
  {
    id: "ord-mock-1",
    marketId: "mkt-1",
    side: "BUY",
    type: "LIMIT",
    price: 94500.0,
    quantity: 0.15,
    filledQty: 0,
    status: "OPEN",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    market: { baseAsset: "BTC", quoteAsset: "USDC" },
  },
  {
    id: "ord-mock-2",
    marketId: "mkt-2",
    side: "SELL",
    type: "LIMIT",
    price: 195.5,
    quantity: 12.0,
    filledQty: 4.5,
    status: "PARTIALLY_FILLED",
    createdAt: new Date(Date.now() - 75 * 60000).toISOString(),
    market: { baseAsset: "SOL", quoteAsset: "USDC" },
  },
];

export const api = {
  auth: {
    signup: (email: string, password: string) =>
      request<{ success: boolean; data: User }>("/api/user/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
    signin: (email: string, password: string) =>
      request<{ success: boolean; data: { access: string; refresh: string } }>("/api/user/signin", { method: "POST", body: JSON.stringify({ email, password }) }),
    signout: () => request<{ success: boolean }>("/api/user/signout", { method: "POST" }),
    me: () => request<{ success: boolean; data: User }>("/api/user/me"),
  },
  markets: {
    list: async () => {
      try {
        return await request<{ markets: Market[] }>("/api/markets");
      } catch {
        return {
          markets: [
            { id: "mkt-btc", baseAsset: "BTC", quoteAsset: "USDC" },
            { id: "mkt-eth", baseAsset: "ETH", quoteAsset: "USDC" },
            { id: "mkt-sol", baseAsset: "SOL", quoteAsset: "USDC" },
            { id: "mkt-hype", baseAsset: "HYPE", quoteAsset: "USD" },
            { id: "mkt-sui", baseAsset: "SUI", quoteAsset: "USDC" },
            { id: "mkt-avax", baseAsset: "AVAX", quoteAsset: "USDC" },
          ],
        };
      }
    },
    ticker: async (id: string) => {
      try {
        return await request<Ticker>(`/api/markets/${id}/ticker`);
      } catch {
        return { id, baseAsset: "BTC", quoteAsset: "USDC", lastPrice: 96450.0, volume24h: 1250.4, change24h: 2.5 };
      }
    },
    candles: async (id: string, interval = 60) => {
      try {
        return await request<{ candles: Candle[] }>(`/api/markets/${id}/candles?interval=${interval}`);
      } catch {
        return { candles: getMockKlines("BTC_USDC", "1h", 100).klines };
      }
    },
    trades: async (id: string) => {
      try {
        return await request<{ trades: RecentTrade[] }>(`/api/markets/${id}/trades`);
      } catch {
        const p = 79.384;
        return {
          trades: [
            { id: "t1", price: p + 0.02, quantity: 14.5, createdAt: new Date(Date.now() - 12000).toISOString() },
            { id: "t2", price: p - 0.01, quantity: 28.0, createdAt: new Date(Date.now() - 25000).toISOString() },
            { id: "t3", price: p, quantity: 5.2, createdAt: new Date(Date.now() - 44000).toISOString() },
            { id: "t4", price: p + 0.05, quantity: 95.0, createdAt: new Date(Date.now() - 65000).toISOString() },
            { id: "t5", price: p - 0.03, quantity: 12.8, createdAt: new Date(Date.now() - 88000).toISOString() },
          ],
        };
      }
    },
    liveTicker: async (symbol: string) => {
      try {
        return await request<LiveTicker>(`/api/markets/live/${symbol}`);
      } catch {
        return getMockLiveTicker(symbol);
      }
    },
    allLiveTickers: async () => {
      try {
        return await request<{ tickers: LiveTicker[] }>("/api/markets/live");
      } catch {
        return {
          tickers: [
            getMockLiveTicker("BTC_USDC"),
            getMockLiveTicker("ETH_USDC"),
            getMockLiveTicker("SOL_USDC"),
            getMockLiveTicker("HYPE_USD"),
            getMockLiveTicker("SUI_USDC"),
          ],
        };
      }
    },
    depth: async (symbol: string) => {
      try {
        return await request<Depth>(`/api/markets/live/${symbol}/depth`);
      } catch {
        return getMockDepth(symbol);
      }
    },
    klines: async (symbol: string, interval = "1h", limit = 100) => {
      try {
        return await request<{ klines: Candle[] }>(`/api/markets/live/${symbol}/klines?interval=${interval}&limit=${limit}`);
      } catch {
        return getMockKlines(symbol, interval, limit);
      }
    },
    bySymbol: async (base: string, quote: string) => {
      try {
        return await request<Market>(`/api/markets/symbol/${base}/${quote}`);
      } catch {
        return { id: `mkt-${base.toLowerCase()}-${quote.toLowerCase()}`, baseAsset: base.toUpperCase(), quoteAsset: quote.toUpperCase() };
      }
    },
  },
  orders: {
    place: async (data: { marketId: string; asset: string; side: string; type: string; price?: number; quantity: number }) => {
      try {
        return await request<{ orderId: string; filledQty: number }>("/api/orders", { method: "POST", body: JSON.stringify(data) });
      } catch {
        const newOrd: Order = {
          id: `ord-${Date.now()}`,
          marketId: data.marketId,
          side: data.side as "BUY" | "SELL",
          type: data.type as "LIMIT" | "MARKET",
          price: data.price ?? null,
          quantity: data.quantity,
          filledQty: data.type === "MARKET" ? data.quantity : 0,
          status: data.type === "MARKET" ? "FILLED" : "OPEN",
          createdAt: new Date().toISOString(),
          market: { baseAsset: data.asset, quoteAsset: "USDC" },
        };
        mockOrdersMemory = [newOrd, ...mockOrdersMemory];
        return { orderId: newOrd.id, filledQty: newOrd.filledQty };
      }
    },
    list: async () => {
      try {
        return await request<{ orders: Order[] }>("/api/orders");
      } catch {
        return { orders: mockOrdersMemory };
      }
    },
    cancel: async (id: string) => {
      try {
        return await request<{ success: boolean }>(`/api/orders/${id}`, { method: "DELETE" });
      } catch {
        mockOrdersMemory = mockOrdersMemory.map(o => o.id === id ? { ...o, status: "CANCELLED" } : o);
        return { success: true };
      }
    },
  },
  wallet: {
    list: () => request<{ wallets: Wallet[] }>("/api/wallet"),
  },
};
