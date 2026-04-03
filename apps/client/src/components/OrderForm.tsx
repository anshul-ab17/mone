"use client";

import { useState } from "react";
import { api, type Market } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import Link from "next/link";

type Props = { market: Market; onOrderPlaced?: () => void };

function SideForm({
  side,
  market,
  onOrderPlaced,
}: {
  side: "BUY" | "SELL";
  market: Market;
  onOrderPlaced?: () => void;
}) {
  const { user } = useAuth();
  const [type, setType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const asset = side === "BUY" ? market.quoteAsset : market.baseAsset;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setError("Sign in to trade"); return; }
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await api.orders.place({
        marketId: market.id, asset, side, type,
        price: type === "LIMIT" ? Number(price) : undefined,
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

  const isBuy = side === "BUY";

  return (
    <form onSubmit={submit} className="space-y-3 p-4">
      {/* Order type */}
      <div className="flex gap-1 border-b border-[#1f1f1f] pb-3">
        {(["LIMIT", "MARKET"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              type === t
                ? "bg-[#1a1a1a] text-white border border-[#2a2a2a]"
                : "text-[#555] hover:text-[#888]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Price (LIMIT only) */}
      {type === "LIMIT" && (
        <div className="space-y-1.5">
          <Label>Price ({market.quoteAsset})</Label>
          <Input
            type="number" step="any" min="0" value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00" required
            className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-[#333] focus-visible:ring-[#800020]/50 h-10"
          />
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-1.5">
        <Label>{isBuy ? `Amount (${market.quoteAsset})` : `Quantity (${market.baseAsset})`}</Label>
        <Input
          type="number" step="any" min="0" value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="0.00" required
          className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-[#333] focus-visible:ring-[#800020]/50 h-10"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-green-400">{success}</p>}

      {user ? (
        <Button
          type="submit"
          disabled={loading}
          variant={isBuy ? "buy" : "sell"}
          className="w-full h-11 font-semibold"
        >
          {loading ? "Placing…" : `${isBuy ? "Buy" : "Sell"} ${market.baseAsset}`}
        </Button>
      ) : (
        <div className="space-y-2 pt-1">
          <Button asChild className="w-full h-11 bg-white text-black hover:bg-white/90 font-semibold">
            <Link href="/signup">Sign up to trade</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full h-9 text-[#888] hover:text-white text-sm">
            <Link href="/signin">Log in to trade</Link>
          </Button>
        </div>
      )}
    </form>
  );
}

export function OrderForm({ market, onOrderPlaced }: Props) {
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="buy" className="flex flex-col h-full">
        <TabsList className="grid grid-cols-2 bg-transparent border-b border-[#1f1f1f] rounded-none h-10 p-0 shrink-0">
          <TabsTrigger
            value="buy"
            className="rounded-none text-sm font-semibold text-[#555] data-[state=active]:text-green-400 data-[state=active]:border-b-2 data-[state=active]:border-green-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            Buy
          </TabsTrigger>
          <TabsTrigger
            value="sell"
            className="rounded-none text-sm font-semibold text-[#555] data-[state=active]:text-red-400 data-[state=active]:border-b-2 data-[state=active]:border-red-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            Sell
          </TabsTrigger>
        </TabsList>
        <TabsContent value="buy" className="mt-0 flex-1">
          <SideForm side="BUY" market={market} onOrderPlaced={onOrderPlaced} />
        </TabsContent>
        <TabsContent value="sell" className="mt-0 flex-1">
          <SideForm side="SELL" market={market} onOrderPlaced={onOrderPlaced} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
