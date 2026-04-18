"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2, Trophy, ArrowRight, Share2, Copy, CalendarPlus } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

type RegStatus = {
  id: number;
  status: string;
  paymentStatus: string;
  teamName: string;
};

const MAX_POLLS = 60; // Stop after ~3 minutes (60 × 3s)

function ConfirmationContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const regId = searchParams.get("reg");
  const [regStatus, setRegStatus] = useState<RegStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const isConfirmed =
    regStatus?.status === "approved" &&
    (regStatus?.paymentStatus === "paid" || regStatus?.paymentStatus === "waived");

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  const poll = useCallback(async () => {
    if (!regId) return;
    pollCountRef.current += 1;
    if (pollCountRef.current > MAX_POLLS) {
      setTimedOut(true);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(
        `/api/tournaments/${id}/registration-status?reg=${regId}`,
        { signal: controller.signal }
      );
      if (res.ok) {
        const data = await res.json();
        setRegStatus(data);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
    setLoading(false);
  }, [id, regId]);

  // Start polling
  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => {
      stopPolling();
      abortRef.current?.abort();
    };
  }, [poll, stopPolling]);

  // Stop polling once confirmed or timed out
  useEffect(() => {
    if (isConfirmed || timedOut) {
      stopPolling();
    }
  }, [isConfirmed, timedOut, stopPolling]);

  const isPending = regStatus && !isConfirmed;

  const [copied, copy] = useCopyToClipboard();

  const tournamentUrl = typeof window !== "undefined" ? `${window.location.origin}/tournaments/${id}` : "";

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Tournament Registration", url: tournamentUrl });
      } catch { /* user cancelled */ }
    } else {
      await copy(tournamentUrl);
    }
  }

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-text-muted mx-auto" aria-hidden="true" />
        ) : isConfirmed ? (
          <>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-navy font-heading mb-2">
              You&apos;re Registered!
            </h1>
            <p className="text-text-muted mb-2">
              <span className="text-navy font-semibold">{regStatus?.teamName}</span>{" "}
              has been added to the tournament.
            </p>

            {/* Next steps checklist */}
            <div className="bg-white border border-light-gray rounded-xl p-4 mb-6 text-left">
              <h2 className="text-navy text-xs font-bold uppercase tracking-wider mb-3 font-[var(--font-chakra)]">Next Steps</h2>
              <ol className="space-y-2 text-sm text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">1.</span>
                  <span>Submit <Link href="/portal/waiver" className="text-red font-semibold hover:underline">player waivers</Link> before game day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">2.</span>
                  <span>Upload your <Link href="/portal/roster" className="text-red font-semibold hover:underline">team roster</Link></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">3.</span>
                  <span>Check in on <Link href="/portal/checkin" className="text-red font-semibold hover:underline">game day</Link></span>
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Link
                href={`/tournaments/${id}`}
                className="flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
              >
                <Trophy className="w-4 h-4" aria-hidden="true" />
                View Bracket
              </Link>
              <Link
                href="/portal"
                className="flex items-center justify-center gap-2 border border-light-gray hover:border-light-gray/80 text-navy px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
              >
                Coach Portal
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Share / Copy link + Calendar */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wide transition-colors"
              >
                {copied ? <><Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Share</>}
              </button>
              <a
                href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Tournament at Inspire Courts")}&location=${encodeURIComponent("Inspire Courts AZ, 1090 N Fiesta Blvd, Gilbert, AZ")}&details=${encodeURIComponent("Tournament registration confirmed. View details at " + tournamentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wide transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" /> Add to Calendar
              </a>
            </div>
          </>
        ) : timedOut ? (
          <>
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-500" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-navy font-heading mb-2">
              Still Processing
            </h1>
            <p className="text-text-muted mb-2">
              Your payment is taking longer than expected.
            </p>
            <p className="text-text-muted text-sm mb-6">
              Don&apos;t worry — if your payment went through, your registration is safe.
              You&apos;ll receive a confirmation email, or you can check the coach portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/portal"
                className="flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
              >
                Check Coach Portal <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact?type=Tournament+Registration"
                className="flex items-center justify-center gap-2 border border-light-gray hover:border-light-gray/80 text-navy px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
              >
                Contact Us
              </Link>
            </div>
          </>
        ) : isPending ? (
          <>
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-500" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-navy font-heading mb-2">
              Payment Processing
            </h1>
            <p className="text-text-muted mb-2">
              Waiting for payment confirmation for{" "}
              <span className="text-navy font-semibold">{regStatus?.teamName}</span>.
            </p>
            <p className="text-text-muted text-sm mb-4">
              This page will update automatically once your payment is confirmed.
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-amber-500 mx-auto" aria-hidden="true" />
          </>
        ) : (
          <>
            <p className="text-text-muted">Registration not found.</p>
            <Link href="/tournaments" className="text-red text-sm mt-4 inline-block">
              Browse Tournaments
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-off-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-text-muted" aria-hidden="true" /></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
