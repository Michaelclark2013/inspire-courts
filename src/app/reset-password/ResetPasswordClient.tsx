"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-navy-light/80 backdrop-blur border border-white/10 rounded-xl p-7 shadow-2xl text-center">
        <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-red" aria-hidden="true" />
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Invalid Link</h2>
        <p className="text-white/50 text-sm mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-red text-sm hover:text-red-hover transition-colors"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-navy-light/80 backdrop-blur border border-white/10 rounded-xl p-7 shadow-2xl">
      {success ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" aria-hidden="true" />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Password Updated</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover text-white py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-red/20"
          >
            Sign In
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-red" aria-hidden="true" />
            <h2 className="text-white text-sm font-bold uppercase tracking-wider">
              New Password
            </h2>
          </div>
          <p className="text-white/40 text-xs mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div role="alert" aria-live="assertive" className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3.5 pr-12 text-white text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-white/25"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-white/25"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              aria-busy={loading}
              className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-red/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white/40 text-xs hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" aria-hidden="true" />
              Back to Sign In
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordClient() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-navy pointer-events-none" />

      <div className="relative w-full max-w-sm z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Image src="/images/inspire-athletics-logo.png" alt="Inspire Athletics" width={80} height={80} className="object-contain mx-auto mb-5" priority />
          <h1 className="text-white text-xl font-bold uppercase tracking-widest mb-1">
            Inspire Courts
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em]">
            Password Reset
          </p>
        </div>

        <Suspense fallback={
          <div className="bg-navy-light/80 backdrop-blur border border-white/10 rounded-xl p-7 shadow-2xl text-center">
            <Loader2 className="w-6 h-6 text-white/40 animate-spin mx-auto" aria-hidden="true" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center text-white/20 text-xs mt-8 uppercase tracking-widest">
          Inspire Courts AZ &bull; Gilbert, Arizona
        </p>
      </div>
    </div>
  );
}
