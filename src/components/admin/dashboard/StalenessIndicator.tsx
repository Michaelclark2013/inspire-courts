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
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastFetched) return;
    setSecondsAgo(0);
    const id = setInterval(() => {
      setSecondsAgo(Math.round((Date.now() - lastFetched.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastFetched]);

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
