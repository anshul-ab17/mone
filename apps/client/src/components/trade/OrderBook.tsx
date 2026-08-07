"use client";

import { useState } from "react";
import { type MarketInfo } from "@/lib/markets";
import styles from "@/app/trade/trade.module.css";

interface OrderBookRow {
  price: number;
  size: number;
  total: number;
  depthPct: number;
}

interface TradeItem {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  time: string;
}

function generateOrderBook(basePrice: number, decimals: number): { asks: OrderBookRow[]; bids: OrderBookRow[] } {
  const step = basePrice * 0.0004;
  const asks: OrderBookRow[] = [];
  const bids: OrderBookRow[] = [];

  let cumAsk = 0;
  for (let i = 8; i >= 1; i--) {
    const price = basePrice + i * step;
    const size = Math.round((0.5 + Math.sin(i * 1.5) * 0.4 + (i % 2 === 0 ? 0.3 : 0.8)) * 100) / 100;
    cumAsk += size;
    asks.push({ price, size, total: cumAsk, depthPct: Math.min(100, (cumAsk / 12) * 100) });
  }

  let cumBid = 0;
  for (let i = 1; i <= 8; i++) {
    const price = basePrice - i * step;
    const size = Math.round((0.5 + Math.cos(i * 1.5) * 0.4 + (i % 2 === 0 ? 0.7 : 0.4)) * 100) / 100;
    cumBid += size;
    bids.push({ price, size, total: cumBid, depthPct: Math.min(100, (cumBid / 12) * 100) });
  }

  return { asks, bids };
}

function generateTrades(basePrice: number): TradeItem[] {
  const list: TradeItem[] = [];
  const now = Date.now();
  for (let i = 0; i < 16; i++) {
    const side = i % 2 === 0 ? "buy" : "sell";
    const delta = (Math.sin(i * 2.1) * 0.0006) * basePrice;
    const price = basePrice + delta;
    const size = Math.round((0.2 + (i % 5) * 0.35) * 100) / 100;
    const time = new Date(now - i * 4000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    list.push({ id: `t-${i}`, price, size, side, time });
  }
  return list;
}

export function OrderBook({
  market,
  onSelectPrice,
}: {
  market: MarketInfo;
  onSelectPrice: (price: number) => void;
}) {
  const [tab, setTab] = useState<"book" | "trades">("book");
  const { asks, bids } = generateOrderBook(market.price, market.decimals);
  const trades = generateTrades(market.price);

  const bestAsk = asks[asks.length - 1]?.price ?? market.price;
  const bestBid = bids[0]?.price ?? market.price;
  const spread = Math.max(0, bestAsk - bestBid);
  const spreadPct = (spread / market.price) * 100;

  return (
    <div className={styles.orderBookContainer}>
      <div className={styles.obHeader}>
        <div className={styles.obTabs}>
          <span
            className={`${styles.obTab} ${tab === "book" ? styles.obTabActive : ""}`}
            onClick={() => setTab("book")}
          >
            Order Book
          </span>
          <span
            className={`${styles.obTab} ${tab === "trades" ? styles.obTabActive : ""}`}
            onClick={() => setTab("trades")}
          >
            Recent Trades
          </span>
        </div>
        <span style={{ fontSize: "0.7rem", color: "#647087" }}>0.01</span>
      </div>

      {tab === "book" ? (
        <>
          <div className={styles.obTableHead}>
            <span>Price ({market.quote})</span>
            <span>Size ({market.base})</span>
            <span>Total</span>
          </div>

          <div className={styles.obList}>
            {asks.map((row) => (
              <div
                key={row.price}
                className={styles.obRow}
                onClick={() => onSelectPrice(row.price)}
              >
                <div className={styles.depthFillRed} style={{ width: `${row.depthPct}%` }} />
                <span className={styles.priceRed}>${row.price.toFixed(market.decimals)}</span>
                <span>{row.size.toFixed(2)}</span>
                <span>{row.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className={styles.obSpreadBar}>
            <span className={market.change24h >= 0 ? styles.priceGreen : styles.priceRed}>
              ${market.price.toFixed(market.decimals)}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#788296", fontWeight: 500 }}>
              Spread: {spread.toFixed(market.decimals)} ({spreadPct.toFixed(3)}%)
            </span>
          </div>

          <div className={styles.obList}>
            {bids.map((row) => (
              <div
                key={row.price}
                className={styles.obRow}
                onClick={() => onSelectPrice(row.price)}
              >
                <div className={styles.depthFillGreen} style={{ width: `${row.depthPct}%` }} />
                <span className={styles.priceGreen}>${row.price.toFixed(market.decimals)}</span>
                <span>{row.size.toFixed(2)}</span>
                <span>{row.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={styles.obTableHead}>
            <span>Price ({market.quote})</span>
            <span>Size ({market.base})</span>
            <span>Time</span>
          </div>

          <div className={styles.obList}>
            {trades.map((t) => (
              <div key={t.id} className={styles.obRow} onClick={() => onSelectPrice(t.price)}>
                <span className={t.side === "buy" ? styles.priceGreen : styles.priceRed}>
                  ${t.price.toFixed(market.decimals)}
                </span>
                <span>{t.size.toFixed(2)}</span>
                <span>{t.time}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
