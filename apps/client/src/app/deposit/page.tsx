"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/context/AuthContext";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type DepositEntry = {
  signature: string;
  amount: number;
  asset: string;
  createdAt: string;
};

export default function DepositPage() {
  const { user, loading: authLoading } = useAuth();
  const { connected, publicKey } = useWallet();
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>("devnet");
  const [history, setHistory] = useState<DepositEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDepositInfo();
  }, [user]);

  async function fetchDepositInfo() {
    setLoading(true);
    setError(null);
    try {
      const [addrRes, histRes] = await Promise.all([
        fetch(`${API}/api/deposit/address`, { credentials: "include" }),
        fetch(`${API}/api/deposit/history`, { credentials: "include" }),
      ]);

      if (addrRes.ok) {
        const { publicKey, network } = await addrRes.json();
        setDepositAddress(publicKey);
        if (network) setNetwork(network);
      } else {
        const errJson = await addrRes.json().catch(() => ({}));
        setError(errJson.error ?? "Failed to load deposit address");
      }

      if (histRes.ok) {
        const { deposits } = await histRes.json();
        if (deposits) setHistory(deposits);
      }
    } catch {
      setError("Deposit service temporarily unreachable");
    } finally {
      setLoading(false);
    }
  }

  function copyAddress() {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (authLoading) {
    return (
      <main className="flex-1 bg-[#07090e] text-white flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <span className="w-6 h-6 border-2 border-[#1e293b] border-t-[#38bdf8] rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 bg-[#07090e] text-white flex flex-col items-center justify-center p-6 min-h-[calc(100vh-3.5rem)] text-center space-y-4">
        <h1 className="text-xl font-semibold text-white">Deposit Crypto</h1>
        <p className="text-sm text-[#64748b] max-w-sm">Sign in to access your personal deposit address and history.</p>
        <Link
          href="/signin"
          className="inline-flex items-center justify-center px-6 h-10 rounded-lg text-xs font-bold bg-[#38bdf8] text-[#05131d] hover:bg-[#7dd3fc] transition-all shadow-md shadow-sky-950/30"
        >
          Sign In
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#07090e] text-white p-6 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Deposit SOL</h1>
            <p className="text-xs text-[#64748b] mt-0.5">Instant credit upon blockchain confirmation</p>
          </div>
          <ConnectWalletButton
            className="h-9 px-4 text-xs font-bold rounded-lg bg-[#38bdf8] text-[#05131d] hover:bg-[#7dd3fc] transition-all shadow-md shadow-sky-950/40"
          />
        </div>

        {/* Connected wallet indicator */}
        {connected && publicKey && (
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] bg-[#0c0f17] px-3.5 py-2 rounded-lg border border-[#181f2b]">
            <span className="w-2 h-2 rounded-full bg-[#00c087] animate-pulse" />
            <span>Connected:</span>
            <span className="font-mono text-[#38bdf8]">{publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}</span>
          </div>
        )}

        {/* Deposit address card */}
        <div className="bg-[#0c0f17] border border-[#181f2b] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#0369a1]/30 text-[#38bdf8] border border-[#0284c7]/40 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                {network}
              </span>
              <span className="text-xs text-[#94a3b8] font-medium">Your SOL Deposit Address</span>
            </div>
            <span className="text-[11px] text-[#00c087] flex items-center gap-1 font-mono">
              ● Active
            </span>
          </div>

          <div className="flex items-center gap-3 bg-[#11151f] border border-[#1e2736] rounded-xl p-3.5">
            <span className="font-mono text-xs sm:text-sm break-all flex-1 text-[#38bdf8] font-semibold">
              {depositAddress}
            </span>
            <button
              onClick={copyAddress}
              className="shrink-0 text-xs bg-[#1e2736] hover:bg-[#253245] text-white font-medium px-3.5 py-1.5 rounded-lg transition-colors border border-[#2b384d]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="text-xs text-[#64748b] leading-relaxed">
            Send SOL to this address from any Solana wallet. Deposits are detected automatically and credited within ~10 seconds.
          </p>
        </div>

        {/* Deposit history */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[#94a3b8]">Deposit History</h2>
          {history.length === 0 ? (
            <div className="bg-[#0c0f17] border border-[#181f2b] rounded-xl p-6 text-center text-xs text-[#475569]">
              No deposits recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((d) => (
                <div
                  key={d.signature}
                  className="flex items-center justify-between bg-[#0c0f17] border border-[#181f2b] rounded-xl px-4 py-3.5 hover:border-[#263347] transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-[#00c087] font-mono font-bold text-sm">
                      +{d.amount.toFixed(4)} {d.asset}
                    </span>
                    <p className="text-[11px] text-[#64748b] font-mono">
                      {d.signature}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#475569] font-mono">
                    {new Date(d.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
