"use client";

import { Radio } from "lucide-react";
import type { LiveGame } from "@/types/portal";

export function LiveGamesBanner({ games }: { games: LiveGame[] }) {
  if (games.length === 0) return null;
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Live games"
      className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 lg:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-emerald-600 animate-pulse" aria-hidden="true" />
        <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">
          Live Now
        </span>
      </div>
      <div className="space-y-2">
        {games.map((game) => (
          <div
            key={game.id}
            className="flex items-center justify-between bg-white border border-light-gray rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3 text-sm min-w-0">
              <span className="text-navy font-semibold truncate">{game.homeTeam}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-navy font-bold text-lg tabular-nums">{game.homeScore}</span>
                <span className="text-light-gray text-xs">vs</span>
                <span className="text-navy font-bold text-lg tabular-nums">{game.awayScore}</span>
              </div>
              <span className="text-navy font-semibold truncate">{game.awayTeam}</span>
            </div>
            {game.quarter && (
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase border border-emerald-200">
                Q{game.quarter}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
