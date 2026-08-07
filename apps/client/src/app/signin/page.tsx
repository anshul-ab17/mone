"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function SigninPage() {
  const { signin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signin(email, password);
      router.push("/trade");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-1 items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 60%), #07090e" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <img src="/waarrr.png" alt="Mone" width={52} height={52} className="rounded-full object-contain" />
          </Link>
        </div>

        <div className="bg-[#0c0f17] border border-[#181f2b] rounded-2xl p-8 space-y-6 shadow-2xl">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Welcome to Mone</h1>
            <p className="text-xs text-[#64748b] mt-1">Sign in to your trading account</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#94a3b8] text-xs uppercase tracking-wider font-semibold">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="bg-[#11151f] border-[#1e2736] text-white placeholder:text-[#475569] focus-visible:ring-1 focus-visible:ring-[#38bdf8] focus-visible:border-[#38bdf8]/40 h-11 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#94a3b8] text-xs uppercase tracking-wider font-semibold">Password</Label>
              <Input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="bg-[#11151f] border-[#1e2736] text-white placeholder:text-[#475569] focus-visible:ring-1 focus-visible:ring-[#38bdf8] focus-visible:border-[#38bdf8]/40 h-11 rounded-lg text-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-lg font-bold text-sm text-[#05131d] bg-[#38bdf8] hover:bg-[#7dd3fc] transition-all shadow-md shadow-sky-950/40 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
