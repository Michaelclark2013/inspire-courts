"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2, Trophy, ArrowRight } from "lucide-react";

type RegStatus = {
  id: number;
  status: string;
  paymentStatus: string;
  teamName: string;
};

const MAX_POLLS = 60; // Stop after ~3 minutes (60 × 3s)

export default function ConfirmationPage() {
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

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-text-muted mx-auto" />
        ) : isConfirmed ? (
          <>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-navy font-heading mb-2">
              You&apos;re Registered!
            </h1>
            <p className="text-text-muted mb-2">
              <span className="text-navy font-semibold">{regStatus?.teamName}</span>{" "}
              has been added to the tournament.
            </p>
            <p className="text-text-muted text-sm mb-8">
              You&apos;ll receive tournament updates at your registered email.
              Submit waivers and manage your roster through the coach portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/tournaments/${id}`}
                className="flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
              >
                <Trophy className="w-4 h-4" />
                View Bracket
              </Link>
              <Link
                href="/portal"
                className="flex items-center justify-center gap-2 border border-light-gray hover:border-light-gray/80 text-navy px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
              >
                Coach Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : timedOut ? (
          <>
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-400" />
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
                Check Coach Portal <ArrowRight className="w-4 h-4" />
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
              <Clock className="w-8 h-8 text-amber-400" />
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
            <Loader2 className="w-5 h-5 animate-spin text-amber-400 mx-auto" />
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
