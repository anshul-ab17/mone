import Link from "next/link";
import { CoinIcon } from "../components/CoinIcon";

const SERVER_API = process.env.NEXT_SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface LiveTicker {
  symbol: string; lastPrice: number; change24hPct: number; quoteVolume24h: number;
}

async function getMarkets(): Promise<LiveTicker[]> {
  try {
    const res = await fetch(`${SERVER_API}/api/markets/live`, { next: { revalidate: 10 } });
    if (!res.ok) return [];
    const { tickers } = await res.json();
    return (tickers as LiveTicker[])
      .filter(t => !t.symbol.endsWith("_PERP"))
      .sort((a, b) => b.quoteVolume24h - a.quoteVolume24h)
      .slice(0, 6);
  } catch {
    return [];
  }
}

const FEATURES = [
  {
    icon: "⚡",
    title: "Lightning Fast",
    desc: "Order matching engine processes thousands of orders per second with sub-millisecond latency.",
  },
  {
    icon: "🔒",
    title: "Non-Custodial Deposits",
    desc: "Deposit via Solana. Your assets are backed 1:1 and withdrawable at any time.",
  },
  {
    icon: "📈",
    title: "Spot & Perpetuals",
    desc: "Trade spot markets or go long/short on perpetual futures across top crypto assets.",
  },
  {
    icon: "🌐",
    title: "Real Market Data",
    desc: "Live orderbook depth, candlestick charts, and price feeds from global liquidity sources.",
  },
];

export default async function HomePage() {
  const markets = await getMarkets();

  return (
    <main className="flex flex-col min-h-0 bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center py-28 px-6 overflow-hidden">
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(128,0,32,0.18) 0%, transparent 70%)",
          }}
        />
        <p className="text-xs tracking-[0.3em] uppercase text-[#800020] mb-4 font-medium">
          The next-gen crypto exchange
        </p>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 max-w-3xl">
          Trade the future,{" "}
          <span style={{ color: "#800020" }}>today.</span>
        </h1>
        <p className="text-[#666] text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          Spot &amp; perpetual markets. Real-time orderbook. Non-custodial Solana deposits.
          No KYC. Just trade.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/trade"
            className="px-8 py-3.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#800020" }}
          >
            Start Trading
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3.5 rounded-lg font-semibold text-sm border border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#444] transition-all"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Live markets strip */}
      {markets.length > 0 && (
        <section className="border-y border-[#1a1a1a] bg-[#0d0d0d] py-6 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] text-[#444] uppercase tracking-widest mb-4">Live Markets</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {markets.map((t) => {
                const base = t.symbol.split("_")[0];
                const up = t.change24hPct >= 0;
                return (
                  <Link
                    key={t.symbol}
                    href={`/trade/${t.symbol}`}
                    className="flex flex-col gap-2 p-3 rounded-lg border border-[#1f1f1f] bg-[#111] hover:border-[#2a2a2a] hover:bg-[#161616] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <CoinIcon asset={base} size={20} />
                      <span className="text-xs font-medium text-[#888] group-hover:text-white transition-colors">
                        {base}/USDC
                      </span>
                    </div>
                    <p className="text-sm font-mono font-semibold text-white">
                      {t.lastPrice.toLocaleString("en-US", { maximumFractionDigits: t.lastPrice > 1000 ? 1 : 4 })}
                    </p>
                    <p className={`text-xs font-mono ${up ? "text-green-400" : "text-red-400"}`}>
                      {up ? "+" : ""}{t.change24hPct.toFixed(2)}%
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] text-[#444] uppercase tracking-widest text-center mb-3">Why MONE</p>
          <h2 className="text-3xl font-bold text-center mb-14">Built for serious traders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d]">
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[#555] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-6 text-center border-t border-[#1a1a1a]"
        style={{ background: "radial-gradient(ellipse 50% 80% at 50% 100%, rgba(128,0,32,0.12) 0%, transparent 70%)" }}
      >
        <h2 className="text-3xl font-bold mb-4">Ready to trade?</h2>
        <p className="text-[#555] mb-8">Open the orderbook — no account required to browse.</p>
        <Link
          href="/trade"
          className="inline-block px-10 py-3.5 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity"
          style={{ background: "#800020" }}
        >
          Open Trading Terminal →
        </Link>
      </section>
    </main>
  );
}
