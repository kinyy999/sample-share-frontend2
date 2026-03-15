"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = email.trim() !== "" && password.trim().length >= 6 && !loading;
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setToken(null);
    setRole(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      setToken(data.token);
      setRole(data.role);
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_role", data.role);
      setSuccess("User connected successfully ✅");
      setTimeout(() => router.push("/samples"), 10);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  function copyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          SampleShare – Login
        </h1>
        <p className="text-center text-slate-300 text-sm mb-8">
          היכנס עם המייל והסיסמה שלך
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400 outline-none"
              placeholder="name@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400 outline-none"
              placeholder="••••••••"
              minLength={6}
              required
            />
            <span className="text-xs text-slate-400">לפחות 6 תווים</span>
          </label>

          {error && (
            <div className="rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded-md px-4 py-2 font-medium transition-all ${
              canSubmit
                ? "bg-cyan-400/90 hover:bg-cyan-300 text-slate-900"
                : "bg-slate-700/40 text-slate-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-4">
          <Link
            href="/samples"
            className="block w-full rounded-md border border-slate-600 bg-slate-800/60 hover:bg-slate-700 px-4 py-2 text-center text-slate-100 transition"
          >
            Continue as Guest
          </Link>
        </div>

        {token && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>
                <strong>Role:</strong> {role}
              </span>
              <button
                onClick={copyToken}
                className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
              >
                Copy token
              </button>
            </div>
            <textarea
              readOnly
              value={token}
              className="w-full h-28 rounded-md border border-slate-700 bg-slate-950/30 p-2 text-xs text-slate-300 font-mono"
            />
          </div>
        )}

        <div className="mt-6 text-center text-sm text-slate-400">
          <span>?אין לך חשבון</span>{" "}
          <Link
            href="/register"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 ml-1"
          >
            להרשמה
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          API: <code className="text-cyan-400">{API_BASE}/login</code>
        </p>
      </div>
    </main>
  );
}
