"use client";

import { useState } from "react";
import { type MarketInfo } from "@/lib/markets";
import styles from "@/app/trade/trade.module.css";

export interface PlacedOrder {
  id: string;
  pair: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  price: number;
  amount: number;
  total: number;
  time: string;
  status: "FILLED" | "OPEN";
}

export function OrderForm({
  market,
  selectedPrice,
  onOrderPlaced,
}: {
  market: MarketInfo;
  selectedPrice: number | null;
  onOrderPlaced: (order: PlacedOrder) => void;
}) {
  const [tradeMode, setTradeMode] = useState<"perps" | "spot">("perps");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [price, setPrice] = useState<string>(
    selectedPrice ? selectedPrice.toFixed(market.decimals) : market.price.toFixed(market.decimals),
  );
  const [amount, setAmount] = useState<string>("10");
  const [leverage, setLeverage] = useState<number>(20);

  const numPrice = orderType === "market" ? market.price : parseFloat(price) || market.price;
  const numAmount = parseFloat(amount) || 0;
  const notional = numAmount * numPrice;
  const marginRequired = tradeMode === "perps" ? notional / leverage : notional;

  const handlePercentage = (pct: number) => {
    const maxAvailable = 10000; // Simulated $10k available margin
    const targetNotional = maxAvailable * (pct / 100) * (tradeMode === "perps" ? leverage : 1);
    const calculatedAmount = targetNotional / numPrice;
    setAmount(calculatedAmount.toFixed(market.decimals > 2 ? 3 : 2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    const newOrder: PlacedOrder = {
      id: `ord-${Date.now()}`,
      pair: `${market.base}/${market.quote}`,
      side: side === "buy" ? "BUY" : "SELL",
      type: orderType === "limit" ? "LIMIT" : "MARKET",
      price: numPrice,
      amount: numAmount,
      total: notional,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      status: orderType === "market" ? "FILLED" : "OPEN",
    };

    onOrderPlaced(newOrder);
  };

  return (
    <form className={styles.orderFormContainer} onSubmit={handleSubmit}>
      <div className={styles.formModeToggle}>
        <button
          type="button"
          className={`${styles.modeBtn} ${tradeMode === "perps" ? styles.modeBtnActive : ""}`}
          onClick={() => setTradeMode("perps")}
        >
          Perpetual
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${tradeMode === "spot" ? styles.modeBtnActive : ""}`}
          onClick={() => setTradeMode("spot")}
        >
          Spot
        </button>
      </div>

      <div className={styles.sideToggle}>
        <button
          type="button"
          className={`${styles.buySideBtn} ${side === "buy" ? styles.buySideBtnActive : ""}`}
          onClick={() => setSide("buy")}
        >
          {tradeMode === "perps" ? "Long" : "Buy"} {market.base}
        </button>
        <button
          type="button"
          className={`${styles.sellSideBtn} ${side === "sell" ? styles.sellSideBtnActive : ""}`}
          onClick={() => setSide("sell")}
        >
          {tradeMode === "perps" ? "Short" : "Sell"} {market.base}
        </button>
      </div>

      <div className={styles.orderTypeRow}>
        <span
          className={`${styles.typeBtn} ${orderType === "limit" ? styles.typeBtnActive : ""}`}
          onClick={() => setOrderType("limit")}
        >
          Limit
        </span>
        <span
          className={`${styles.typeBtn} ${orderType === "market" ? styles.typeBtnActive : ""}`}
          onClick={() => setOrderType("market")}
        >
          Market
        </span>
        <span className={styles.typeBtn} style={{ color: "#485368", cursor: "not-allowed" }}>
          Stop Limit
        </span>
      </div>

      {tradeMode === "perps" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.74rem", color: "#788296" }}>
          <span>Leverage:</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 5, 10, 20, 50].map((lev) => (
              <button
                key={lev}
                type="button"
                onClick={() => setLeverage(lev)}
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: leverage === lev ? "#6ee7ff" : "#222834",
                  background: leverage === lev ? "rgba(110, 231, 255, 0.15)" : "#141820",
                  color: leverage === lev ? "#6ee7ff" : "#788296",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>
      )}

      {orderType === "limit" && (
        <div className={styles.inputGroup}>
          <div className={styles.inputLabel}>
            <span>Limit Price</span>
            <span style={{ cursor: "pointer", color: "#6ee7ff" }} onClick={() => setPrice(market.price.toFixed(market.decimals))}>
              Mid
            </span>
          </div>
          <div className={styles.inputWrapper}>
            <input
              type="number"
              step="any"
              className={styles.formInput}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <span className={styles.inputUnit}>{market.quote}</span>
          </div>
        </div>
      )}

      <div className={styles.inputGroup}>
        <div className={styles.inputLabel}>
          <span>Order Size</span>
          <span>Max: 350.00 {market.base}</span>
        </div>
        <div className={styles.inputWrapper}>
          <input
            type="number"
            step="any"
            className={styles.formInput}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className={styles.inputUnit}>{market.base}</span>
        </div>
      </div>

      <div className={styles.sliderRow}>
        {[25, 50, 75, 100].map((pct) => (
          <button
            key={pct}
            type="button"
            className={styles.pctBtn}
            onClick={() => handlePercentage(pct)}
          >
            {pct}%
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.76rem", color: "#788296", borderTop: "1px solid #161b24", paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Order Value</span>
          <span style={{ color: "#d1d5db", fontFamily: "var(--font-mono)" }}>
            ${notional.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {market.quote}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Margin Required</span>
          <span style={{ color: "#d1d5db", fontFamily: "var(--font-mono)" }}>
            ${marginRequired.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {market.quote}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Est. Fee (0.04%)</span>
          <span style={{ color: "#788296", fontFamily: "var(--font-mono)" }}>
            ${(notional * 0.0004).toFixed(2)} {market.quote}
          </span>
        </div>
      </div>

      <button
        type="submit"
        className={`${styles.submitBtn} ${side === "buy" ? styles.submitBtnBuy : styles.submitBtnSell}`}
      >
        {side === "buy" ? `Buy / Long ${market.base}` : `Sell / Short ${market.base}`}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#647087" }}>
        <span>Available: $10,450.20 {market.quote}</span>
        <span style={{ color: "#6ee7ff", cursor: "pointer" }}>Deposit</span>
      </div>
    </form>
  );
}
