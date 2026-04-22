"use client";

import { memo, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Per-second "Updated Ns ago" ticker, isolated so only this component
 * re-renders every second. Matches the dashboard pattern.
 */
function StalenessIndicatorBase({
  lastFetched,
  onRefresh,
  refreshing,
}: {
  lastFetched: Date | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  // Derive from a shared "now" tick so there's no setState-in-effect
  // reset when lastFetched changes. Lazy-init seeds `now` at mount;
  // the interval effect only writes on observable clock ticks.
  const [now, setNow] = useState<number>(() =>
    typeof window === "undefined" ? 0 : Date.now()
  );
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secondsAgo =
    lastFetched && now
      ? Math.max(0, Math.round((now - lastFetched.getTime()) / 1000))
      : 0;

  const color =
    secondsAgo >= 180
      ? "text-red"
      : secondsAgo >= 90
        ? "text-amber-600"
        : "text-text-secondary";

  const label = !lastFetched
    ? "Loading…"
    : secondsAgo < 5
      ? "Updated just now"
      : `Updated ${secondsAgo}s ago`;

  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <span className={`text-[11px] font-semibold tabular-nums ${color}`}>
        {label}
      </span>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-1.5 text-navy/60 hover:text-navy text-xs font-semibold uppercase tracking-wider px-3 py-2 border border-border rounded-lg hover:border-navy/30 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none min-h-[44px] sm:min-h-0"
        aria-label="Refresh check-in data"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  );
}

export default memo(StalenessIndicatorBase);
