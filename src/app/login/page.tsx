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

      // מצפה למבנה: { token, role }
      setToken(data.token);
      setRole(data.role);

      // שמירת הטוקן לזמן הדפדפן (אפשר להחליף ל־cookies בהמשך)
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_role", data.role);
      setSuccess("User connected successfully ✅");
      setTimeout(() => {
        router.push("/samples");
        }, 10);
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-black p-6">
        <h1 className="text-2xl font-bold text-center text-black mb-1">SampleShare – Login</h1>
        <p className="text-center text-black text-sm mb-6">
          היכנס עם המייל והסיסמה שלך
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-black">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full text-black rounded-md border border-black px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-black">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full text-black rounded-md border border-black px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              minLength={6}
              required
            />
            <span className="text-xs text-gray-700">לפחות 6 תווים</span>
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded-md px-4 py-2 font-medium text-white
              ${canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}
            `}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-2">
          <Link
            href="/samples"
            className="block w-full rounded-md border px-3 py-2 text-center bg-blue-600 hover:bg-blue-700 "
          >
            Continue as Guest
          </Link>
        </div>


        {token && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                <strong>Role:</strong> {role}
              </span>
              <button
                onClick={copyToken}
                className="text-sm text-blue-600 hover:underline"
                title="Copy token"
              >
                Copy token
              </button>
            </div>
            <textarea
              readOnly
              value={token}
              className="w-full h-28 text-gray-500 rounded-md border border-gray-300 p-2 text-xs font-mono bg-gray-50"
            />
          </div>
        )}
        <div className="mt-3 text-center">
          <Link
            href="/register"
            className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700 underline underline-offset-4"
          >
             להרשמה
          </Link>

          <span className="text-sm text-gray-600 dark:text-gray-600">
                 ?אין לך חשבון
          </span>{" "}
        </div>
        <p className="mt-6 text-center text-xs text-gray-600">
          API: <code>{API_BASE}/login</code>
        </p>
      </div>
    </main>
  );
}
