"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function ScoreEntryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Score entry error:", error);
  }, [error]);

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto bg-white border border-border shadow-sm rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red mx-auto mb-3" />
        <h2 className="text-navy font-bold text-lg font-heading mb-2">Score Entry Error</h2>
        <p className="text-text-secondary text-sm mb-5">
          Something went wrong loading the score entry page. Your data is safe.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 border border-border hover:border-navy/30 text-navy px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            <Home className="w-4 h-4" /> Admin home
          </Link>
        </div>
      </div>
    </div>
  );
}
