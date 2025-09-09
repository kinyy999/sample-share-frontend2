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
        // נחכה 3 שניות כדי להראות את ההודעה, ואז נעבור ל-login
        setTimeout(() => {
        router.push("/login");
        }, 3000);

      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-center text-black mb-1">Register</h1>
        <p className="text-center text-gray-700 text-sm mb-6">
          צור חשבון חדש
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full placeholder-black text-black"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full placeholder-black text-black"
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="border rounded px-3 py-2 w-full placeholder-black text-black"
          />

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          {success && (
            <p className="text-green-600 text-sm">{success}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded-md px-4 py-2 font-medium text-white
              ${canSubmit ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}
            `}
          >
            {loading ? "Registering…" : "Register"}
          </button>
        </form>
      </div>
    </main>
  );
}
