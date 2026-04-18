"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
            Password Recovery
          </p>
        </div>

        {/* Card */}
        <div className="bg-navy-light/80 backdrop-blur border border-white/10 rounded-xl p-7 shadow-2xl">
          {sent ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" aria-hidden="true" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Check Your Email</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                If that email is associated with an account, we&apos;ve sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-red text-sm hover:text-red-hover transition-colors"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-red" aria-hidden="true" />
                <h2 className="text-white text-sm font-bold uppercase tracking-wider">
                  Reset Password
                </h2>
              </div>
              <p className="text-white/40 text-xs mb-6">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div role="alert" aria-live="assertive" className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

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
                    autoFocus
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-white/25"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  aria-busy={loading}
                  className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-red/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-white/50 text-xs hover:text-white/70 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-white/40 text-xs mt-8 uppercase tracking-widest">
          Inspire Courts AZ &bull; Gilbert, Arizona
        </p>
      </div>
    </div>
  );
}
