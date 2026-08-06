export interface MarketInfo {
  slug: string;
  base: string;
  quote: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  turnover24h: string;
  fundingRate: string;
  countdown: string;
  decimals: number;
  stepSize: number;
}

export const MARKETS: Record<string, MarketInfo> = {
  HYPE_USD: {
    slug: "HYPE_USD",
    base: "HYPE",
    quote: "USD",
    name: "Hyperliquid",
    price: 28.45,
    change24h: 14.82,
    high24h: 30.10,
    low24h: 24.20,
    volume24h: "4.82M HYPE",
    turnover24h: "$134.2M",
    fundingRate: "+0.0042%",
    countdown: "04:12:35",
    decimals: 2,
    stepSize: 0.1,
  },
  BTC_USDC: {
    slug: "BTC_USDC",
    base: "BTC",
    quote: "USDC",
    name: "Bitcoin",
    price: 96420.50,
    change24h: 3.42,
    high24h: 97850.00,
    low24h: 94120.00,
    volume24h: "18.4K BTC",
    turnover24h: "$1.78B",
    fundingRate: "+0.0085%",
    countdown: "04:12:35",
    decimals: 2,
    stepSize: 0.001,
  },
  SOL_USDC: {
    slug: "SOL_USDC",
    base: "SOL",
    quote: "USDC",
    name: "Solana",
    price: 184.60,
    change24h: 5.82,
    high24h: 189.20,
    low24h: 172.50,
    volume24h: "3.2M SOL",
    turnover24h: "$580.4M",
    fundingRate: "+0.0120%",
    countdown: "04:12:35",
    decimals: 2,
    stepSize: 0.01,
  },
  ETH_USDC: {
    slug: "ETH_USDC",
    base: "ETH",
    quote: "USDC",
    name: "Ethereum",
    price: 2780.25,
    change24h: 2.15,
    high24h: 2840.00,
    low24h: 2690.00,
    volume24h: "310K ETH",
    turnover24h: "$860.2M",
    fundingRate: "+0.0064%",
    countdown: "04:12:35",
    decimals: 2,
    stepSize: 0.01,
  },
  SUI_USDC: {
    slug: "SUI_USDC",
    base: "SUI",
    quote: "USDC",
    name: "Sui Network",
    price: 3.45,
    change24h: 8.65,
    high24h: 3.62,
    low24h: 3.12,
    volume24h: "24.5M SUI",
    turnover24h: "$84.2M",
    fundingRate: "+0.0092%",
    countdown: "04:12:35",
    decimals: 4,
    stepSize: 1,
  },
  AVAX_USDC: {
    slug: "AVAX_USDC",
    base: "AVAX",
    quote: "USDC",
    name: "Avalanche",
    price: 34.10,
    change24h: -1.24,
    high24h: 35.80,
    low24h: 33.50,
    volume24h: "3.6M AVAX",
    turnover24h: "$122.8M",
    fundingRate: "-0.0012%",
    countdown: "04:12:35",
    decimals: 2,
    stepSize: 0.1,
  },
};

export function getMarket(slug: string): MarketInfo {
  const clean = slug.toUpperCase().replace("-", "_").replace("/", "_");
  if (MARKETS[clean]) return MARKETS[clean]!;
  const [base = "HYPE", quote = "USD"] = clean.split("_");
  return {
    slug: clean,
    base,
    quote,
    name: base,
    price: 28.45,
    change24h: 5.20,
    high24h: 30.00,
    low24h: 26.50,
    volume24h: "1.2M",
    turnover24h: "$34M",
    fundingRate: "+0.0050%",
    countdown: "04:12:35",
    decimals: 2,
    stepSize: 0.1,
  };
}
