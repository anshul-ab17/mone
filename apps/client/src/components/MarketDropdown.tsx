"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type LiveTicker } from "../lib/api";
import { CoinIcon } from "./CoinIcon";

type Tab = "spot" | "futures";

const isPerp = (s: string) => s.endsWith("_PERP");
const displayName = (s: string) => s.replace("_PERP", "").replace("_", "/");
const getBase = (s: string) => s.replace("_PERP", "").split("_")[0];
const fmtVol = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(1)}K` : `$${v.toFixed(0)}`;
const fmtPrice = (p: number) =>
  p.toLocaleString("en-US", { maximumFractionDigits: p > 1000 ? 1 : p > 1 ? 4 : 6 });

export function MarketDropdown({ currentSymbol }: { currentSymbol: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tickers, setTickers] = useState<LiveTicker[]>([]);
  const [tab, setTab] = useState<Tab>(isPerp(currentSymbol) ? "futures" : "spot");
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.markets.allLiveTickers().then(r => setTickers(r.tickers)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = tickers
    .filter(t => tab === "futures" ? isPerp(t.symbol) : !isPerp(t.symbol))
    .filter(t => t.symbol.toLowerCase().includes(search.toLowerCase().replace("/", "_")))
    .sort((a, b) => b.quoteVolume24h - a.quoteVolume24h);

  const base = getBase(currentSymbol);
  const quote = currentSymbol.replace("_PERP", "").split("_")[1] ?? "USDC";

  function navigate(symbol: string) {
    router.push(`/trade/${symbol}`);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 px-4 h-12 hover:bg-[#161616] transition-colors border-r border-[#1f1f1f]"
      >
        <CoinIcon asset={base} size={24} />
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-sm">{base}<span className="text-[#555] font-normal">/{quote}</span></span>
            {isPerp(currentSymbol) && (
              <span className="text-[9px] bg-[#2a2a2a] text-[#777] px-1 py-0.5 rounded font-mono">PERP</span>
            )}
          </div>
        </div>
        <svg className={`w-3 h-3 text-[#444] ml-1 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute top-full left-0 z-50 w-80 bg-[#111] border border-[#222] rounded-b-xl shadow-2xl overflow-hidden">
          {/* Spot / Futures tabs */}
          <div className="flex border-b border-[#1f1f1f]">
            {(["spot", "futures"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${tab === t ? "text-white border-b-2 border-[#800020]" : "text-[#444] hover:text-[#777]"}`}>
                {t === "futures" ? "Futures (Perp)" : "Spot"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-2 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-[#444] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
              </svg>
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search markets"
                className="bg-transparent text-white text-sm placeholder:text-[#333] outline-none w-full" />
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto] px-3 py-1 text-[10px] text-[#444] uppercase tracking-wide border-b border-[#1a1a1a]">
            <span>Market / Vol</span>
            <span className="text-right pr-4">Price</span>
            <span className="text-right w-14">Change</span>
          </div>

          {/* Rows */}
          <div className="max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-[#333] text-xs py-8">No markets found</p>
            ) : filtered.map(t => {
              const b = getBase(t.symbol);
              const isActive = t.symbol === currentSymbol;
              return (
                <button key={t.symbol} onClick={() => navigate(t.symbol)}
                  className={`w-full grid grid-cols-[1fr_auto_auto] items-center px-3 py-2 hover:bg-[#1a1a1a] transition-colors text-left ${isActive ? "bg-[#1a1a1a]" : ""}`}>
                  <div className="flex items-center gap-2">
                    <CoinIcon asset={b} size={20} />
                    <div>
                      <p className="text-white text-xs font-medium leading-none">{displayName(t.symbol)}</p>
                      <p className="text-[#444] text-[10px] mt-0.5">{fmtVol(t.quoteVolume24h)}</p>
                    </div>
                  </div>
                  <p className="text-white text-xs font-mono pr-4 text-right">{fmtPrice(t.lastPrice)}</p>
                  <p className={`text-xs font-mono w-14 text-right ${t.change24hPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {t.change24hPct >= 0 ? "+" : ""}{t.change24hPct.toFixed(2)}%
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
