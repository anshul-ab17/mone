"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { api, type RecentTrade } from "../lib/api";

export function RecentTrades({ marketId }: { marketId: string }) {
  const [trades, setTrades] = useState<RecentTrade[]>([]);

  useEffect(() => {
    api.markets.trades(marketId).then((r) => setTrades(r.trades)).catch(() => {});
  }, [marketId]);

  useWebSocket([`trades:${marketId}`], (msg: any) => {
    if (msg?.channel === `trades:${marketId}` && msg.data) {
      setTrades((prev) => [msg.data as RecentTrade, ...prev].slice(0, 50));
    }
  });

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#333] text-xs">
        No trades yet
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#0d0d0d]">
          <tr className="text-[#3a3a3a] uppercase tracking-wide text-[10px]">
            <th className="text-right px-3 py-2 font-medium">Price</th>
            <th className="text-right px-3 py-2 font-medium">Size</th>
            <th className="text-right px-3 py-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={t.id} className={`border-t border-[#141414] hover:bg-[#111] transition-colors ${i === 0 ? "opacity-100" : ""}`}>
              <td className="px-3 py-1.5 text-right font-mono text-white">{t.price.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-[#666]">{t.quantity.toFixed(4)}</td>
              <td className="px-3 py-1.5 text-right text-[#333] tabular-nums">
                {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
