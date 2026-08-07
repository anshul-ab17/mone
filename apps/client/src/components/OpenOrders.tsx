"use client";

import { useEffect, useState } from "react";
import { api, type Order } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const STATUS_STYLE: Record<string, string> = {
  OPEN:             "text-blue-400 bg-blue-950/40 border-blue-900/40",
  PARTIALLY_FILLED: "text-yellow-400 bg-yellow-950/40 border-yellow-900/40",
  FILLED:           "text-green-400 bg-green-950/40 border-green-900/40",
  CANCELLED:        "text-[#555] bg-[#111] border-[#222]",
};

export function OpenOrders({ refreshKey }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const res = await api.orders.list().catch(() => null);
    if (res) setOrders(res.orders.filter((o) => o.status === "OPEN" || o.status === "PARTIALLY_FILLED"));
  }

  useEffect(() => { load(); }, [user, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cancel(id: string) {
    setCancelling(id);
    await api.orders.cancel(id).catch(() => null);
    await load();
    setCancelling(null);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-[#444] text-xs gap-1.5">
        <span>Sign in to see orders</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#333] text-xs">
        No open orders
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full bg-[#0c0f17]">
      <table className="w-full text-xs font-mono">
        <thead className="sticky top-0 bg-[#0d111a] border-b border-[#181f2b]">
          <tr className="text-[#64748b] uppercase tracking-wide text-[10px] font-sans">
            <th className="text-left px-3 py-2 font-medium">Market</th>
            <th className="text-left px-3 py-2 font-medium">Side</th>
            <th className="text-left px-3 py-2 font-medium">Type</th>
            <th className="text-right px-3 py-2 font-medium">Price</th>
            <th className="text-right px-3 py-2 font-medium">Qty</th>
            <th className="text-right px-3 py-2 font-medium">Filled</th>
            <th className="text-right px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-[#141923] hover:bg-[#141a24] transition-colors group">
              <td className="px-3 py-2 font-mono text-[#cbd5e1]">
                {o.market.baseAsset}<span className="text-[#64748b]">/{o.market.quoteAsset}</span>
              </td>
              <td className={`px-3 py-2 font-semibold ${o.side === "BUY" ? "text-[#00c087]" : "text-[#f84960]"}`}>
                {o.side}
              </td>
              <td className="px-3 py-2 text-[#94a3b8]">{o.type}</td>
              <td className="px-3 py-2 text-right font-mono text-[#cbd5e1]">{o.price?.toFixed(2) ?? "MKT"}</td>
              <td className="px-3 py-2 text-right font-mono text-[#cbd5e1]">{o.quantity}</td>
              <td className="px-3 py-2 text-right font-mono text-[#64748b]">{o.filledQty}</td>
              <td className="px-3 py-2 text-right">
                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${STATUS_STYLE[o.status] ?? STATUS_STYLE.CANCELLED}`}>
                  {o.status === "PARTIALLY_FILLED" ? "PARTIAL" : o.status}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => cancel(o.id)}
                  disabled={cancelling === o.id}
                  className="text-[#64748b] hover:text-[#f84960] disabled:opacity-40 transition-colors text-[10px] font-medium opacity-0 group-hover:opacity-100"
                >
                  {cancelling === o.id ? "…" : "Cancel"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
