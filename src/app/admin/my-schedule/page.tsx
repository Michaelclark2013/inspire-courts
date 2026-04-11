"use client";

import { useEffect, useState } from "react";
import { Calendar, Loader2, Radio } from "lucide-react";

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

export default function MySchedulePage() {
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
  const recent = games.filter((g) => g.status === "final").slice(0, 5);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
          My Schedule
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Today&apos;s games and upcoming events
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading schedule...
        </div>
      ) : games.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-xl p-8 text-center">
          <Calendar className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No games on the schedule</p>
          <p className="text-text-secondary text-sm">Games will appear here once they&apos;re created.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {live.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h2 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Live Now</h2>
              </div>
              <div className="space-y-2">
                {live.map((g) => <GameRow key={g.id} game={g} />)}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-2">
                {upcoming.map((g) => <GameRow key={g.id} game={g} />)}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <h2 className="text-white/50 font-bold text-sm uppercase tracking-wider mb-3">Recent</h2>
              <div className="space-y-2">
                {recent.map((g) => <GameRow key={g.id} game={g} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function GameRow({ game }: { game: Game }) {
  return (
    <div className="bg-card border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-sm min-w-0">
        <span className="text-white font-semibold truncate">{game.homeTeam}</span>
        {game.status !== "scheduled" ? (
          <>
            <span className="text-white font-bold tabular-nums">{game.homeScore}</span>
            <span className="text-white/30">—</span>
            <span className="text-white font-bold tabular-nums">{game.awayScore}</span>
          </>
        ) : (
          <span className="text-white/30">vs</span>
        )}
        <span className="text-white font-semibold truncate">{game.awayTeam}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-secondary flex-shrink-0">
        {game.division && <span>{game.division}</span>}
        {game.court && <span>{game.court}</span>}
        <span className={`font-bold uppercase ${game.status === "live" ? "text-emerald-400" : game.status === "final" ? "text-white/40" : "text-white/30"}`}>
          {game.status}
        </span>
      </div>
    </div>
  );
}
