"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function CheckInError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CheckIn] Route error:", error);
  }, [error]);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading mb-4">
        Game Day Check-In
      </h1>
      <div
        className="bg-white border border-border shadow-sm rounded-xl p-8 text-center"
        role="alert"
      >
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-navy text-lg font-bold mb-2">
          Something went wrong
        </h2>
        <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
          {error.message || "Failed to load check-in data. This may be a temporary issue with the data source."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 min-h-[44px] rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
