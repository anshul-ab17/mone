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
    <div className="flex flex-col flex-1 overflow-hidden bg-[#0a0a0a]">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-stretch border-b border-[#1f1f1f] shrink-0 bg-[#0d0d0d] h-12">
        <MarketDropdown currentSymbol={symbol} />

        {/* Stats strip */}
        <div className="flex items-center gap-0 px-4 min-w-0 overflow-x-auto">
          {/* Current price */}
          <div className="pr-5 shrink-0">
            <p className={`text-sm font-mono font-bold tabular-nums ${priceUp ? "text-green-400" : "text-red-400"}`}>
              {fmtP(price)}
            </p>
            {live?.markPrice && (
              <p className="text-[10px] text-[#3a3a3a] font-mono tabular-nums leading-none mt-0.5">
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
          <StatItem label={`Vol (${quote})`} value={fmtVol(vol)} />

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

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Chart + bottom panel */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <div className="flex-1 min-h-0">
            <PriceChart symbol={symbol} />
          </div>

          {/* Bottom tabs */}
          <div className="h-44 shrink-0 border-t border-[#1f1f1f] flex flex-col bg-[#0d0d0d]">
            <div className="flex border-b border-[#1a1a1a] text-xs shrink-0">
              {(["orders", "trades"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBottomTab(t)}
                  className={`px-4 py-2.5 font-medium transition-colors ${
                    bottomTab === t
                      ? "text-white border-b-2 border-[#800020]"
                      : "text-[#444] hover:text-[#777]"
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
                  : <div className="flex items-center justify-center h-full text-[#333] text-xs">No trades yet</div>
              }
            </div>
          </div>
        </div>

        {/* Order book */}
        <div className="w-56 shrink-0 border-l border-[#1f1f1f] overflow-hidden bg-[#0d0d0d]">
          <OrderBook symbol={symbol} />
        </div>

        {/* Buy / Sell panel */}
        <div className="w-72 shrink-0 border-l border-[#1f1f1f] bg-[#0d0d0d] overflow-auto">
          {dbLoading ? (
            <div className="flex items-center justify-center h-full">
              <span className="w-4 h-4 border-2 border-[#2a2a2a] border-t-[#555] rounded-full animate-spin" />
            </div>
          ) : dbMarket ? (
            <OrderForm market={dbMarket} onOrderPlaced={() => setOrderKey((k) => k + 1)} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
              <p className="text-[#444] text-sm leading-relaxed">
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
    <div className="px-4 shrink-0 space-y-0.5">
      <p className="text-[#3a3a3a] text-[10px] uppercase tracking-wide leading-none">{label}</p>
      <p className={`font-mono text-xs font-medium tabular-nums ${colored ? (up ? "text-green-400" : "text-red-400") : "text-[#888]"}`}>
        {value}
      </p>
    </div>
  );
}

function StatDivider() {
  return <div className="w-px h-5 bg-[#1a1a1a] shrink-0" />;
}
