"use client";

import { useState, useCallback } from "react";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { Trophy, Loader2, AlertTriangle, RefreshCw, Radio } from "lucide-react";
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
  const [error, setError] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>("all");

  const fetchGames = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/scores/live");
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Visibility-aware polling: pauses when tab hidden, resumes on focus
  useVisibilityPolling(fetchGames, 30_000);

  const hasLive = games.some((g) => g.status === "live");
  const divisions = Array.from(new Set(games.map((g) => g.division).filter(Boolean))) as string[];
  const filteredGames = selectedDivision === "all"
    ? games
    : games.filter((g) => g.division === selectedDivision);
  const finalGames = filteredGames.filter((g) => g.status === "final");

  // Error state
  if (error && !loading && games.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">Scores & Standings</h1>
        </div>
        <div className="bg-red/10 border border-red/20 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-1">Failed to Load Scores</h3>
          <p className="text-text-secondary text-sm mb-4">Could not load scores. Check your connection and try again.</p>
          <button
            onClick={() => { setLoading(true); fetchGames(); }}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
              Scores & Standings
            </h1>
            {hasLive && (
              <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                <Radio className="w-3 h-3 animate-pulse" /> Live
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Game results and league standings
          </p>
        </div>
        <button
          onClick={fetchGames}
          className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1.5 rounded-lg transition-colors"
          title="Click to refresh"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Division filter pills */}
      {divisions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedDivision("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
              selectedDivision === "all"
                ? "bg-red text-white"
                : "bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            All
          </button>
          {divisions.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDivision(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedDivision === d
                  ? "bg-red text-white"
                  : "bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading scores...
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
          {finalGames.length > 0 ? (
            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-red" />
                <h2 className="text-white font-bold text-sm uppercase tracking-wider">
                  Recent Results
                </h2>
                <span className="text-text-secondary text-xs ml-auto">{finalGames.length} game{finalGames.length !== 1 ? "s" : ""}</span>
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
          ) : (
            <div className="bg-card border border-white/10 rounded-xl p-8 text-center">
              <Trophy className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">No Results Yet</p>
              <p className="text-text-secondary text-sm">
                {selectedDivision !== "all"
                  ? `No completed games in ${selectedDivision}. Try a different division.`
                  : "Completed game results will appear here."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
