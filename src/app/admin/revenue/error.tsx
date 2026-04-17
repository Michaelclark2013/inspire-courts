"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RevenueError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Revenue page error", error);
  }, [error]);

  return (
    <div
      className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]"
      role="alert"
    >
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red" aria-hidden="true" />
        </div>
        <h2 className="text-navy font-bold text-xl mb-2">
          Revenue Data Unavailable
        </h2>
        <p className="text-text-secondary text-sm mb-2">
          Could not load revenue data from Google Sheets. The sheet may be
          temporarily unavailable or credentials may have expired.
        </p>
        {error?.digest && (
          <p className="text-text-secondary text-[10px] font-mono mb-6">
            Ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-off-white hover:bg-light-gray text-navy px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 min-h-[44px]"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
