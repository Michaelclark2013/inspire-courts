"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to client-side logger if one is configured; otherwise swallow.
    if (typeof console !== "undefined") {
      console.error("[portal] runtime error:", error);
    }
  }, [error]);

  return (
    <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh] pb-[env(safe-area-inset-bottom)]">
      <div className="text-center max-w-md bg-white border border-light-gray shadow-sm rounded-2xl p-8">
        <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red" aria-hidden="true" />
        </div>
        <h2 className="text-navy font-bold text-xl mb-2">Something went wrong</h2>
        <p className="text-text-muted text-sm mb-6">
          An unexpected error occurred while loading this page. Please try again or head back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-off-white hover:bg-navy/[0.04] text-navy px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none border border-light-gray"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
