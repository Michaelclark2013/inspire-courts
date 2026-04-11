"use client";

import { Calendar, MapPin } from "lucide-react";

type BracketGame = {
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  court: string | null;
  scheduledTime: string | null;
  round: string | null;
};

interface Props {
  bracket: BracketGame[];
  courts: string[];
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "border-white/10",
  live: "border-emerald-500/40 bg-emerald-500/[0.04]",
  final: "border-white/5 opacity-70",
};

export default function ScheduleGrid({ bracket, courts }: Props) {
  // Group games by court
  const gamesByCourt = new Map<string, typeof bracket>();
  for (const game of bracket) {
    const court = game.court || "Unassigned";
    if (!gamesByCourt.has(court)) gamesByCourt.set(court, []);
    gamesByCourt.get(court)!.push(game);
  }

  // Sort games within each court by scheduled time
  for (const [, games] of gamesByCourt) {
    games.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
  }

  // Use provided courts list, add any extras
  const allCourts = [...courts];
  for (const court of gamesByCourt.keys()) {
    if (!allCourts.includes(court)) allCourts.push(court);
  }

  if (bracket.length === 0) {
    return (
      <div className="text-center py-16 text-white/40">
        <Calendar className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No games scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allCourts.map((court) => {
        const courtGames = gamesByCourt.get(court) || [];
        return (
          <div
            key={court}
            className="bg-card border border-white/10 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                {court}
              </h3>
              <span className="text-text-secondary text-xs">
                {courtGames.length} games
              </span>
            </div>
            {courtGames.length === 0 ? (
              <div className="px-5 py-4 text-white/20 text-xs">
                No games on this court
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {courtGames.map((game) => (
                  <div
                    key={game.gameId}
                    className={`px-5 py-3 flex items-center gap-4 border-l-2 ${STATUS_STYLES[game.status] || STATUS_STYLES.scheduled}`}
                  >
                    {/* Time */}
                    <div className="w-16 flex-shrink-0 text-center">
                      {game.scheduledTime ? (
                        <span className="text-white/40 text-xs font-mono tabular-nums">
                          {new Date(game.scheduledTime).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </span>
                      ) : (
                        <span className="text-white/20 text-xs">TBD</span>
                      )}
                    </div>

                    {/* Matchup */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold truncate ${
                          game.status === "final" &&
                          game.homeScore > game.awayScore
                            ? "text-white"
                            : game.homeTeam === "TBD"
                              ? "text-white/20"
                              : "text-white/70"
                        }`}
                      >
                        {game.homeTeam}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0 tabular-nums text-sm">
                        <span className="text-white font-bold">
                          {game.homeScore}
                        </span>
                        <span className="text-white/15">-</span>
                        <span className="text-white font-bold">
                          {game.awayScore}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-semibold truncate ${
                          game.status === "final" &&
                          game.awayScore > game.homeScore
                            ? "text-white"
                            : game.awayTeam === "TBD"
                              ? "text-white/20"
                              : "text-white/70"
                        }`}
                      >
                        {game.awayTeam}
                      </span>
                    </div>

                    {/* Status + Round */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {game.round && (
                        <span className="text-[10px] text-white/30 font-semibold uppercase">
                          {game.round}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          game.status === "live"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : game.status === "final"
                              ? "bg-white/10 text-white/40"
                              : "bg-white/5 text-white/20"
                        }`}
                      >
                        {game.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
