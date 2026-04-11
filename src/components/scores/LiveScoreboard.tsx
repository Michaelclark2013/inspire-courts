"use client";

import { useState, useEffect } from "react";
import { Trophy, Radio, Clock, Calendar } from "lucide-react";
import Link from "next/link";

type LiveGame = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: string | null;
  division: string | null;
  court: string | null;
  eventName: string | null;
  scheduledTime: string | null;
  status: "scheduled" | "live" | "final";
};

export default function LiveScoreboard() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const res = await fetch("/api/scores/live");
        if (res.ok) setGames(await res.json());
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }

    fetchScores();
    // Poll every 30 seconds
    const interval = setInterval(fetchScores, 30000);
    return () => clearInterval(interval);
  }, []);

  const liveGames = games.filter((g) => g.status === "live");
  const finalGames = games.filter((g) => g.status === "final");
  const scheduledGames = games.filter((g) => g.status === "scheduled");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-white/40">
        <div className="w-5 h-5 border-2 border-white/20 border-t-red rounded-full animate-spin mr-3" />
        Loading scores...
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5">
          <Trophy className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-white/60 font-semibold text-sm mb-2">No Games Right Now</h3>
        <p className="text-white/30 text-sm max-w-xs mx-auto mb-6">
          Scores and live updates will appear here on game day. Check back during a tournament!
        </p>
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-red hover:text-red-hover text-sm font-semibold transition-colors"
        >
          <Calendar className="w-4 h-4" />
          View Upcoming Tournaments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Live games */}
      {liveGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">
              Live Now
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {liveGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Scheduled */}
      {scheduledGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-white/40" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">
              Upcoming
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {scheduledGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Final */}
      {finalGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-red" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">
              Final
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {finalGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GameCard({ game }: { game: LiveGame }) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const homeWinning = game.homeScore > game.awayScore;
  const awayWinning = game.awayScore > game.homeScore;

  return (
    <div
      className={`bg-navy-light/60 backdrop-blur border rounded-xl p-5 transition-all ${
        isLive ? "border-emerald-500/30 shadow-lg shadow-emerald-500/5" : "border-white/10"
      }`}
    >
      {/* Meta row */}
      <div className="flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-2 text-white/40">
          {game.division && <span>{game.division}</span>}
          {game.court && (
            <>
              <span className="text-white/20">&bull;</span>
              <span>{game.court}</span>
            </>
          )}
        </div>
        <span
          className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isLive
              ? "bg-emerald-500/20 text-emerald-400"
              : isFinal
              ? "bg-white/10 text-white/50"
              : "bg-white/5 text-white/30"
          }`}
        >
          {isLive && game.quarter ? `Q${game.quarter}` : game.status}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-semibold ${
              isFinal && homeWinning ? "text-white" : "text-white/80"
            }`}
          >
            {game.homeTeam}
          </span>
          <span
            className={`text-2xl font-bold tabular-nums ${
              isLive ? "text-white" : isFinal && homeWinning ? "text-white" : "text-white/60"
            }`}
          >
            {game.homeScore}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-semibold ${
              isFinal && awayWinning ? "text-white" : "text-white/80"
            }`}
          >
            {game.awayTeam}
          </span>
          <span
            className={`text-2xl font-bold tabular-nums ${
              isLive ? "text-white" : isFinal && awayWinning ? "text-white" : "text-white/60"
            }`}
          >
            {game.awayScore}
          </span>
        </div>
      </div>

      {/* Event name */}
      {game.eventName && (
        <p className="text-white/30 text-xs mt-3 truncate">{game.eventName}</p>
      )}
    </div>
  );
}
