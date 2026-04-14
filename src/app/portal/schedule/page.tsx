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
        <div className="bg-card border border-white/10 rounded-xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-white/20" />
          </div>
          <p className="text-white font-semibold mb-1">No Games Scheduled</p>
          <p className="text-text-secondary text-sm mb-4">Your schedule will appear here once games are set up for your team.</p>
          <a href="/scores" className="text-red text-xs font-semibold hover:text-red-hover transition-colors">
            View Live Scores &rarr;
          </a>
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
                      className="bg-card border border-white/10 rounded-xl px-5 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
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
                          {game.court && <span className="bg-white/5 px-2 py-0.5 rounded">{game.court}</span>}
                        </div>
                      </div>
                      {(game.scheduledTime || game.court) && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                          {game.scheduledTime && (
                            <span>
                              {new Date(game.scheduledTime).toLocaleString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {game.eventName && <span>{game.eventName}</span>}
                        </div>
                      )}
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
