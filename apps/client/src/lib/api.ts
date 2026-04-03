const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json as T;
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
    list: () => request<{ markets: Market[] }>("/api/markets"),
    ticker: (id: string) => request<Ticker>(`/api/markets/${id}/ticker`),
    candles: (id: string, interval = 60) => request<{ candles: Candle[] }>(`/api/markets/${id}/candles?interval=${interval}`),
    trades: (id: string) => request<{ trades: RecentTrade[] }>(`/api/markets/${id}/trades`),
    liveTicker: (symbol: string) => request<LiveTicker>(`/api/markets/live/${symbol}`),
    allLiveTickers: () => request<{ tickers: LiveTicker[] }>("/api/markets/live"),
    depth: (symbol: string) => request<Depth>(`/api/markets/live/${symbol}/depth`),
    klines: (symbol: string, interval = "1h", limit = 100) =>
      request<{ klines: Candle[] }>(`/api/markets/live/${symbol}/klines?interval=${interval}&limit=${limit}`),
    bySymbol: (base: string, quote: string) => request<Market>(`/api/markets/symbol/${base}/${quote}`),
  },
  orders: {
    place: (data: { marketId: string; asset: string; side: string; type: string; price?: number; quantity: number }) =>
      request<{ orderId: string; filledQty: number }>("/api/orders", { method: "POST", body: JSON.stringify(data) }),
    list: () => request<{ orders: Order[] }>("/api/orders"),
    cancel: (id: string) => request<{ success: boolean }>(`/api/orders/${id}`, { method: "DELETE" }),
  },
  wallet: {
    list: () => request<{ wallets: Wallet[] }>("/api/wallet"),
  },
};
