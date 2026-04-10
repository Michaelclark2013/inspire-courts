"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-sm flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
            Admin Login
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            Inspire Courts Operations Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-sm px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-white text-xs font-bold uppercase tracking-wider mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg-secondary border border-border rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="admin@inspirecourts.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-white text-xs font-bold uppercase tracking-wider mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-bg-secondary border border-border rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-3.5 rounded-sm font-bold text-sm uppercase tracking-wide transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}{" "}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
