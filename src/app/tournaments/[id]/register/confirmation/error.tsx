"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ConfirmationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" role="alert">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red" aria-hidden="true" />
        </div>
        <h2 className="text-navy font-bold text-xl uppercase tracking-tight mb-2 font-heading">
          Something Went Wrong
        </h2>
        <p className="text-text-muted text-sm mb-6">
          {error.message ||
            "We couldn't load your registration confirmation. Your registration may still be processing."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/portal"
            className="inline-flex items-center justify-center gap-2 border border-light-gray hover:border-light-gray/80 text-navy px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 min-h-[44px]"
          >
            Check Coach Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
