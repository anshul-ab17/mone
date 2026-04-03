"use client";

import { useEffect, useState } from "react";
import { api, type OrderBookLevel } from "../lib/api";

export function OrderBook({ symbol }: { symbol: string }) {
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const data = await api.markets.depth(symbol);
        if (!active) return;
        setAsks([...data.asks].sort((a, b) => a.price - b.price).slice(0, 14));
        setBids([...data.bids].sort((a, b) => b.price - a.price).slice(0, 14));
      } catch {}
    }
    poll();
    const id = setInterval(poll, 1_500);
    return () => { active = false; clearInterval(id); };
  }, [symbol]);

  // Running totals for depth bars
  const askTotals = asks.reduce<number[]>((acc, a) => {
    acc.push((acc.at(-1) ?? 0) + a.qty);
    return acc;
  }, []);
  const bidTotals = bids.reduce<number[]>((acc, b) => {
    acc.push((acc.at(-1) ?? 0) + b.qty);
    return acc;
  }, []);
  const maxAskTotal = askTotals.at(-1) ?? 1;
  const maxBidTotal = bidTotals.at(-1) ?? 1;

  const bestAsk = asks[0]?.price;
  const bestBid = bids[0]?.price;
  const spread  = bestAsk && bestBid ? bestAsk - bestBid : null;
  const spreadPct = bestAsk && bestBid && bestBid > 0 ? ((bestAsk - bestBid) / bestBid) * 100 : null;

  const fmtP = (p: number) => p.toLocaleString("en-US", { maximumFractionDigits: p > 1000 ? 1 : p > 10 ? 2 : 4 });
  const fmtQ = (q: number) => q < 0.001 ? q.toFixed(6) : q < 1 ? q.toFixed(4) : q.toFixed(2);

  return (
    <div className="flex flex-col h-full text-xs font-mono bg-[#0d0d0d] select-none">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#1a1a1a] shrink-0">
        <span className="text-[#555] font-sans font-medium text-[11px] uppercase tracking-wide">Order Book</span>
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-3 px-3 py-1.5 text-[#333] border-b border-[#141414] shrink-0 text-[10px] uppercase tracking-wide">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks — reversed so lowest ask is nearest spread */}
      <div className="flex-1 overflow-hidden flex flex-col-reverse">
        {asks.map((a, i) => {
          const pct = (askTotals[i] / maxAskTotal) * 100;
          return (
            <div key={a.price} className="relative grid grid-cols-3 px-3 py-[3px] hover:bg-[#161616] transition-colors cursor-default">
              <div className="absolute inset-y-0 right-0 bg-red-900/15 transition-all" style={{ width: `${pct}%` }} />
              <span className="text-red-400 relative z-10 tabular-nums">{fmtP(a.price)}</span>
              <span className="text-right text-[#555] relative z-10 tabular-nums">{fmtQ(a.qty)}</span>
              <span className="text-right text-[#333] relative z-10 tabular-nums">{fmtQ(askTotals[i])}</span>
            </div>
          );
        })}
      </div>

      {/* Spread row */}
      <div className="px-3 py-2 border-y border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between shrink-0">
        {bestAsk ? (
          <>
            <span className={`font-semibold text-[13px] tabular-nums ${bids[0] && bestAsk >= bids[0].price ? "text-green-400" : "text-red-400"}`}>
              {fmtP(bestAsk)}
            </span>
            {spread !== null && spreadPct !== null && (
              <span className="text-[#2a2a2a] text-[10px] tabular-nums">
                {spread.toFixed(2)} ({spreadPct.toFixed(3)}%)
              </span>
            )}
          </>
        ) : (
          <span className="text-[#333]">—</span>
        )}
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-hidden">
        {bids.map((b, i) => {
          const pct = (bidTotals[i] / maxBidTotal) * 100;
          return (
            <div key={b.price} className="relative grid grid-cols-3 px-3 py-[3px] hover:bg-[#161616] transition-colors cursor-default">
              <div className="absolute inset-y-0 right-0 bg-green-900/15 transition-all" style={{ width: `${pct}%` }} />
              <span className="text-green-400 relative z-10 tabular-nums">{fmtP(b.price)}</span>
              <span className="text-right text-[#555] relative z-10 tabular-nums">{fmtQ(b.qty)}</span>
              <span className="text-right text-[#333] relative z-10 tabular-nums">{fmtQ(bidTotals[i])}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
