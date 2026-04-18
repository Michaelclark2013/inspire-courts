"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { triggerHaptic } from "@/lib/capacitor";
import { RefreshCw } from "lucide-react";

type RefreshIndicatorProps = {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isFetching?: boolean;
};

// Isolated so the per-second re-render does not cascade to the whole page.
function RefreshIndicatorImpl({ lastUpdated, onRefresh, isFetching = false }: RefreshIndicatorProps) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  // Auto-refresh when data is stale (>5 min)
  useEffect(() => {
    if (secondsAgo >= 300 && !isFetching) {
      onRefresh();
    }
  }, [secondsAgo >= 300]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lastUpdated) return null;

  const label =
    secondsAgo < 5
      ? "Just now"
      : secondsAgo < 60
        ? `${secondsAgo}s ago`
        : secondsAgo < 3600
          ? `${Math.floor(secondsAgo / 60)}m ago`
          : `${Math.floor(secondsAgo / 3600)}h ago`;
  const isStale = secondsAgo > 120;
  const aria = `Last updated ${label}. Click to refresh.`;
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isFetching}
      aria-label={aria}
      title={aria}
      className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
        isStale
          ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
          : "text-text-muted bg-off-white hover:bg-navy/[0.04]"
      }`}
    >
      <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
      {label}
      {isStale && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
    </button>
  );
}

export const RefreshIndicator = memo(RefreshIndicatorImpl);

type Props = {
  role: string | undefined;
  greeting: string;
  name: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
  isFetching?: boolean;
};

export function PortalHeader({ role, greeting, name, lastUpdated, onRefresh, isFetching }: Props) {
  const handleRefresh = useCallback(() => {
    triggerHaptic("light");
    onRefresh();
  }, [onRefresh]);

  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
          {role === "coach" ? "Coach Portal" : role === "parent" ? "Parent Portal" : "Portal"}
        </p>
        <h1 className="text-navy text-xl lg:text-2xl font-bold font-heading">
          {greeting}, {name}
        </h1>
      </div>
      <RefreshIndicator lastUpdated={lastUpdated} onRefresh={handleRefresh} isFetching={isFetching} />
    </div>
  );
}
