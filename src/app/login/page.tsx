"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
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
      setError("Invalid email or password. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-navy pointer-events-none" />

      <div className="relative w-full max-w-sm z-10">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red rounded-lg flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red/20">
            <span className="text-white font-bold text-xl tracking-tight">IC</span>
          </div>
          <h1 className="text-white text-xl font-bold uppercase tracking-widest mb-1">
            Inspire Courts
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em]">
            Operations Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div
          className={`bg-navy-light/80 backdrop-blur border border-white/10 rounded-xl p-7 shadow-2xl ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
        >
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-red" />
            <h2 className="text-white text-sm font-bold uppercase tracking-wider">
              Sign In
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3 flex items-start gap-2">
                <span className="text-red mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25"
                placeholder="mikeyclark.240@gmail.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-red text-xs hover:text-red-hover transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3.5 pr-12 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-red/20 hover:shadow-red/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-8 uppercase tracking-widest">
          Inspire Courts AZ &bull; Gilbert, Arizona
        </p>
      </div>

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
