"use client";

import { useState } from "react";
import { api, type Market } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Link from "next/link";

type Props = { market: Market; onOrderPlaced?: () => void };

export function OrderForm({ market, onOrderPlaced }: Props) {
  const { user } = useAuth();
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<"LIMIT" | "MARKET" | "CONDITIONAL">("LIMIT");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [sliderPct, setSliderPct] = useState(0);
  const [postOnly, setPostOnly] = useState(false);
  const [ioc, setIoc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const asset = side === "BUY" ? market.quoteAsset : market.baseAsset;
  const isBuy = side === "BUY";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setError("Sign in to trade"); return; }
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await api.orders.place({
        marketId: market.id,
        asset,
        side,
        type: type === "CONDITIONAL" ? "LIMIT" : type,
        price: type !== "MARKET" ? Number(price) : undefined,
        quantity: Number(qty),
      });
      setSuccess(`Filled ${res.filledQty} ${market.baseAsset}`);
      setQty(""); setPrice("");
      onOrderPlaced?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setLoading(false);
    }
  }

  const orderValue = Number(price || 0) * Number(qty || 0);

  return (
    <div className="flex flex-col h-full bg-[#0c0f17] text-white p-3.5 text-xs select-none">
      {/* Top Buy / Sell Toggle Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={() => setSide("BUY")}
          className={`py-2 rounded-lg font-bold text-xs transition-all ${
            isBuy
              ? "bg-[#16a34a] text-white shadow-md shadow-green-950/40"
              : "bg-[#141a24] text-[#64748b] hover:text-[#94a3b8]"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("SELL")}
          className={`py-2 rounded-lg font-bold text-xs transition-all ${
            !isBuy
              ? "bg-[#dc2626] text-white shadow-md shadow-red-950/40"
              : "bg-[#141a24] text-[#64748b] hover:text-[#94a3b8]"
          }`}
        >
          Sell
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex items-center justify-between border-b border-[#181f2b] pb-2 mb-3">
        <div className="flex items-center gap-3">
          {(["LIMIT", "MARKET", "CONDITIONAL"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`font-semibold text-[11px] transition-colors capitalize ${
                type === t ? "text-white" : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3 flex-1 flex flex-col">
        {/* Balance Row */}
        <div className="flex items-center justify-between text-[11px] text-[#64748b]">
          <span>Balance</span>
          <span className="font-mono text-white">—</span>
        </div>

        {/* Price input */}
        {type !== "MARKET" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#64748b]">
              <span>Price</span>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <button type="button" className="text-[#38bdf8] hover:underline" onClick={() => setPrice("79.384")}>Mid</button>
                <span>·</span>
                <button type="button" className="text-[#38bdf8] hover:underline" onClick={() => setPrice("79.405")}>BBO</button>
              </div>
            </div>
            <div className="relative flex items-center">
              <Input
                type="number"
                step="any"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                className="bg-[#11151f] border-[#1e2736] text-white placeholder:text-[#475569] font-mono text-xs h-9 pl-3 pr-8 rounded-lg focus-visible:ring-1 focus-visible:ring-[#38bdf8]"
              />
              <span className="absolute right-3 text-[#64748b] font-mono text-xs pointer-events-none">$</span>
            </div>
          </div>
        )}

        {/* Quantity input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#64748b]">
            <span>Quantity</span>
          </div>
          <div className="relative flex items-center">
            <Input
              type="number"
              step="any"
              min="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              required
              className="bg-[#11151f] border-[#1e2736] text-white placeholder:text-[#475569] font-mono text-xs h-9 pl-3 pr-8 rounded-lg focus-visible:ring-1 focus-visible:ring-[#38bdf8]"
            />
            <span className="absolute right-2.5 w-4 h-4 rounded-full bg-[#1e2736] flex items-center justify-center text-[10px] text-[#38bdf8] font-bold pointer-events-none">
              ~
            </span>
          </div>
        </div>

        {/* Percentage Slider */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min="0"
            max="100"
            step="25"
            value={sliderPct}
            onChange={(e) => setSliderPct(Number(e.target.value))}
            className="w-full h-1.5 bg-[#1e2736] rounded-lg appearance-none cursor-pointer accent-[#38bdf8]"
          />
          <div className="flex justify-between text-[10px] text-[#475569] font-mono">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Order Value */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#64748b]">
            <span>Order Value</span>
          </div>
          <div className="relative flex items-center">
            <Input
              type="text"
              readOnly
              value={orderValue > 0 ? orderValue.toFixed(2) : "0"}
              className="bg-[#11151f] border-[#1e2736] text-[#94a3b8] font-mono text-xs h-9 pl-3 pr-8 rounded-lg pointer-events-none"
            />
            <span className="absolute right-3 text-[#64748b] font-mono text-xs pointer-events-none">$</span>
          </div>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/40">{error}</p>}
        {success && <p className="text-xs text-green-400 bg-green-950/30 p-2 rounded border border-green-900/40">{success}</p>}

        {/* Action Button */}
        <div className="pt-2 space-y-2 mt-auto">
          {user ? (
            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-10 font-bold text-xs rounded-lg transition-all ${
                isBuy
                  ? "bg-[#16a34a] hover:bg-[#22c55e] text-white"
                  : "bg-[#dc2626] hover:bg-[#ef4444] text-white"
              }`}
            >
              {loading ? "Placing…" : `${isBuy ? "Buy" : "Sell"} ${market.baseAsset}`}
            </Button>
          ) : (
            <>
              <Button asChild className="w-full h-10 bg-white text-black hover:bg-white/90 font-bold text-xs rounded-lg">
                <Link href="/signin">Sign up to trade</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full h-8 text-[#94a3b8] hover:text-white text-xs font-semibold">
                <Link href="/signin">Log in to trade</Link>
              </Button>
            </>
          )}

          {/* Options */}
          <div className="flex items-center gap-4 text-[11px] text-[#64748b] pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#94a3b8]">
              <input
                type="checkbox"
                checked={postOnly}
                onChange={(e) => setPostOnly(e.target.checked)}
                className="rounded border-[#1e2736] bg-[#11151f] accent-[#38bdf8]"
              />
              Post Only
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#94a3b8]">
              <input
                type="checkbox"
                checked={ioc}
                onChange={(e) => setIoc(e.target.checked)}
                className="rounded border-[#1e2736] bg-[#11151f] accent-[#38bdf8]"
              />
              IOC
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
