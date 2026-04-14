"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Calendar, Loader2, Radio, RefreshCw, PenLine } from "lucide-react";

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
  const [refreshing, setRefreshing] = useState(false);

  const loadGames = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await fetch("/api/scores/live");
      const data = await r.json();
      setGames(data);
    } catch {}
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => { loadGames(); }, [loadGames]);

  const upcoming = games.filter((g) => g.status === "scheduled");
  const live = games.filter((g) => g.status === "live");
  const recent = games.filter((g) => g.status === "final").slice(0, 5);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-heading">
            My Schedule
          </h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">
            Today&apos;s games and upcoming events
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/admin/scores/enter"
            className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <PenLine className="w-3.5 h-3.5" /> Enter Scores
          </Link>
          <button
            onClick={() => loadGames(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 border border-white/10 hover:border-white/20 text-text-secondary hover:text-white px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading schedule...
        </div>
      ) : games.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-xl p-8 text-center">
          <Calendar className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No games on the schedule</p>
          <p className="text-text-secondary text-sm mb-4">Games will appear here once they&apos;re created.</p>
          <Link
            href="/admin/scores/enter"
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <PenLine className="w-4 h-4" /> Create First Game
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {live.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h2 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Live Now</h2>
                <span className="text-emerald-400/60 text-xs">{live.length}</span>
              </div>
              <div className="space-y-2">
                {live.map((g) => <GameRow key={g.id} game={g} />)}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
                Upcoming <span className="text-text-secondary font-normal">({upcoming.length})</span>
              </h2>
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
  const timeLabel = (() => {
    if (!game.scheduledTime) return null;
    try {
      const d = new Date(game.scheduledTime);
      const minutesUntil = Math.round((d.getTime() - Date.now()) / 60000);
      if (game.status === "scheduled" && minutesUntil > 0 && minutesUntil <= 60) {
        return <span className="text-amber-400 font-bold">in {minutesUntil}m</span>;
      }
      return (
        <span>
          {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
      );
    } catch {
      return null;
    }
  })();

  return (
    <div className="bg-card border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
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
        {(game.eventName || game.division) && (
          <p className="text-text-secondary text-xs mt-0.5 truncate">
            {[game.eventName, game.division].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-text-secondary flex-shrink-0">
        {timeLabel && <span className="text-xs text-text-secondary">{timeLabel}</span>}
        {game.court && <span>{game.court}</span>}
        <span className={`font-bold uppercase ${game.status === "live" ? "text-emerald-400" : game.status === "final" ? "text-white/40" : "text-white/30"}`}>
          {game.status}
        </span>
      </div>
    </div>
  );
}
