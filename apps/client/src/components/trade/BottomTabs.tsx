"use client";

import { useState } from "react";
import { type PlacedOrder } from "./OrderForm";
import styles from "@/app/trade/trade.module.css";

interface Position {
  pair: string;
  side: "LONG" | "SHORT";
  size: string;
  entryPrice: number;
  markPrice: number;
  liqPrice: number;
  margin: string;
  unrealizedPnl: number;
  pnlPct: number;
}

export function BottomTabs({
  orders,
  onCancelOrder,
}: {
  orders: PlacedOrder[];
  onCancelOrder: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"orders" | "positions" | "history" | "balances">("orders");

  const openOrders = orders.filter((o) => o.status === "OPEN");
  const filledOrders = orders.filter((o) => o.status === "FILLED");

  const samplePositions: Position[] = [
    {
      pair: "HYPE/USD",
      side: "LONG",
      size: "250.00 HYPE",
      entryPrice: 26.40,
      markPrice: 28.45,
      liqPrice: 19.80,
      margin: "$330.00 (20x)",
      unrealizedPnl: 512.50,
      pnlPct: 77.65,
    },
    {
      pair: "SOL/USDC",
      side: "LONG",
      size: "40.00 SOL",
      entryPrice: 178.50,
      markPrice: 184.60,
      liqPrice: 142.10,
      margin: "$738.40 (10x)",
      unrealizedPnl: 244.00,
      pnlPct: 34.17,
    },
  ];

  return (
    <div className={styles.bottomContainer}>
      <div className={styles.bottomHeader}>
        <div className={styles.bottomTabs}>
          <span
            className={`${styles.bTab} ${activeTab === "orders" ? styles.bTabActive : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Open Orders ({openOrders.length})
          </span>
          <span
            className={`${styles.bTab} ${activeTab === "positions" ? styles.bTabActive : ""}`}
            onClick={() => setActiveTab("positions")}
          >
            Positions ({samplePositions.length})
          </span>
          <span
            className={`${styles.bTab} ${activeTab === "history" ? styles.bTabActive : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Order History ({filledOrders.length})
          </span>
          <span
            className={`${styles.bTab} ${activeTab === "balances" ? styles.bTabActive : ""}`}
            onClick={() => setActiveTab("balances")}
          >
            Balances
          </span>
        </div>

        {openOrders.length > 0 && activeTab === "orders" && (
          <button
            type="button"
            onClick={() => openOrders.forEach((o) => onCancelOrder(o.id))}
            style={{
              background: "transparent",
              border: "none",
              color: "#f84960",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel All
          </button>
        )}
      </div>

      <div className={styles.bottomTable}>
        {activeTab === "orders" && (
          openOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
              </svg>
              <span>No open orders</span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", fontFamily: "var(--font-mono)" }}>
              <thead>
                <tr style={{ color: "#647087", textAlign: "left", borderBottom: "1px solid #161b24" }}>
                  <th style={{ padding: "6px 8px" }}>Time</th>
                  <th style={{ padding: "6px 8px" }}>Market</th>
                  <th style={{ padding: "6px 8px" }}>Type</th>
                  <th style={{ padding: "6px 8px" }}>Side</th>
                  <th style={{ padding: "6px 8px" }}>Price</th>
                  <th style={{ padding: "6px 8px" }}>Amount</th>
                  <th style={{ padding: "6px 8px" }}>Total</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {openOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px", color: "#788296" }}>{o.time}</td>
                    <td style={{ padding: "8px", color: "#fff", fontWeight: 700 }}>{o.pair}</td>
                    <td style={{ padding: "8px", color: "#9aa3b5" }}>{o.type}</td>
                    <td style={{ padding: "8px", color: o.side === "BUY" ? "#00c087" : "#f84960", fontWeight: 700 }}>
                      {o.side}
                    </td>
                    <td style={{ padding: "8px" }}>${o.price.toFixed(2)}</td>
                    <td style={{ padding: "8px" }}>{o.amount.toFixed(2)}</td>
                    <td style={{ padding: "8px" }}>${o.total.toFixed(2)}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => onCancelOrder(o.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#f84960",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {activeTab === "positions" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", fontFamily: "var(--font-mono)" }}>
            <thead>
              <tr style={{ color: "#647087", textAlign: "left", borderBottom: "1px solid #161b24" }}>
                <th style={{ padding: "6px 8px" }}>Market</th>
                <th style={{ padding: "6px 8px" }}>Side</th>
                <th style={{ padding: "6px 8px" }}>Size</th>
                <th style={{ padding: "6px 8px" }}>Entry Price</th>
                <th style={{ padding: "6px 8px" }}>Mark Price</th>
                <th style={{ padding: "6px 8px" }}>Liq. Price</th>
                <th style={{ padding: "6px 8px" }}>Margin</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>PnL (ROE %)</th>
              </tr>
            </thead>
            <tbody>
              {samplePositions.map((pos) => (
                <tr key={pos.pair} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "8px", color: "#fff", fontWeight: 700 }}>{pos.pair}</td>
                  <td style={{ padding: "8px", color: pos.side === "LONG" ? "#00c087" : "#f84960", fontWeight: 700 }}>
                    {pos.side}
                  </td>
                  <td style={{ padding: "8px" }}>{pos.size}</td>
                  <td style={{ padding: "8px" }}>${pos.entryPrice.toFixed(2)}</td>
                  <td style={{ padding: "8px" }}>${pos.markPrice.toFixed(2)}</td>
                  <td style={{ padding: "8px", color: "#fbbf24" }}>${pos.liqPrice.toFixed(2)}</td>
                  <td style={{ padding: "8px" }}>{pos.margin}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#00c087", fontWeight: 700 }}>
                    +${pos.unrealizedPnl.toFixed(2)} (+{pos.pnlPct.toFixed(2)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "history" && (
          filledOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <span>No order history in this session</span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", fontFamily: "var(--font-mono)" }}>
              <thead>
                <tr style={{ color: "#647087", textAlign: "left", borderBottom: "1px solid #161b24" }}>
                  <th style={{ padding: "6px 8px" }}>Time</th>
                  <th style={{ padding: "6px 8px" }}>Market</th>
                  <th style={{ padding: "6px 8px" }}>Type</th>
                  <th style={{ padding: "6px 8px" }}>Side</th>
                  <th style={{ padding: "6px 8px" }}>Price</th>
                  <th style={{ padding: "6px 8px" }}>Amount</th>
                  <th style={{ padding: "6px 8px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filledOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px", color: "#788296" }}>{o.time}</td>
                    <td style={{ padding: "8px", color: "#fff", fontWeight: 700 }}>{o.pair}</td>
                    <td style={{ padding: "8px", color: "#9aa3b5" }}>{o.type}</td>
                    <td style={{ padding: "8px", color: o.side === "BUY" ? "#00c087" : "#f84960", fontWeight: 700 }}>
                      {o.side}
                    </td>
                    <td style={{ padding: "8px" }}>${o.price.toFixed(2)}</td>
                    <td style={{ padding: "8px" }}>{o.amount.toFixed(2)}</td>
                    <td style={{ padding: "8px", color: "#00c087", fontWeight: 600 }}>{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {activeTab === "balances" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, padding: "8px 0" }}>
            {[
              { coin: "USD / USDC", total: "$10,450.20", available: "$8,850.20" },
              { coin: "HYPE", total: "250.00 HYPE", available: "0.00 HYPE" },
              { coin: "SOL", total: "40.00 SOL", available: "0.00 SOL" },
              { coin: "BTC", total: "0.1500 BTC", available: "0.1500 BTC" },
            ].map((b) => (
              <div key={b.coin} style={{ padding: 12, borderRadius: 8, background: "#131720", border: "1px solid #1e2430" }}>
                <div style={{ fontSize: "0.74rem", color: "#788296", marginBottom: 4 }}>{b.coin}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#fff" }}>{b.total}</div>
                <div style={{ fontSize: "0.7rem", color: "#647087", marginTop: 2 }}>Available: {b.available}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
