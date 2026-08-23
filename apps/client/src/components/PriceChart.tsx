"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { api } from "../lib/api";

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
type Interval = typeof INTERVALS[number];

const VIEWS = ["Chart", "Depth", "Margin", "Market Info"] as const;

export function PriceChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [interval, setInterval] = useState<Interval>("1h");
  const [activeView, setActiveView] = useState<(typeof VIEWS)[number]>("Chart");
  const [loading, setLoading] = useState(true);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0c0f17" },
        textColor: "#64748b",
        fontFamily: "var(--font-geist-mono), monospace",
      },
      grid: {
        vertLines: { color: "#141924" },
        horzLines: { color: "#141924" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#38bdf840", style: 2 },
        horzLine: { color: "#38bdf840", style: 2 },
      },
      rightPriceScale: {
        borderColor: "#181f2b",
        textColor: "#94a3b8",
        autoScale: true,
      },
      timeScale: {
        borderColor: "#181f2b",
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#00c087",
      downColor: "#f84960",
      borderUpColor: "#00c087",
      borderDownColor: "#f84960",
      wickUpColor: "#00c087",
      wickDownColor: "#f84960",
    });

    const vol = chart.addSeries(HistogramSeries, {
      color: "#00c087",
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

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

    api.markets.klines(symbol, interval, 120).then(({ klines }) => {
      if (!candleRef.current || !volRef.current) return;
      if (klines.length === 0) { setLoading(false); return; }

      const sorted = [...klines].sort((a, b) => a.time - b.time);
      candleRef.current.setData(sorted.map(c => ({
        time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close,
      })));
      volRef.current.setData(sorted.map(c => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "#00c08735" : "#f8496035",
      })));
      chartRef.current?.timeScale().fitContent();
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [symbol, interval]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0c0f17] select-none">
      {/* Top Chart Navigation & TradingView Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#181f2b] bg-[#0d111a] shrink-0 text-xs">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                activeView === v
                  ? "bg-[#141a24] text-white border border-[#1e2736]"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Right: Timeframe Interval & Indicators */}
        <div className="flex items-center gap-1 font-mono text-xs">
          <div className="flex items-center bg-[#10141d] p-0.5 rounded-lg border border-[#181f2b]">
            {INTERVALS.map((iv) => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  interval === iv
                    ? "bg-[#1e2736] text-white font-bold"
                    : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {iv}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#181f2b] mx-1" />

          <button
            type="button"
            onClick={() => chartRef.current?.timeScale().fitContent()}
            className="text-[11px] text-[#64748b] hover:text-white px-2 py-1 rounded hover:bg-[#141a24] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative flex-1 min-h-0 w-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0c0f17]/60 backdrop-blur-[2px]">
            <span className="text-[#64748b] text-xs font-mono">Loading market chart…</span>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
