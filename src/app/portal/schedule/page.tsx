"use client";

import { useEffect, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";

type Game = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  division: string | null;
  court: string | null;
  eventName: string | null;
  scheduledTime: string | null;
  status: "scheduled" | "live" | "final";
};

export default function SchedulePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scores/live")
      .then((r) => r.json())
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcoming = games.filter((g) => g.status === "scheduled");
  const live = games.filter((g) => g.status === "live");
  const completed = games.filter((g) => g.status === "final");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
          Schedule
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Upcoming games and results
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading schedule...
        </div>
      ) : games.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-xl p-8 text-center">
          <Calendar className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No games scheduled</p>
          <p className="text-text-secondary text-sm">Check back when the next event is set up.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { label: "Live", items: live, color: "text-emerald-400" },
            { label: "Upcoming", items: upcoming, color: "text-white/60" },
            { label: "Completed", items: completed, color: "text-white/40" },
          ]
            .filter((s) => s.items.length > 0)
            .map((section) => (
              <div key={section.label}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${section.color}`}>
                  {section.label}
                </h2>
                <div className="space-y-2">
                  {section.items.map((game) => (
                    <div
                      key={game.id}
                      className="bg-card border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 text-sm min-w-0">
                        <span className="text-white font-semibold truncate">{game.homeTeam}</span>
                        {game.status !== "scheduled" && (
                          <>
                            <span className="text-white font-bold tabular-nums">{game.homeScore}</span>
                            <span className="text-white/30">—</span>
                            <span className="text-white font-bold tabular-nums">{game.awayScore}</span>
                          </>
                        )}
                        {game.status === "scheduled" && <span className="text-white/30">vs</span>}
                        <span className="text-white font-semibold truncate">{game.awayTeam}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary flex-shrink-0">
                        {game.division && <span>{game.division}</span>}
                        {game.court && <span>{game.court}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
