"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Live = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  court: string | null;
  division: string | null;
  eventName: string | null;
  scheduledTime: string | null;
  status: "scheduled" | "live" | "final";
  homeScore: number;
  awayScore: number;
  quarter: string | null;
  updatedAt: string | null;
};

// Public big-number spectator scoreboard. No auth, no chrome — open
// it full screen on a tablet at the gate, or parents scan a QR code
// to watch from a courtside bench. Polls every 3 seconds. Kept dead
// simple: two names, two numbers, status pill, quarter.
export default function LiveScorePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params?.gameId ? Number(params.gameId) : 0;
  const [data, setData] = useState<Live | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`/api/scores/live/${gameId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("not_found");
      const body = await res.json();
      setData(body);
      setError(null);
    } catch { setError("Game not found"); }
  }, [gameId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  if (error) {
    return (
      <main className="min-h-screen bg-navy text-white flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-4xl font-heading font-bold">Game not found</p>
          <p className="text-white/60 mt-2">Double-check the link or QR code.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-navy text-white flex items-center justify-center">
        <p className="text-white/50 text-sm uppercase tracking-[0.3em]">Loading…</p>
      </main>
    );
  }

  const isLive = data.status === "live";
  const isFinal = data.status === "final";
  const winner =
    isFinal && data.homeScore !== data.awayScore
      ? data.homeScore > data.awayScore ? "home" : "away"
      : null;

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-navy via-navy to-navy/90 text-white flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Top strip */}
      <header className="px-6 py-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60 border-b border-white/10">
        <div>
          {data.eventName || "Inspire Courts"}
          {data.division && <span className="ml-2">· {data.division}</span>}
        </div>
        <div className="flex items-center gap-2">
          {data.court && <span>{data.court}</span>}
          {isLive && (
            <span className="flex items-center gap-1.5 bg-red text-white px-2.5 py-1 rounded-full font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              LIVE {data.quarter ? `· Q${data.quarter}` : ""}
            </span>
          )}
          {isFinal && (
            <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-full font-bold">FINAL</span>
          )}
          {data.status === "scheduled" && (
            <span className="bg-white/10 text-white px-2.5 py-1 rounded-full">SCHEDULED</span>
          )}
        </div>
      </header>

      {/* Main scoreboard */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-5xl grid grid-cols-2 gap-4 sm:gap-8 items-center">
          <TeamPanel
            name={data.homeTeam}
            score={data.homeScore}
            dim={isFinal && winner === "away"}
            accent={winner === "home"}
          />
          <TeamPanel
            name={data.awayTeam}
            score={data.awayScore}
            dim={isFinal && winner === "home"}
            accent={winner === "away"}
          />
        </div>
      </div>

      <footer className="px-6 py-3 text-center text-white/40 text-[10px] uppercase tracking-[0.3em]">
        Inspire Courts AZ · updates every 3 seconds
      </footer>
    </main>
  );
}

function TeamPanel({ name, score, dim, accent }: { name: string; score: number; dim: boolean; accent: boolean }) {
  return (
    <div
      className={`text-center transition-opacity ${dim ? "opacity-40" : "opacity-100"}`}
    >
      <p className={`uppercase tracking-wider font-bold mb-2 text-sm sm:text-xl truncate ${accent ? "text-red" : "text-white/80"}`}>
        {name}
      </p>
      <p
        className={`font-heading font-bold tabular-nums leading-none ${accent ? "text-red" : "text-white"}`}
        style={{ fontSize: "clamp(5rem, 22vw, 14rem)" }}
      >
        {score}
      </p>
    </div>
  );
}
