"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { api } from "../lib/api";

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
type Interval = typeof INTERVALS[number];

export function PriceChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [interval, setInterval] = useState<Interval>("1h");
  const [loading, setLoading] = useState(true);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#0d0d0d" }, textColor: "#555" },
      grid: { vertLines: { color: "#151515" }, horzLines: { color: "#151515" } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#1f1f1f", textColor: "#555" },
      timeScale: { borderColor: "#1f1f1f", timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", downColor: "#ef4444",
      borderUpColor: "#22c55e", borderDownColor: "#ef4444",
      wickUpColor: "#22c55e", wickDownColor: "#ef4444",
    });

    const vol = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candle;
    volRef.current = vol;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  // Load data when symbol or interval changes
  useEffect(() => {
    if (!candleRef.current || !volRef.current) return;
    setLoading(true);

    api.markets.klines(symbol, interval, 200).then(({ klines }) => {
      if (!candleRef.current || !volRef.current) return;
      if (klines.length === 0) { setLoading(false); return; }

      const sorted = [...klines].sort((a, b) => a.time - b.time);
      candleRef.current.setData(sorted.map(c => ({
        time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close,
      })));
      volRef.current.setData(sorted.map(c => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e30" : "#ef444430",
      })));
      chartRef.current?.timeScale().fitContent();
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [symbol, interval]);

  return (
    <div className="relative w-full h-full">
      {/* Interval selector */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5">
        {INTERVALS.map(iv => (
          <button key={iv} onClick={() => setInterval(iv)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${interval === iv ? "text-white bg-[#1f1f1f]" : "text-[#444] hover:text-[#777]"}`}>
            {iv}
          </button>
        ))}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="text-[#333] text-xs">Loading chart…</span>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
