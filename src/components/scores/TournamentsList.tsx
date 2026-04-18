"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, ChevronRight, Calendar, Users, Radio } from "lucide-react";

type TournamentSummary = {
  id: number;
  name: string;
  startDate: string;
  location: string | null;
  format: string;
  status: string;
  teams: { teamName: string }[];
  bracket: { status: string }[];
};

type Props = {
  selectedEvent: string;
  onSelectEvent: (eventName: string) => void;
};

export default function TournamentsList({ selectedEvent, onSelectEvent }: Props) {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/scores/tournaments", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTournaments)
      .catch((err) => { if (err instanceof DOMException && err.name === "AbortError") return; });
    return () => controller.abort();
  }, []);

  if (tournaments.length === 0) return null;

  return (
    <div className="mb-4">
      <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-red" aria-hidden="true" />
        Active Tournaments
      </h2>

      {/* Tournament filter pills */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={() => onSelectEvent("")}
          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
            selectedEvent === ""
              ? "bg-red text-white"
              : "bg-white/5 text-white/40 hover:text-white"
          }`}
        >
          All Games
        </button>
        {tournaments.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectEvent(t.name)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
              selectedEvent === t.name
                ? "bg-red text-white"
                : "bg-white/5 text-white/40 hover:text-white"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {tournaments.map((t) => {
          const liveCount = t.bracket?.filter((g) => g.status === "live").length || 0;
          return (
            <Link
              key={t.id}
              href={`/tournaments/${t.id}`}
              className="block bg-navy-light/40 border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {t.name}
                    </h3>
                    {liveCount > 0 && (
                      <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        {liveCount} Live
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {new Date(t.startDate + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {t.location && <span>{t.location}</span>}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {t.teams?.length || 0} teams
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
