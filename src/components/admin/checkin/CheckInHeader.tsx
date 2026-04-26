"use client";

import { RefreshCw, ExternalLink, Loader2 } from "lucide-react";

interface CheckInHeaderProps {
  today: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function CheckInHeader({
  today,
  onRefresh,
  isRefreshing,
}: CheckInHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
      {/* Title hidden on mobile — MobileAdminHeader already shows
          "Check-In" in the sticky sub-header. */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">
          Game Day Check-In
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {today} &middot; Team &amp; player check-in status
        </p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="https://receptive-garage-315.notion.site/a9ade37afede4d299b43707e3f4f97b5?v=a4e7fb8f098e4388b2d69e228cd110ee"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-navy/50 hover:text-navy text-xs font-semibold uppercase tracking-wider px-4 py-2.5 min-h-[44px] border border-border rounded-lg hover:border-navy/30 transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
        >
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> Check-In Sheet
        </a>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh check-in data"
          className="flex items-center gap-2 text-navy/50 hover:text-navy text-xs font-semibold uppercase tracking-wider px-4 py-2.5 min-h-[44px] border border-border rounded-lg hover:border-navy/30 transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
        >
          {isRefreshing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          Refresh
        </button>
      </div>
    </div>
  );
}
