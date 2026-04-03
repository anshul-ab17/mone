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
      style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(128,0,32,0.1) 0%, transparent 60%), #0a0a0a" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl tracking-widest text-white">
            <span style={{ color: "#800020" }}>M</span>O<span style={{ color: "#800020" }}>N</span>E
          </Link>
        </div>

        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-8 space-y-6">
          <div>
            <h1 className="text-lg font-semibold text-white">Welcome back</h1>
            <p className="text-sm text-[#555] mt-0.5">Sign in to your account</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#666] text-xs uppercase tracking-wide">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="bg-[#111] border-[#222] text-white placeholder:text-[#333] focus-visible:ring-1 focus-visible:ring-[#800020] focus-visible:border-[#800020]/40 h-11 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#666] text-xs uppercase tracking-wide">Password</Label>
              <Input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="bg-[#111] border-[#222] text-white placeholder:text-[#333] focus-visible:ring-1 focus-visible:ring-[#800020] focus-visible:border-[#800020]/40 h-11 rounded-lg"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-opacity active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{ background: "linear-gradient(135deg, #800020, #a0002a)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <div className="text-center text-xs text-[#444]">
            No account?{" "}
            <Link href="/signup" className="text-[#800020] hover:text-[#a0002a] transition-colors">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
