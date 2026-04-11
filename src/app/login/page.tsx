"use client";

import { useState, useEffect } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ADMIN_ROLES = ["admin", "staff", "ref", "front_desk"];
import Image from "next/image";
import { ArrowRight, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  // Auto-redirect if already signed in (e.g., after OAuth callback)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role as string;
      if (ADMIN_ROLES.includes(role)) {
        router.push("/admin");
      } else {
        router.push("/portal");
      }
    }
  }, [status, session, router]);

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
      // Route based on user role
      const session = await getSession();
      const role = session?.user?.role;
      if (ADMIN_ROLES.includes(role || "")) {
        router.push("/admin");
      } else {
        router.push("/portal");
      }
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-navy pointer-events-none" />

      <div className="relative w-full max-w-sm z-10">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <Image src="/images/inspire-athletics-logo.png" alt="Inspire Athletics" width={80} height={80} className="object-contain mx-auto mb-5" priority />
          <h1 className="text-white text-xl font-bold uppercase tracking-widest mb-1">
            Inspire Courts
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em]">
            Dashboard
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

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/login" })}
              className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-100 text-gray-800 py-3.5 rounded-lg font-semibold text-sm transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-navy-light/80 px-3 text-white/30 uppercase tracking-wider">or sign in with email</span>
            </div>
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
                placeholder="Admin email"
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

        {/* Register link */}
        <div className="mt-5 text-center">
          <span className="text-white/30 text-xs">Don&apos;t have an account? </span>
          <Link href="/register" className="text-red text-xs hover:text-red-hover transition-colors font-semibold">
            Create Account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-6 uppercase tracking-widest">
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
