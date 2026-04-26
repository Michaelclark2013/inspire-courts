"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Zap,
  RefreshCw,
} from "lucide-react";

type Team = {
  id: number;
  teamId: number | null;
  tournamentId: number | null;
  teamName: string;
  division: string | null;
  coachName: string;
  coachEmail: string;
  coachPhone: string | null;
  playerCount: number;
  checkedIn: number;
  percent: number;
  rosterSubmitted: boolean;
  waiversSigned: boolean;
  paymentStatus: string;
  registrationStatus: string;
  latestCheckinAt: string | null;
  complete: boolean;
};

type ProgressPayload = {
  tournament: { id: number; name: string; status: string; startDate: string } | null;
  teams: Team[];
  totals: {
    teams: number;
    complete: number;
    partial: number;
    none: number;
    rosterSubmitted: number;
    waiversSigned: number;
    paymentsPending: number;
  } | null;
};

type RecentCheckin = {
  id: number;
  playerName: string;
  teamName: string;
  division: string | null;
  source: string | null;
  isLate: boolean;
  timestamp: string;
  type: string;
  tournamentName: string | null;
};

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      timeZone: "America/Phoenix",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const REFRESH_MS = 5_000;

export default function WarRoomPage() {
  const [progress, setProgress] = useState<ProgressPayload | null>(null);
  const [recent, setRecent] = useState<RecentCheckin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        fetch("/api/admin/checkin-progress", { cache: "no-store" }),
        fetch("/api/admin/checkin/recent?limit=25", { cache: "no-store" }),
      ]);
      if (!pRes.ok) {
        const d = await pRes.json().catch(() => ({}));
        setError(d.error || `Failed (${pRes.status})`);
        return;
      }
      const pData: ProgressPayload = await pRes.json();
      setProgress(pData);
      if (rRes.ok) {
        const rData = await rRes.json();
        setRecent(rData.checkins || []);
      }
      setError(null);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [load, paused]);

  // Sort: incomplete (red+amber) first, then complete. Inside each
  // bucket sort by % asc — most behind on top so staff see what
  // needs attention.
  const sortedTeams = useMemo(() => {
    if (!progress?.teams) return [];
    return [...progress.teams].sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? 1 : -1;
      return a.percent - b.percent;
    });
  }, [progress?.teams]);

  const totals = progress?.totals;
  const complete = totals?.complete ?? 0;
  const teamsCount = totals?.teams ?? 0;
  const headerPct = teamsCount > 0 ? Math.round((complete / teamsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-navy text-white">
      {/* Top bar */}
      <header className="bg-navy/90 backdrop-blur border-b border-white/10 sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/admin/checkin"
            className="text-white/60 hover:text-white text-xs uppercase tracking-wider inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Check-In
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className={
                "text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border " +
                (paused ? "bg-amber-500 border-amber-500 text-navy" : "bg-emerald-500/20 border-emerald-500/50 text-emerald-300")
              }
            >
              {paused ? "Paused" : "Live"}
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="text-white/60 hover:text-white"
              title="Refresh now"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-[1800px] mx-auto">
        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/50 text-[11px] uppercase tracking-[0.3em]">War Room</p>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading mt-1">
              {progress?.tournament?.name || "No active tournament"}
            </h1>
            {progress?.tournament && (
              <p className="text-white/60 text-sm mt-1">
                {new Date(progress.tournament.startDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · {progress.tournament.status}
              </p>
            )}
            <div className="grid grid-cols-4 gap-3 mt-5">
              <Stat label="Complete" value={complete} accent="emerald" />
              <Stat label="In progress" value={totals?.partial ?? 0} accent="amber" />
              <Stat label="Not started" value={totals?.none ?? 0} accent="red" />
              <Stat label="Total" value={teamsCount} />
            </div>
            {/* Progress bar */}
            <div className="mt-5">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-700"
                  style={{ width: `${headerPct}%` }}
                />
              </div>
              <p className="text-right text-white/50 text-xs mt-1">{headerPct}%</p>
            </div>
          </div>

          {/* Live feed */}
          <aside className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[280px] overflow-hidden flex flex-col">
            <p className="text-white/50 text-[11px] uppercase tracking-[0.3em] mb-2 flex items-center gap-1.5 flex-shrink-0">
              <Zap className="w-3 h-3" /> Live feed
            </p>
            {recent.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-6">No check-ins yet today.</p>
            ) : (
              <ul className="space-y-1.5 overflow-y-auto pr-1 -mr-1">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{r.playerName}</p>
                      <p className="text-white/50 truncate">
                        {r.teamName}
                        {r.division ? ` · ${r.division}` : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white/70 tabular-nums">{fmtTime(r.timestamp)}</p>
                      {r.isLate && (
                        <p className="text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                          Late
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        {error && (
          <div className="mb-4 bg-red/15 border border-red/30 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 inline mr-2" /> {error}
          </div>
        )}

        {loading && !progress ? (
          <div className="text-white/50 text-center py-20">Loading…</div>
        ) : sortedTeams.length === 0 ? (
          <div className="text-white/50 text-center py-20">No teams registered yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortedTeams.map((t) => (
              <TeamCard key={t.id} t={t} />
            ))}
          </div>
        )}

        <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] text-center mt-8">
          Refreshes every {REFRESH_MS / 1000}s · {paused ? "paused" : "live"}
        </p>
      </div>
    </div>
  );
}

function TeamCard({ t }: { t: Team }) {
  const tone = t.complete
    ? "bg-emerald-500/15 border-emerald-400 text-white"
    : t.checkedIn === 0
    ? "bg-red/15 border-red/40 text-white"
    : "bg-amber-500/10 border-amber-400/40 text-white";

  const issues: string[] = [];
  if (t.paymentStatus === "pending") issues.push("Unpaid");
  if (!t.waiversSigned) issues.push("Waivers");
  if (!t.rosterSubmitted && t.checkedIn === 0) issues.push("Roster");

  const checkinHref = t.tournamentId && t.teamId
    ? `/checkin?t=${t.tournamentId}&team=${t.teamId}`
    : `/admin/checkin?team=${encodeURIComponent(t.teamName)}`;

  return (
    <Link
      href={checkinHref}
      className={`block rounded-xl px-4 py-3 border-2 transition-colors hover:bg-white/5 ${tone}`}
    >
      <div className="flex items-center gap-2">
        {t.complete ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        ) : (
          <Users className="w-5 h-5 text-white/60 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">{t.teamName}</p>
          <p className="text-[11px] text-white/60 truncate">
            {t.division || "—"} · {t.coachName}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums">
          {t.checkedIn}
          <span className="text-white/40 text-sm">/{t.playerCount || "?"}</span>
        </p>
        <p className="text-[11px] text-white/50 tabular-nums">{t.percent}%</p>
      </div>
      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={"h-full transition-all duration-500 " + (t.complete ? "bg-emerald-400" : "bg-amber-300")}
          style={{ width: `${t.percent}%` }}
        />
      </div>
      {(issues.length > 0 || t.latestCheckinAt) && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
          <div className="flex gap-1 flex-wrap">
            {issues.map((i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold uppercase tracking-wider">
                {i}
              </span>
            ))}
          </div>
          {t.latestCheckinAt && (
            <span className="text-white/50 inline-flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> {fmtTime(t.latestCheckinAt)}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "emerald" | "amber" | "red" }) {
  const color =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "amber"
      ? "text-amber-300"
      : accent === "red"
      ? "text-red"
      : "text-white";
  return (
    <div className="bg-white/5 rounded-xl px-3 py-2.5">
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-white/60 text-[10px] uppercase tracking-wider font-bold">{label}</p>
    </div>
  );
}
