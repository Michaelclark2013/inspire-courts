"use client";

import { useState, FormEvent } from "react";
import { trackConversion } from "@/lib/analytics";

interface EmailSignupProps {
  variant?: "dark" | "light";
}

export default function EmailSignup({ variant = "light" }: EmailSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isDark = variant === "dark";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        setStatus("error");
        // Status-class fallback so users know whether to wait, retry,
        // or fix the email field.
        const fallback =
          res.status === 429
            ? "Too many sign-ups from this connection. Please wait a minute."
            : res.status >= 500
              ? "Service is temporarily down. Try again in a moment."
              : res.status === 400
                ? "That email doesn't look right. Double-check and try again."
                : "Something went wrong. Try again.";
        setMessage(data.error || fallback);
        return;
      }

      setStatus("success");
      setMessage("You're in! Check your inbox — and your spam folder just in case.");
      setEmail("");
      trackConversion("newsletter_signup");
    } catch {
      setStatus("error");
      setMessage("Network problem. Check your connection and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2
        className={`text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight font-[var(--font-chakra)] mb-4 ${
          isDark ? "text-white" : "text-navy"
        }`}
      >
        Stay in the Loop
      </h2>
      <p
        className={`text-lg leading-relaxed mb-2 max-w-xl mx-auto ${
          isDark ? "text-white/70" : "text-text-muted"
        }`}
      >
        Get early access to event registration and schedule updates — before spots sell out.
      </p>
      <p
        className={`text-sm mb-8 max-w-md mx-auto ${
          isDark ? "text-white/75" : "text-text-muted"
        }`}
      >
        Tournament announcements, schedule drops, and Inspire Courts news. No spam.
      </p>

      {status === "success" ? (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-full px-6 py-4 font-semibold text-sm animate-[slideUp_0.4s_ease-out_both]" role="status" aria-live="polite" aria-atomic="true">
          <span className="inline-flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-[dash_0.5s_ease-out_0.2s_both]" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: 'dash 0.5s ease-out 0.2s forwards' }} />
            </svg>
            {message}
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
          <input
            type="email"
            required
            placeholder="Enter your email"
            aria-label="Email address"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className={`flex-1 max-w-md px-6 py-4 rounded-full text-sm outline-none transition-all ${
              isDark
                ? "bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:border-red"
                : "bg-white border-2 border-light-gray text-navy placeholder:text-text-muted/50 focus:border-red shadow-sm"
            }`}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            aria-busy={status === "loading"}
            className="bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_4px_20px_rgba(204,0,0,0.3)] font-[var(--font-chakra)] disabled:opacity-60 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      )}

      {status === "error" && (
        <div className="mt-3 inline-flex items-center gap-2 text-red text-sm font-medium" role="alert" aria-live="assertive">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
