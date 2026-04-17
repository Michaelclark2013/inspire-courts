"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Calendar, Loader2, AlertTriangle, RefreshCw, Radio } from "lucide-react";
import ExportBar from "@/components/ui/ExportBar";
import { exportCSV } from "@/lib/export";

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

function getRelativeTime(scheduledTime: string): { label: string; isSoon: boolean } | null {
  const diff = new Date(scheduledTime).getTime() - Date.now();
  if (diff < 0 || diff > 60 * 60 * 1000) return null; // past or > 60 min
  const mins = Math.round(diff / 60_000);
  return { label: `In ${mins} min`, isSoon: mins <= 15 };
}

export default function SchedulePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/scores/live");
      if (res.ok) {
        const data = await res.json();
        setGames(data);
        setLastUpdated(new Date());
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    // 60s polling
    intervalRef.current = setInterval(fetchGames, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchGames]);

  // Division filter
  const divisions = Array.from(new Set(games.map((g) => g.division).filter(Boolean))) as string[];
  const filtered = selectedDivision === "all"
    ? games
    : games.filter((g) => g.division === selectedDivision);

  const upcoming = filtered.filter((g) => g.status === "scheduled");
  const live = filtered.filter((g) => g.status === "live");
  const completed = filtered.filter((g) => g.status === "final");

  // Error state
  if (error && !loading && games.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">Schedule</h1>
        </div>
        <div className="bg-red/10 border border-red/20 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red mx-auto mb-3" />
          <h3 className="text-navy font-semibold mb-1">Failed to Load Schedule</h3>
          <p className="text-text-muted text-sm mb-4">Could not load the schedule. Check your connection and try again.</p>
          <button
            onClick={() => { setLoading(true); fetchGames(); }}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4 transition-colors">
        <span aria-hidden="true">&larr;</span> Back to Dashboard
      </Link>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">
              Schedule
            </h1>
            <ExportBar onExportCSV={() => exportCSV("schedule", ["Date/Time", "Home Team", "Away Team", "Division", "Court", "Status", "Score"], games.map(g => [g.scheduledTime || "", g.homeTeam, g.awayTeam, g.division || "", g.court || "", g.status, `${g.homeScore}-${g.awayScore}`]))} />
            {live.length > 0 && (
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                <Radio className="w-3 h-3 animate-pulse" /> Live
              </span>
            )}
          </div>
          <p className="text-text-muted text-sm mt-1">
            Upcoming games and results
          </p>
        </div>
        {lastUpdated && (
          <button
            onClick={fetchGames}
            className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted bg-off-white hover:bg-navy/[0.04] px-2.5 py-1.5 rounded-lg transition-colors"
            title="Click to refresh"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        )}
      </div>

      {/* Division filter pills */}
      {divisions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedDivision("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
              selectedDivision === "all"
                ? "bg-red text-white"
                : "bg-off-white text-text-muted hover:text-navy hover:bg-off-white"
            }`}
          >
            All
          </button>
          {divisions.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDivision(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedDivision === d
                  ? "bg-red text-white"
                  : "bg-off-white text-text-muted hover:text-navy hover:bg-off-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading schedule...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-light-gray rounded-xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-off-white flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-light-gray" />
          </div>
          <p className="text-navy font-semibold mb-1">
            {selectedDivision !== "all" ? `No Games in ${selectedDivision}` : "No Games Scheduled"}
          </p>
          <p className="text-text-muted text-sm mb-4">
            {selectedDivision !== "all"
              ? "Try selecting a different division or check back later."
              : "Your schedule will appear here once games are set up for your team."}
          </p>
          <a href="/scores" className="text-red text-xs font-semibold hover:text-red-hover transition-colors">
            View Live Scores &rarr;
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { label: "Live", items: live, color: "text-emerald-600" },
            { label: "Upcoming", items: upcoming, color: "text-text-muted" },
            { label: "Completed", items: completed, color: "text-text-muted" },
          ]
            .filter((s) => s.items.length > 0)
            .map((section) => (
              <div key={section.label}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${section.color}`}>
                  {section.label}
                  {section.label === "Live" && (
                    <Radio className="w-3.5 h-3.5 inline ml-1.5 animate-pulse" />
                  )}
                </h2>
                <div className="space-y-2">
                  {section.items.map((game) => {
                    const relTime = game.scheduledTime ? getRelativeTime(game.scheduledTime) : null;
                    return (
                      <div
                        key={game.id}
                        className={`bg-white border rounded-xl px-5 py-4 ${
                          relTime?.isSoon
                            ? "border-amber-500/30 bg-amber-50"
                            : "border-light-gray"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 text-sm min-w-0">
                            <span className="text-navy font-semibold truncate">{game.homeTeam}</span>
                            {game.status !== "scheduled" && (
                              <>
                                <span className="text-navy font-bold tabular-nums">{game.homeScore}</span>
                                <span className="text-light-gray">—</span>
                                <span className="text-navy font-bold tabular-nums">{game.awayScore}</span>
                              </>
                            )}
                            {game.status === "scheduled" && <span className="text-light-gray">vs</span>}
                            <span className="text-navy font-semibold truncate">{game.awayTeam}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-text-muted flex-shrink-0">
                            {game.status === "final" && (
                              <span className="bg-navy/5 text-navy/60 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Final</span>
                            )}
                            {game.status === "live" && (
                              <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
                              </span>
                            )}
                            {relTime && (
                              <span className={`font-semibold ${relTime.isSoon ? "text-amber-600" : "text-text-muted"}`}>
                                {relTime.label}
                              </span>
                            )}
                            {game.division && <span>{game.division}</span>}
                            {game.court && <span className="bg-off-white px-2 py-0.5 rounded">{game.court}</span>}
                          </div>
                        </div>
                        {(game.scheduledTime || game.court) && !relTime && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
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
                        {relTime && game.scheduledTime && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                            <span>
                              {new Date(game.scheduledTime).toLocaleString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            {game.eventName && <span>{game.eventName}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
