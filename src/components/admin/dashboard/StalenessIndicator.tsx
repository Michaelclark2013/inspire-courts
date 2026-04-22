"use client";

import { memo, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

// Per-second "Updated Ns ago" ticker. Isolated so the seconds counter
// re-rendering doesn't touch anything else on the dashboard.
function StalenessIndicator({
  lastFetched,
  onRefresh,
  refreshing,
}: {
  lastFetched: Date | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  // Derive secondsAgo from a shared "now" tick instead of resetting
  // a stored counter on lastFetched changes. Lazy-init seeds `now`
  // at mount so there's no setState-in-effect bounce; the interval
  // effect only writes when the timer fires, which is user-
  // observable clock motion and not a render-phase cascade.
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
    secondsAgo >= 120
      ? "text-red"
      : secondsAgo >= 60
        ? "text-amber-600"
        : "text-text-secondary";

  return (
    <div
      className="flex items-center justify-end gap-2"
      role="status"
      aria-live="polite"
    >
      <span className={`text-[10px] tabular-nums ${color}`}>
        Updated {secondsAgo}s ago
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh dashboard now"
        title="Refresh now"
        className="text-text-secondary hover:text-navy transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded p-1 min-h-[44px] min-w-[44px] flex items-center justify-center lg:min-h-0 lg:min-w-0 lg:p-0"
      >
        <RefreshCw
          className={`w-4 h-4 lg:w-3.5 lg:h-3.5 ${refreshing ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  );
}

export default memo(StalenessIndicator);
