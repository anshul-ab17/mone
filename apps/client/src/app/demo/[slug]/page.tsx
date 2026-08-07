"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import { TradeHeader } from "@/components/trade/TradeHeader";
import { TradeChart } from "@/components/trade/TradeChart";
import { OrderBook } from "@/components/trade/OrderBook";
import { OrderForm, type PlacedOrder } from "@/components/trade/OrderForm";
import { BottomTabs } from "@/components/trade/BottomTabs";
import { getDemoMarket, nextTick } from "@/lib/demoApi";
import styles from "@/app/trade/trade.module.css";

export default function DemoSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const market = useMemo(() => getDemoMarket(slug), [slug]);

  const [livePrice, setLivePrice] = useState(market.price);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);

  // Light live-tick on the price so the header/chart/book breathe a little.
  useEffect(() => {
    setLivePrice(market.price);
    const id = setInterval(() => {
      setLivePrice((p) => nextTick(p, market.decimals));
    }, 1500);
    return () => clearInterval(id);
  }, [market]);

  const liveMarket = useMemo(
    () => ({ ...market, price: livePrice }),
    [market, livePrice],
  );

  const handleOrderPlaced = (order: PlacedOrder) => {
    setOrders((prev) => [
      {
        ...order,
        pair: `${market.base}/${market.quote}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...prev,
    ]);
  };

  const handleCancelOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div className={styles.tradeLayout}>
      <TradeHeader market={liveMarket} />

      <main className={styles.mainGrid}>
        <TradeChart market={liveMarket} />
        <OrderBook market={liveMarket} onSelectPrice={() => {}} />
        <OrderForm market={liveMarket} selectedPrice={null} onOrderPlaced={handleOrderPlaced} />
        <BottomTabs orders={orders} onCancelOrder={handleCancelOrder} />
      </main>
    </div>
  );
}
