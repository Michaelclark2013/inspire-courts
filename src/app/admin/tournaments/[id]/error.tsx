"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function TournamentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 sm:p-10 max-w-xl mx-auto">
      <div className="bg-white border border-border shadow-sm rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-red/10 text-red rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-navy font-bold text-lg mb-2">
          Something went wrong loading this tournament
        </h1>
        <p className="text-text-secondary text-sm mb-6">
          {error?.message || "An unexpected error occurred."}
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/admin/tournaments/manage"
            className="inline-flex items-center gap-2 border border-border text-navy hover:bg-off-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            <Home className="w-4 h-4" /> Back to tournaments
          </Link>
        </div>
      </div>
    </div>
  );
}
