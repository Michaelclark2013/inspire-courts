"use client";

import { RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  refreshing: boolean;
  progress: number;
}

/**
 * Visual pull-to-refresh spinner that appears at the top of the page.
 */
export function PullToRefreshIndicator({
  pullDistance,
  refreshing,
  progress,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !refreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
      style={{ height: refreshing ? 48 : pullDistance }}
    >
      <div
        className={`flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-md border border-light-gray transition-transform duration-200 ${
          refreshing ? "animate-spin" : ""
        }`}
        style={{
          transform: refreshing
            ? undefined
            : `rotate(${progress * 360}deg) scale(${0.5 + progress * 0.5})`,
          opacity: Math.min(progress * 1.5, 1),
        }}
      >
        <RefreshCw className="w-4 h-4 text-red" />
      </div>
    </div>
  );
}
