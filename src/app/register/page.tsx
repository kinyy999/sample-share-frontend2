"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const canSubmit =
    username.trim() !== "" &&
    email.trim() !== "" &&
    password.trim().length >= 6 &&
    !loading;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess("User registered successfully ✅");
        setUsername("");
        setEmail("");
        setPassword("");
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-white mb-2">Register</h1>
        <p className="text-center text-slate-300 text-sm mb-8">צור חשבון חדש</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-md border border-slate-600 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400 outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-slate-600 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400 outline-none"
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-md border border-slate-600 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400 outline-none"
          />

          {error && (
            <div className="rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-green-500/60 bg-green-950/40 px-3 py-2 text-sm text-green-300">
              {success}
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
            {loading ? "Registering…" : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          <span>כבר יש לך חשבון?</span>{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
          >
            התחבר כאן
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          API: <code className="text-cyan-400">{API_BASE}/register</code>
        </p>
      </div>
    </main>
  );
}
