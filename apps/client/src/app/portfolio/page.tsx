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
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="w-5 h-5 border-2 border-[#2a2a2a] border-t-[#555] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-4">
        <p className="text-[#555] text-sm">Sign in to view your portfolio.</p>
        <Link
          href="/signin"
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#800020" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  const totalUSD = wallets.reduce((acc, w) => acc + w.balance, 0);

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Portfolio</h1>
          <p className="text-sm text-[#555] mt-0.5">{user.email}</p>
        </div>
        <Link
          href="/deposit"
          className="text-sm px-4 py-2 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#800020" }}
        >
          + Deposit
        </Link>
      </div>

      {/* Total balance card */}
      <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6">
        <p className="text-xs text-[#444] uppercase tracking-widest mb-1">Total Balance</p>
        <p className="text-3xl font-bold font-mono text-white">{totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-xs text-[#444] mt-1">across {wallets.length} asset{wallets.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Assets */}
      <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#1a1a1a]">
          <span className="text-xs text-[#444] uppercase tracking-widest">Assets</span>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-4 h-4 border-2 border-[#2a2a2a] border-t-[#555] rounded-full animate-spin" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="px-5 py-10 text-center space-y-3">
            <p className="text-[#444] text-sm">No assets yet.</p>
            <Link href="/deposit" className="text-[#800020] hover:underline text-sm">
              Deposit to get started →
            </Link>
          </div>
        ) : (
          <div>
            {wallets.map((w, i) => (
              <div
                key={w.id}
                className={`flex items-center justify-between px-5 py-4 hover:bg-[#111] transition-colors ${i > 0 ? "border-t border-[#141414]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <CoinIcon asset={w.asset} size={36} />
                  <div>
                    <p className="font-semibold text-sm">{w.asset}</p>
                    {w.lockedBalance > 0 && (
                      <p className="text-[10px] text-[#444] mt-0.5">
                        {w.lockedBalance.toFixed(4)} locked in orders
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-sm">{w.balance.toFixed(w.balance < 1 ? 6 : 4)}</p>
                  <p className="text-[10px] text-[#444] font-mono mt-0.5">
                    avail: {(w.balance - w.lockedBalance).toFixed(w.balance < 1 ? 6 : 4)}
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
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1f1f1f] text-sm text-[#666] hover:text-white hover:border-[#2a2a2a] hover:bg-[#0d0d0d] transition-colors"
        >
          Trade →
        </Link>
        <Link
          href="/deposit"
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1f1f1f] text-sm text-[#666] hover:text-white hover:border-[#2a2a2a] hover:bg-[#0d0d0d] transition-colors"
        >
          Deposit →
        </Link>
      </div>
    </main>
  );
}
