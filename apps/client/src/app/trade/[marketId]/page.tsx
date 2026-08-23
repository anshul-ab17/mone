"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, type Market, type LiveTicker } from "../../../lib/api";
import { OrderBook } from "../../../components/OrderBook";
import { OrderForm } from "../../../components/OrderForm";
import { PriceChart } from "../../../components/PriceChart";
import { OpenOrders } from "../../../components/OpenOrders";
import { RecentTrades } from "../../../components/RecentTrades";
import { MarketDropdown } from "../../../components/MarketDropdown";

export default function TradingPage() {
  const { marketId: symbol } = useParams<{ marketId: string }>();

  const [live, setLive] = useState<LiveTicker | null>(null);
  const [dbMarket, setDbMarket] = useState<Market | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [bottomTab, setBottomTab] = useState<"orders" | "trades">("orders");
  const [orderKey, setOrderKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPerp = symbol.endsWith("_PERP");
  const core = isPerp ? symbol.slice(0, -5) : symbol;
  const [base, quote = "USDC"] = core.split("_");

  useEffect(() => {
    setDbLoading(true);
    api.markets.bySymbol(base, quote)
      .then(setDbMarket)
      .catch(() => setDbMarket(null))
      .finally(() => setDbLoading(false));
  }, [base, quote]);

  useEffect(() => {
    const fetchLive = () => api.markets.liveTicker(symbol).then(setLive).catch(() => {});
    fetchLive();
    intervalRef.current = setInterval(fetchLive, 5_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [symbol]);

  const price   = live?.lastPrice ?? 0;
  const change  = live?.change24hPct ?? 0;
  const high    = live?.high24h ?? 0;
  const low     = live?.low24h ?? 0;
  const vol     = live?.quoteVolume24h ?? 0;
  const priceUp = change >= 0;

  const fmtP = (p: number) =>
    p > 0 ? p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: p > 1000 ? 2 : 4 }) : "—";
  const fmtVol = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K` : v > 0 ? v.toFixed(0) : "—";

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1166px] mx-auto px-4 sm:px-6 py-2.5 min-h-0 h-[calc(100vh-3.5rem)] overflow-hidden bg-[#07090e]">
      <div className="flex flex-1 gap-2.5 min-h-0 overflow-hidden">

        {/* ── Left Column: Ticker + Chart + Bottom Tabs ─────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 bg-[#0c0f17] border border-[#181f2b] rounded-xl overflow-hidden shadow-xl">
          {/* Top Bar */}
          <div className="flex items-center border-b border-[#181f2b] shrink-0 bg-[#0d111a] h-12 px-3">
            <MarketDropdown currentSymbol={symbol} />

            {/* Stats strip */}
            <div className="flex items-center gap-0 px-2 min-w-0 overflow-x-auto scrollbar-none">
              <div className="px-3 shrink-0">
                <p className={`text-sm font-mono font-bold tabular-nums ${priceUp ? "text-[#00c087]" : "text-[#f84960]"}`}>
                  {fmtP(price)}
                </p>
                {live?.markPrice && (
                  <p className="text-[10px] text-[#475569] font-mono tabular-nums leading-none mt-0.5">
                    Mark {fmtP(live.markPrice)}
                  </p>
                )}
              </div>

              <StatDivider />
              <StatItem label="24H Change" value={`${change >= 0 ? "+" : ""}${change.toFixed(2)}%`} colored up={priceUp} />
              <StatDivider />
              <StatItem label="24H High" value={fmtP(high)} />
              <StatDivider />
              <StatItem label="24H Low"  value={fmtP(low)} />
              <StatDivider />
              <StatItem label={`24H Vol (${quote})`} value={fmtVol(vol)} />

              {live?.fundingRate != null && (
                <>
                  <StatDivider />
                  <StatItem
                    label="Funding / 8h"
                    value={`${live.fundingRate >= 0 ? "+" : ""}${(live.fundingRate * 100).toFixed(4)}%`}
                    colored up={live.fundingRate >= 0}
                  />
                </>
              )}
            </div>
          </div>

          {/* Chart area */}
          <div className="flex-1 min-h-0 bg-[#0c0f17]">
            <PriceChart symbol={symbol} />
          </div>

          {/* Bottom tabs */}
          <div className="h-44 shrink-0 border-t border-[#181f2b] flex flex-col bg-[#0d111a]">
            <div className="flex border-b border-[#181f2b] text-xs shrink-0 px-3">
              {(["orders", "trades"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBottomTab(t)}
                  className={`px-3 py-2.5 font-medium text-xs transition-colors border-b-2 ${
                    bottomTab === t
                      ? "text-white border-[#38bdf8]"
                      : "text-[#64748b] hover:text-[#94a3b8] border-transparent"
                  }`}
                >
                  {t === "orders" ? "Open Orders" : "Recent Trades"}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {bottomTab === "orders"
                ? <OpenOrders refreshKey={orderKey} />
                : dbMarket
                  ? <RecentTrades marketId={dbMarket.id} />
                  : <div className="flex items-center justify-center h-full text-[#475569] text-xs">No trades yet</div>
              }
            </div>
          </div>
        </div>

        {/* ── Middle Column: Order Book ──────────────────────────────────────── */}
        <div className="w-60 shrink-0 bg-[#0c0f17] border border-[#181f2b] rounded-xl overflow-hidden shadow-xl flex flex-col">
          <OrderBook symbol={symbol} />
        </div>

        {/* ── Right Column: Order Placement ─────────────────────────────────── */}
        <div className="w-72 shrink-0 bg-[#0c0f17] border border-[#181f2b] rounded-xl overflow-auto shadow-xl flex flex-col">
          {dbLoading ? (
            <div className="flex items-center justify-center h-full">
              <span className="w-5 h-5 border-2 border-[#1e293b] border-t-[#38bdf8] rounded-full animate-spin" />
            </div>
          ) : dbMarket ? (
            <OrderForm market={dbMarket} onOrderPlaced={() => setOrderKey((k) => k + 1)} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
              <p className="text-[#64748b] text-sm leading-relaxed">
                Trading {base}/{quote} is not available yet.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatItem({ label, value, colored, up }: {
  label: string; value: string; colored?: boolean; up?: boolean;
}) {
  return (
    <div className="px-3 shrink-0 space-y-0.5">
      <p className="text-[#64748b] text-[10px] uppercase tracking-wide leading-none">{label}</p>
      <p className={`font-mono text-xs font-medium tabular-nums ${colored ? (up ? "text-[#00c087]" : "text-[#f84960]") : "text-[#cbd5e1]"}`}>
        {value}
      </p>
    </div>
  );
}

function StatDivider() {
  return <div className="w-px h-5 bg-[#181f2b] shrink-0" />;
}
