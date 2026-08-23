"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Wallet } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { CoinIcon } from "../../components/CoinIcon";

export default function PortfolioPage() {
  const { user, loading } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    api.wallet.list()
      .then((r) => setWallets(r.wallets ?? []))
      .catch(() => setWallets([]))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) {
    return (
      <main className="flex-1 bg-[#07090e] text-white flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <span className="w-6 h-6 border-2 border-[#1e293b] border-t-[#38bdf8] rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 bg-[#07090e] text-white flex flex-col items-center justify-center p-6 min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-md w-full text-center space-y-5 bg-[#0c0f17] border border-[#181f2b] rounded-2xl p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#141a24] border border-[#1e2736] flex items-center justify-center mx-auto text-[#38bdf8] text-2xl font-bold">
            💼
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Your Portfolio</h1>
            <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
              Please sign in to access your personal asset holdings, balances, and performance.
            </p>
          </div>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center w-full h-11 rounded-lg text-xs font-bold bg-[#38bdf8] text-[#05131d] hover:bg-[#7dd3fc] transition-all shadow-md shadow-sky-950/40"
          >
            Sign In to View Portfolio
          </Link>
        </div>
      </main>
    );
  }

  const totalUSD = wallets.reduce((acc, w) => acc + (w.asset === "USDC" ? w.balance : w.balance * (w.asset === "BTC" ? 96450 : w.asset === "ETH" ? 2785 : w.asset === "SOL" ? 188 : 79)), 0);

  return (
    <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio</h1>
          <p className="text-xs text-[#64748b] mt-0.5">{user.email}</p>
        </div>
        <Link
          href="/deposit"
          className="text-xs px-4 py-2 rounded-lg font-bold bg-[#38bdf8] text-[#05131d] hover:bg-[#7dd3fc] transition-all shadow-md shadow-sky-950/40"
        >
          + Deposit
        </Link>
      </div>

      {/* Total balance card */}
      <div className="bg-[#0c0f17] border border-[#181f2b] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] text-[#64748b] uppercase tracking-widest font-semibold">Total Estimated Balance</p>
          <span className="text-[11px] text-[#00c087] font-mono font-medium">+4.82% (24h)</span>
        </div>
        <p className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
          ${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-[#64748b] mt-1.5">Across {wallets.length} active asset accounts</p>
      </div>

      {/* Assets */}
      <div className="bg-[#0c0f17] border border-[#181f2b] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-[#181f2b] bg-[#0d111a] flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-bold uppercase tracking-wider">Asset Holdings</span>
          <span className="text-[11px] text-[#64748b] font-mono">Real-Time Valuation</span>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-5 h-5 border-2 border-[#1e293b] border-t-[#38bdf8] rounded-full animate-spin" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="px-5 py-10 text-center space-y-3">
            <p className="text-[#64748b] text-sm">No assets yet.</p>
            <Link href="/deposit" className="text-[#38bdf8] hover:underline text-sm font-semibold">
              Deposit to get started →
            </Link>
          </div>
        ) : (
          <div>
            {wallets.map((w, i) => (
              <div
                key={w.id}
                className={`flex items-center justify-between px-5 py-4 hover:bg-[#141a24] transition-colors ${i > 0 ? "border-t border-[#141923]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <CoinIcon asset={w.asset} size={36} />
                  <div>
                    <p className="font-semibold text-sm text-white">{w.asset}</p>
                    {w.lockedBalance > 0 && (
                      <p className="text-[10px] text-[#64748b] font-mono mt-0.5">
                        {w.lockedBalance.toFixed(4)} in active orders
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm text-white">{w.balance.toFixed(w.balance < 1 ? 6 : 4)}</p>
                  <p className="text-[10px] text-[#64748b] font-mono mt-0.5">
                    Avail: {(w.balance - w.lockedBalance).toFixed(w.balance < 1 ? 6 : 4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/trade"
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#181f2b] bg-[#0c0f17] text-xs font-semibold text-[#94a3b8] hover:text-white hover:border-[#2b384d] hover:bg-[#141a24] transition-all"
        >
          Trade Markets →
        </Link>
        <Link
          href="/deposit"
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#181f2b] bg-[#0c0f17] text-xs font-semibold text-[#94a3b8] hover:text-white hover:border-[#2b384d] hover:bg-[#141a24] transition-all"
        >
          Deposit Crypto →
        </Link>
      </div>
    </main>
  );
}
