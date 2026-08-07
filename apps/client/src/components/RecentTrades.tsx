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
    <div className="overflow-auto h-full bg-[#0c0f17]">
      <table className="w-full text-xs font-mono">
        <thead className="sticky top-0 bg-[#0d111a] border-b border-[#181f2b]">
          <tr className="text-[#64748b] uppercase tracking-wide text-[10px] font-sans">
            <th className="text-right px-3 py-2 font-medium">Price</th>
            <th className="text-right px-3 py-2 font-medium">Size</th>
            <th className="text-right px-3 py-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={t.id} className={`border-t border-[#141923] hover:bg-[#141a24] transition-colors ${i === 0 ? "opacity-100" : ""}`}>
              <td className="px-3 py-1.5 text-right font-mono text-[#00c087] font-medium">{t.price.toFixed(2)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-[#94a3b8]">{t.quantity.toFixed(4)}</td>
              <td className="px-3 py-1.5 text-right text-[#64748b] tabular-nums text-[11px]">
                {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
