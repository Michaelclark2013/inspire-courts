"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function TournamentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red" aria-hidden="true" />
        </div>
        <h2 className="text-navy font-bold text-xl uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
          Failed to Load Tournaments
        </h2>
        <p className="text-text-muted text-sm mb-6">
          {error.message || "Something went wrong loading tournaments. Please try again."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try Again
        </button>
      </div>
    </div>
  );
}
