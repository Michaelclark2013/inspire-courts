"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="mb-4 bg-red/5 border border-red/20 text-red rounded-lg px-4 py-2.5 flex items-center gap-3 text-sm"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:underline focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
}
