"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2, Trophy, ArrowRight } from "lucide-react";

type RegStatus = {
  id: number;
  status: string;
  paymentStatus: string;
  teamName: string;
};

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const regId = searchParams.get("reg");
  const [regStatus, setRegStatus] = useState<RegStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const poll = useCallback(async () => {
    if (!regId) return;
    try {
      const res = await fetch(
        `/api/tournaments/${id}/registration-status?reg=${regId}`
      );
      if (res.ok) {
        const data = await res.json();
        setRegStatus(data);
      }
    } catch {}
    setLoading(false);
  }, [id, regId]);

  useEffect(() => {
    poll();
    // Poll every 3 seconds until confirmed
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [poll]);

  // Stop polling once approved
  useEffect(() => {
    if (regStatus?.status === "approved" && regStatus?.paymentStatus === "paid") {
      // Already confirmed, no need to keep polling
    }
  }, [regStatus]);

  const isConfirmed =
    regStatus?.status === "approved" &&
    (regStatus?.paymentStatus === "paid" || regStatus?.paymentStatus === "waived");

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
                className="flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                <Trophy className="w-4 h-4" />
                View Bracket
              </Link>
              <Link
                href="/portal"
                className="flex items-center justify-center gap-2 border border-light-gray hover:border-light-gray/80 text-navy px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                Coach Portal
                <ArrowRight className="w-4 h-4" />
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
