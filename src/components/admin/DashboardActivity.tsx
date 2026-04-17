"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, Radio, Clock } from "lucide-react";

type Game = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  division: string | null;
  court: string | null;
  status: "scheduled" | "live" | "final";
  scheduledTime: string | null;
};

export default function DashboardActivity() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/scores/live", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGames(Array.isArray(data) ? data : []))
      .catch((err) => { if (err instanceof DOMException && err.name === "AbortError") return; })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const live = games.filter((g) => g.status === "live");
  const recent = games.filter((g) => g.status === "final").slice(0, 6);
  const items = [...live, ...recent].slice(0, 8);

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Activity className="w-4 h-4 text-accent" aria-hidden="true" />
        <h3 className="text-navy font-bold text-xs uppercase tracking-wider">
          Recent Activity
        </h3>
        {live.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider ml-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            {live.length} live
          </span>
        )}
        <Link
          href="/admin/scores"
          className="text-accent text-xs hover:underline ml-auto"
        >
          View all →
        </Link>
      </div>
      <div className="divide-y divide-border">
        {items.map((g) => (
          <div key={g.id} className="px-5 py-2.5 flex items-center gap-3">
            {g.status === "live" ? (
              <Radio className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-label="Live" />
            ) : g.status === "final" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-navy/40 flex-shrink-0" aria-label="Final" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-navy/40 flex-shrink-0" aria-label="Scheduled" />
            )}
            <span className="text-navy text-xs font-medium flex-1 truncate">
              {g.homeTeam} <span className="text-navy/30">vs</span> {g.awayTeam}
            </span>
            {g.division && (
              <span className="text-[10px] text-text-secondary hidden sm:block">{g.division}</span>
            )}
            {g.status !== "scheduled" && (
              <span className="text-navy font-mono font-bold text-xs tabular-nums">
                {g.homeScore}–{g.awayScore}
              </span>
            )}
            <span
              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                g.status === "live"
                  ? "bg-emerald-50 text-emerald-600"
                  : g.status === "final"
                  ? "bg-off-white text-navy/40"
                  : "bg-off-white text-navy/40"
              }`}
            >
              {g.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
