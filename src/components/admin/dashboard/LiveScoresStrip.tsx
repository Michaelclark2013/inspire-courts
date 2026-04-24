"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, ArrowUpRight } from "lucide-react";

type LiveGame = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  court: string | null;
  status: "live" | "scheduled" | "final";
  quarter?: number;
};

// Red pulsing "live now" strip for the main admin dashboard. Polls
// /api/scores/live every 15s. Hidden if nothing is live.
export default function LiveScoresStrip() {
  const [games, setGames] = useState<LiveGame[]>([]);

  useEffect(() => {
    let alive = true;
    const fetchLive = () =>
      fetch("/api/scores/live")
        .then((r) => (r.ok ? r.json() : []))
        .then((d: LiveGame[]) => {
          if (alive) setGames(Array.isArray(d) ? d.filter((g) => g.status === "live") : []);
        })
        .catch(() => alive && setGames([]));
    fetchLive();
    const id = setInterval(fetchLive, 15_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (games.length === 0) return null;

  return (
    <section aria-label="Live games" className="mb-6">
      <div className="bg-gradient-to-r from-red/10 via-white to-red/5 border border-red/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-red/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red" />
          </span>
          <Radio className="w-3.5 h-3.5 text-red" aria-hidden="true" />
          <h2 className="text-navy font-bold text-xs uppercase tracking-widest">Live Now · {games.length}</h2>
          <Link href="/admin/scores" className="ml-auto text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1">
            All scores <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 py-3">
          {games.map((g) => (
            <Link
              key={g.id}
              href={`/admin/scores/enter?game=${g.id}`}
              className="flex-shrink-0 bg-white border border-border rounded-xl px-4 py-3 min-w-[200px] hover:border-red/40 hover:shadow-sm transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                {g.court && <span className="text-text-muted font-semibold">{g.court}</span>}
                {g.quarter && <span className="bg-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Q{g.quarter}</span>}
              </div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-navy font-semibold text-sm truncate flex-1">{g.homeTeam}</p>
                <p className="text-navy font-heading font-bold text-lg tabular-nums ml-2">{g.homeScore}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-navy font-semibold text-sm truncate flex-1">{g.awayTeam}</p>
                <p className="text-navy font-heading font-bold text-lg tabular-nums ml-2">{g.awayScore}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
