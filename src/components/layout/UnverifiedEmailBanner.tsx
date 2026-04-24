"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertCircle, X, Loader2 } from "lucide-react";

/**
 * Sticky banner rendered under the header for signed-in users whose
 * email isn't verified yet. One-click Resend hits
 * /api/auth/resend-verification which rate-limits to 3/hr per address.
 *
 * Dismiss state is per-session — the banner comes back on the next
 * navigation until the user actually verifies.
 *
 * Admin role is whitelisted (see the `role !== "admin"` check below) so
 * admins who were registered during the email-verification rollout
 * don't see the banner while they're managing the site.
 */
export default function UnverifiedEmailBanner() {
  const { data: session, status } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  if (status !== "authenticated") return null;
  if (!session?.user) return null;
  if (session.user.role === "admin") return null;
  if (session.user.emailVerifiedAt) return null;
  if (dismissed) return null;

  const resend = async () => {
    setResending(true);
    setResendError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Could not resend right now.");
      }
      setResendDone(true);
    } catch (err) {
      setResendError(
        err instanceof Error ? err.message : "Could not resend right now."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 border-b border-amber-200 text-navy"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 text-xs sm:text-sm">
        <AlertCircle
          className="w-4 h-4 text-amber-600 flex-shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          {resendDone ? (
            <span className="font-bold">
              Sent — check your inbox. The link expires in 24 hours.
            </span>
          ) : (
            <span>
              <strong className="font-bold">Verify your email</strong> to
              register for tournaments, sign waivers, and use the portal.{" "}
              <Link
                href="/verify-email"
                className="underline underline-offset-2 hover:text-red font-semibold"
              >
                Help →
              </Link>
            </span>
          )}
          {resendError && (
            <span className="block text-red font-semibold mt-0.5">
              {resendError}
            </span>
          )}
        </div>
        {!resendDone && (
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="inline-flex items-center gap-1 bg-red hover:bg-red-hover disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors"
          >
            {resending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Sending…
              </>
            ) : (
              "Resend"
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="p-1 text-text-secondary hover:text-navy flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
