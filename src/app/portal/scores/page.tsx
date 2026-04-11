"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import StandingsTable from "@/components/scores/StandingsTable";

type Game = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  division: string | null;
};

export default function PortalScoresPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scores/live")
      .then((r) => r.json())
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const finalGames = games.filter((g) => g.status === "final");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
          Scores & Standings
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Game results and league standings
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Standings */}
          <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">
                League Standings
              </h2>
            </div>
            <StandingsTable />
          </div>

          {/* Recent results */}
          {finalGames.length > 0 && (
            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-red" />
                <h2 className="text-white font-bold text-sm uppercase tracking-wider">
                  Recent Results
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {finalGames.slice(0, 10).map((game) => {
                  const homeWon = game.homeScore > game.awayScore;
                  return (
                    <div key={game.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className={homeWon ? "text-white font-semibold" : "text-white/60"}>
                          {game.homeTeam}
                        </span>
                        <span className="text-white font-bold tabular-nums">{game.homeScore}</span>
                        <span className="text-white/30">—</span>
                        <span className="text-white font-bold tabular-nums">{game.awayScore}</span>
                        <span className={!homeWon ? "text-white font-semibold" : "text-white/60"}>
                          {game.awayTeam}
                        </span>
                      </div>
                      {game.division && (
                        <span className="text-text-secondary text-xs">{game.division}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
