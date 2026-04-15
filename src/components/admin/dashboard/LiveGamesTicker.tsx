"use client";

import { memo } from "react";
import type { AdminLiveGame } from "@/types/admin-dashboard";

// Compact ticker strip showing currently-live games. Isolated so its frequent
// refreshes don't re-render the rest of the dashboard.
function LiveGamesTicker({ games }: { games: AdminLiveGame[] }) {
  const live = games.filter((g) => g.status === "live");
  if (live.length === 0) return null;

  return (
    <div
      className="flex items-center gap-3 overflow-x-auto pb-3 mb-4 -mx-1 px-1"
      role="region"
      aria-label="Live games"
      aria-live="polite"
    >
      <span className="text-[10px] text-red font-bold uppercase tracking-wider flex-shrink-0 flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red" />
        </span>
        Live
      </span>
      {live.map((g) => (
        <div
          key={g.id}
          className="flex-shrink-0 bg-red/5 border border-red/20 rounded-lg px-3 py-1.5 flex items-center gap-2"
        >
          <span className="text-navy text-xs font-bold whitespace-nowrap">
            {g.homeTeam}
          </span>
          <span className="text-red text-sm font-bold tabular-nums">
            {g.homeScore}-{g.awayScore}
          </span>
          <span className="text-navy text-xs font-bold whitespace-nowrap">
            {g.awayTeam}
          </span>
          {g.quarter && (
            <span className="text-text-secondary text-[10px] ml-1">
              {g.quarter}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default memo(LiveGamesTicker);
