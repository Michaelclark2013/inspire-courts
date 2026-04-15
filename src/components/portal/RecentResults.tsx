"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LiveGame } from "@/types/portal";

export function RecentResults({ games }: { games: LiveGame[] }) {
  const finals = games.filter((g) => g.status === "final").slice(0, 5);
  if (finals.length === 0) return null;
  return (
    <div className="bg-white shadow-sm border border-light-gray rounded-2xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <h2 className="text-navy font-bold text-sm">Recent Results</h2>
        <Link
          href="/portal/scores"
          className="text-red text-xs font-semibold hover:text-red-hover transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-light-gray">
        {finals.map((game) => (
          <div key={game.id} className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 text-sm">
              <span className={`font-semibold truncate ${game.homeScore > game.awayScore ? "text-navy" : "text-text-muted"}`}>
                {game.homeTeam}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0 tabular-nums">
                <span className={`font-bold ${game.homeScore > game.awayScore ? "text-navy" : "text-text-muted"}`}>
                  {game.homeScore}
                </span>
                <span className="text-light-gray">-</span>
                <span className={`font-bold ${game.awayScore > game.homeScore ? "text-navy" : "text-text-muted"}`}>
                  {game.awayScore}
                </span>
              </div>
              <span className={`font-semibold truncate ${game.awayScore > game.homeScore ? "text-navy" : "text-text-muted"}`}>
                {game.awayTeam}
              </span>
            </div>
            {game.division && (
              <span className="text-text-muted text-[10px] font-semibold uppercase">{game.division}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
