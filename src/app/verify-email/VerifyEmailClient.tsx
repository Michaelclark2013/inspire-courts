"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";

/**
 * /verify-email landing page — ported from OFF SZN (R780).
 *
 * Two modes:
 *   (a) ?token=... in the URL — auto-calls /api/auth/verify-email on
 *       mount and shows success / expired / invalid / error states.
 *   (b) No token — "check your email" landing after signup; offers
 *       a "resend verification" button.
 */

type Status =
  | "idle"
  | "verifying"
  | "success"
  | "already"
  | "expired"
  | "invalid"
  | "error";

export default function VerifyEmailClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");

  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus(data?.alreadyVerified ? "already" : "success");
        } else if (res.status === 410 || data?.code === "expired") {
          setStatus("expired");
        } else if (res.status === 400) {
          setStatus("invalid");
        } else {
          setStatus("error");
        }
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") setStatus("error");
      }
    })();
    return () => ctrl.abort();
  }, [token]);

  const resend = async () => {
    setResending(true);
    setResendError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error || "Could not resend. Try again in a few minutes."
        );
      }
      setResendDone(true);
    } catch (err) {
      setResendError(
        err instanceof Error ? err.message : "Could not resend. Try again later."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-off-white min-h-screen">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-border rounded-xl shadow-sm p-8 text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="w-10 h-10 text-red mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-navy tracking-tight">
                Verifying your email…
              </h1>
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                Hang tight — this usually takes a second.
              </p>
            </>
          )}

          {(status === "success" || status === "already") && (
            <>
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-navy tracking-tight">
                {status === "success"
                  ? "Email verified."
                  : "You're already verified."}
              </h1>
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                {status === "success"
                  ? "Your account is ready. You can sign in and register for tournaments."
                  : "This link had already been used. You're all set — go ahead and sign in."}
              </p>
              <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/"
                  className="text-xs font-bold text-text-secondary hover:text-red uppercase tracking-wider"
                >
                  Explore the site →
                </Link>
              </div>
            </>
          )}

          {status === "expired" && (
            <>
              <XCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-navy tracking-tight">
                This link expired.
              </h1>
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                Verification links are good for 24 hours. Enter your email
                below and we&rsquo;ll send a fresh one.
              </p>
              <ResendForm
                email={resendEmail}
                setEmail={setResendEmail}
                resend={resend}
                resending={resending}
                resendDone={resendDone}
                resendError={resendError}
              />
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="w-10 h-10 text-red mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-navy tracking-tight">
                {status === "invalid"
                  ? "This link isn't valid."
                  : "Something went wrong."}
              </h1>
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                {status === "invalid"
                  ? "The link may have been copied incorrectly. Request a new one below."
                  : "Try again in a moment."}
              </p>
              <ResendForm
                email={resendEmail}
                setEmail={setResendEmail}
                resend={resend}
                resending={resending}
                resendDone={resendDone}
                resendError={resendError}
              />
            </>
          )}

          {status === "idle" && (
            <>
              <Mail className="w-10 h-10 text-red mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-navy tracking-tight">
                Check your email.
              </h1>
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                We sent a verification link. Click it to finish setting up
                your account. Didn&rsquo;t get one? Enter your email below
                and we&rsquo;ll resend.
              </p>
              <ResendForm
                email={resendEmail}
                setEmail={setResendEmail}
                resend={resend}
                resending={resending}
                resendDone={resendDone}
                resendError={resendError}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResendForm({
  email,
  setEmail,
  resend,
  resending,
  resendDone,
  resendError,
}: {
  email: string;
  setEmail: (v: string) => void;
  resend: () => void;
  resending: boolean;
  resendDone: boolean;
  resendError: string | null;
}) {
  if (resendDone) {
    return (
      <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3 text-xs text-emerald-700 font-semibold">
        If that email is on file, a new verification link is on the way.
      </div>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!resending && email.trim()) resend();
      }}
      className="mt-6 flex flex-col gap-2"
    >
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value.slice(0, 200))}
        className="w-full bg-off-white border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red/30 focus:border-red"
      />
      <button
        type="submit"
        disabled={resending || !email.trim()}
        className="inline-flex items-center justify-center gap-1.5 bg-red hover:bg-red-hover disabled:opacity-50 text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
      >
        {resending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Sending…
          </>
        ) : (
          "Resend verification link"
        )}
      </button>
      {resendError && (
        <p className="text-xs text-red font-semibold mt-1">{resendError}</p>
      )}
    </form>
  );
}
