"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import {
  Trophy,
  Radio,
  Clock,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import TeamLogo from "@/components/ui/TeamLogo";

type QuarterScore = {
  quarter: string | null;
  homeScore: number;
  awayScore: number;
};

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
  scores: QuarterScore[];
};

type Props = {
  eventFilter?: string;
  canEditScores?: boolean;
};

export default function LiveScoreboard({ eventFilter = "", canEditScores = false }: Props) {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [divFilter, setDivFilter] = useState("");
  const [viewMode, setViewMode] = useState<"timeline" | "courts">("timeline");
  const [expandedGame, setExpandedGame] = useState<number | null>(null);
  const [countdownPct, setCountdownPct] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [logos, setLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/teams/logo")
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === "object") setLogos(data); })
      .catch(() => {});
  }, []);

  const fetchScores = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/scores/live");
      if (res.ok) {
        setGames(await res.json());
        setLastUpdated(new Date());
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdownPct(0);
    }
  }, []);

  // Adaptive polling: 15s when live games, 30s otherwise
  const hasLive = games.some((g) => g.status === "live");
  const pollInterval = hasLive ? 15000 : 30000;

  // Visibility-aware polling: pauses when tab hidden, resumes on focus.
  // Adaptive: 15s during live games, 30s otherwise.
  useVisibilityPolling(() => fetchScores(), pollInterval);

  // Countdown progress bar — resets when pollInterval changes
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const tickMs = 100;
    let elapsed = 0;
    countdownRef.current = setInterval(() => {
      elapsed += tickMs;
      setCountdownPct(Math.min((elapsed / pollInterval) * 100, 100));
    }, tickMs);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [pollInterval, games]);

  // Filter by event (tournament) name
  const eventFiltered = eventFilter
    ? games.filter((g) => g.eventName === eventFilter)
    : games;

  // Extract divisions from event-filtered games
  const divisions = useMemo(
    () => [...new Set(eventFiltered.map((g) => g.division).filter(Boolean))] as string[],
    [eventFiltered]
  );

  // Filter by division
  const filtered = divFilter
    ? eventFiltered.filter((g) => g.division === divFilter)
    : eventFiltered;

  const liveGames = filtered.filter((g) => g.status === "live");
  const finalGames = filtered.filter((g) => g.status === "final");
  const scheduledGames = filtered.filter((g) => g.status === "scheduled");

  // Team records computed from all final games (not filtered by division)
  const teamRecords = useMemo(() => {
    const records: Record<string, { w: number; l: number }> = {};
    for (const g of eventFiltered.filter((g) => g.status === "final")) {
      if (!records[g.homeTeam]) records[g.homeTeam] = { w: 0, l: 0 };
      if (!records[g.awayTeam]) records[g.awayTeam] = { w: 0, l: 0 };
      if (g.homeScore > g.awayScore) {
        records[g.homeTeam].w++;
        records[g.awayTeam].l++;
      } else if (g.awayScore > g.homeScore) {
        records[g.awayTeam].w++;
        records[g.homeTeam].l++;
      }
    }
    return records;
  }, [eventFiltered]);

  // Courts for court view
  const courts = useMemo(
    () => [...new Set(filtered.map((g) => g.court).filter(Boolean))] as string[],
    [filtered]
  );

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
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            {hasLive && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-updating every {pollInterval / 1000}s
              </span>
            )}
            {lastUpdated && (
              <span>
                {hasLive ? " · " : ""}Last updated{" "}
                {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-white/5 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("timeline")}
                className={`p-1.5 transition-colors ${viewMode === "timeline" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
                aria-label="Timeline view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("courts")}
                className={`p-1.5 transition-colors ${viewMode === "courts" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
                aria-label="Courts view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => fetchScores(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Countdown bar */}
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500/40 transition-none"
            style={{ width: `${countdownPct}%` }}
          />
        </div>

        {/* Division filter pills */}
        {divisions.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDivFilter("")}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                divFilter === "" ? "bg-red text-white" : "bg-white/5 text-white/40 hover:text-white"
              }`}
            >
              All
            </button>
            {divisions.sort().map((d) => (
              <button
                key={d}
                onClick={() => setDivFilter(d)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                  divFilter === d ? "bg-red text-white" : "bg-white/5 text-white/40 hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Court-by-court view */}
      {viewMode === "courts" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {courts.length === 0 ? (
            <p className="col-span-full text-center text-white/30 text-sm py-8">
              No court assignments found.
            </p>
          ) : (
            courts.sort().map((court) => {
              const courtGame = filtered.find(
                (g) => g.court === court && (g.status === "live" || g.status === "scheduled")
              );
              return (
                <div
                  key={court}
                  className={`border rounded-xl p-4 transition-all ${
                    courtGame?.status === "live"
                      ? "bg-navy-light/60 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                      : "bg-navy-light/40 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin className="w-3 h-3 text-white/40" />
                    <h3 className="text-white font-bold text-xs uppercase tracking-wider">
                      {court}
                    </h3>
                    {courtGame?.status === "live" && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  {courtGame ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-xs font-semibold truncate mr-2">
                          {courtGame.homeTeam}
                        </span>
                        <span className="text-white font-bold text-sm tabular-nums">
                          {courtGame.homeScore}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-xs font-semibold truncate mr-2">
                          {courtGame.awayTeam}
                        </span>
                        <span className="text-white font-bold text-sm tabular-nums">
                          {courtGame.awayScore}
                        </span>
                      </div>
                      {courtGame.division && (
                        <p className="text-white/20 text-[10px] uppercase tracking-wider mt-1">
                          {courtGame.division}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/20 text-xs italic">No active game</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <>
          {/* Timeline view — Live games */}
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
                  <GameCard
                    key={game.id}
                    game={game}
                    teamRecords={teamRecords}
                    expanded={expandedGame === game.id}
                    onToggle={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                    canEdit={canEditScores}
                    onScoreUpdated={() => fetchScores(false)}
                    logos={logos}
                  />
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
                  <GameCard
                    key={game.id}
                    game={game}
                    teamRecords={teamRecords}
                    expanded={expandedGame === game.id}
                    onToggle={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                    canEdit={canEditScores}
                    onScoreUpdated={() => fetchScores(false)}
                    logos={logos}
                  />
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
                  <GameCard
                    key={game.id}
                    game={game}
                    teamRecords={teamRecords}
                    expanded={expandedGame === game.id}
                    onToggle={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                    canEdit={canEditScores}
                    onScoreUpdated={() => fetchScores(false)}
                    logos={logos}
                  />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <p className="text-center text-white/30 text-sm py-12">
              No games match the current filters.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── GameCard ──────────────────────────────────────────────────────────────────

function GameCard({
  game,
  teamRecords,
  expanded,
  onToggle,
  canEdit = false,
  onScoreUpdated,
  logos = {},
}: {
  game: LiveGame;
  teamRecords: Record<string, { w: number; l: number }>;
  expanded: boolean;
  onToggle: () => void;
  canEdit?: boolean;
  onScoreUpdated?: () => void;
  logos?: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [editHome, setEditHome] = useState(game.homeScore);
  const [editAway, setEditAway] = useState(game.awayScore);
  const [editQuarter, setEditQuarter] = useState(game.quarter || "");
  const [editStatus, setEditStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const homeWinning = game.homeScore > game.awayScore;
  const awayWinning = game.awayScore > game.homeScore;
  const homeRec = teamRecords[game.homeTeam];
  const awayRec = teamRecords[game.awayTeam];

  // Quarter scores (exclude "final" entry for the box score rows)
  const quarterScores = (game.scores || []).filter((s) => s.quarter && s.quarter !== "final");

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditHome(game.homeScore);
    setEditAway(game.awayScore);
    setEditQuarter(game.quarter || "");
    setEditStatus("");
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      await fetch("/api/admin/scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          homeScore: editHome,
          awayScore: editAway,
          quarter: editQuarter || undefined,
          status: editStatus || undefined,
        }),
      });
      setEditing(false);
      onScoreUpdated?.();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`bg-navy-light/60 backdrop-blur border rounded-xl transition-all cursor-pointer ${
        isLive
          ? "border-emerald-500/30 shadow-lg shadow-emerald-500/5 border-l-4 border-l-emerald-400"
          : isFinal
          ? "border-white/5 opacity-80 hover:opacity-100"
          : "border-white/10 hover:border-white/20"
      }`}
      onClick={onToggle}
    >
      <div className="p-5">
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
          <div className="flex items-center gap-2">
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
            {canEdit && !editing && (
              <button
                onClick={openEdit}
                className="flex items-center gap-1 text-red/70 hover:text-red px-1.5 py-0.5 rounded transition-colors"
                title="Edit score"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/30" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            )}
          </div>
        </div>

        {/* Scoreboard */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <TeamLogo teamName={game.homeTeam} logoUrl={logos[game.homeTeam]} size={24} />
              <span
                className={`text-sm font-semibold truncate ${
                  isFinal && homeWinning ? "text-white" : "text-white/80"
                }`}
              >
                {game.homeTeam}
              </span>
              {homeRec && (
                <span className="text-white/25 text-[10px] ml-0.5 tabular-nums flex-shrink-0">
                  ({homeRec.w}-{homeRec.l})
                </span>
              )}
            </div>
            <span
              className={`text-2xl font-bold tabular-nums flex-shrink-0 ${
                isLive ? "text-white" : isFinal && homeWinning ? "text-white" : "text-white/60"
              }`}
            >
              {game.homeScore}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <TeamLogo teamName={game.awayTeam} logoUrl={logos[game.awayTeam]} size={24} />
              <span
                className={`text-sm font-semibold truncate ${
                  isFinal && awayWinning ? "text-white" : "text-white/80"
                }`}
              >
                {game.awayTeam}
              </span>
              {awayRec && (
                <span className="text-white/25 text-[10px] ml-0.5 tabular-nums flex-shrink-0">
                  ({awayRec.w}-{awayRec.l})
                </span>
              )}
            </div>
            <span
              className={`text-2xl font-bold tabular-nums flex-shrink-0 ${
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

      {/* Inline admin score editor */}
      {editing && (
        <form
          onSubmit={handleSave}
          onClick={(e) => e.stopPropagation()}
          className="border-t border-red/20 bg-red/5 px-5 py-4 space-y-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <Pencil className="w-3.5 h-3.5 text-red" />
            <span className="text-red text-xs font-bold uppercase tracking-wider">Update Score</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">{game.homeTeam}</label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setEditHome(Math.max(0, editHome - 1))} className="w-8 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors text-sm">-</button>
                <input type="number" min={0} value={editHome} onChange={(e) => setEditHome(Number(e.target.value))} className="flex-1 min-w-0 bg-navy border border-white/10 rounded-lg px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-red tabular-nums" />
                <button type="button" onClick={() => setEditHome(editHome + 1)} className="w-8 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors text-sm">+</button>
              </div>
            </div>
            <div>
              <label className="block text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">{game.awayTeam}</label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setEditAway(Math.max(0, editAway - 1))} className="w-8 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors text-sm">-</button>
                <input type="number" min={0} value={editAway} onChange={(e) => setEditAway(Number(e.target.value))} className="flex-1 min-w-0 bg-navy border border-white/10 rounded-lg px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-red tabular-nums" />
                <button type="button" onClick={() => setEditAway(editAway + 1)} className="w-8 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors text-sm">+</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">Quarter</label>
              <select value={editQuarter} onChange={(e) => setEditQuarter(e.target.value)} className="w-full bg-navy border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-red">
                <option value="">--</option>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
                <option value="OT">OT</option>
              </select>
            </div>
            <div>
              <label className="block text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full bg-navy border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-red">
                <option value="">No change</option>
                <option value="live">Live</option>
                <option value="final">Final</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(false); }} className="flex items-center gap-1 text-white/40 hover:text-white px-3 py-2 rounded-lg text-xs transition-colors">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </form>
      )}

      {/* Expanded details */}
      {expanded && !editing && (
        <div
          className="border-t border-white/10 px-5 py-4 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quarter-by-quarter box score */}
          {quarterScores.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/40 uppercase tracking-wider">
                    <th className="text-left py-1 pr-3 font-semibold">Team</th>
                    {quarterScores.map((s) => (
                      <th key={s.quarter} className="text-center py-1 px-2 font-semibold min-w-[32px]">
                        {s.quarter === "OT" ? "OT" : `Q${s.quarter}`}
                      </th>
                    ))}
                    <th className="text-center py-1 px-2 font-bold">T</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={homeWinning ? "text-white" : "text-white/60"}>
                    <td className="py-1 pr-3 font-semibold truncate max-w-[100px]">{game.homeTeam}</td>
                    {quarterScores.map((s) => (
                      <td key={s.quarter} className="text-center py-1 px-2 tabular-nums">{s.homeScore}</td>
                    ))}
                    <td className="text-center py-1 px-2 font-bold tabular-nums">{game.homeScore}</td>
                  </tr>
                  <tr className={awayWinning ? "text-white" : "text-white/60"}>
                    <td className="py-1 pr-3 font-semibold truncate max-w-[100px]">{game.awayTeam}</td>
                    {quarterScores.map((s) => (
                      <td key={s.quarter} className="text-center py-1 px-2 tabular-nums">{s.awayScore}</td>
                    ))}
                    <td className="text-center py-1 px-2 font-bold tabular-nums">{game.awayScore}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Game meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/40">
            {game.scheduledTime && (
              <span>
                <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
                {new Date(game.scheduledTime).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
            {game.court && (
              <span>
                <MapPin className="w-3 h-3 inline mr-1 -mt-0.5" />
                {game.court}
              </span>
            )}
            {game.eventName && (
              <span>
                <Trophy className="w-3 h-3 inline mr-1 -mt-0.5" />
                {game.eventName}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
