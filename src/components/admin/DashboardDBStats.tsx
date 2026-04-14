"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  AlertTriangle,
  DollarSign,
  Radio,
  Trophy,
  ArrowRight,
  Clock,
  Megaphone,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";

type DashboardData = {
  registrations: {
    total: number;
    pendingPayments: number;
    paidRevenueCents: number;
    approvalRate: number;
  };
  upcomingGames: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    court: string | null;
    scheduledTime: string | null;
    division: string | null;
    status: string;
  }[];
  tournamentStatus: {
    id: number;
    name: string;
    status: string;
    registeredCount: number;
    maxCapacity: number | null;
    registrationOpen: boolean;
    entryFee: number | null;
    startDate: string;
    divisions: string[];
  }[];
  activeAnnouncements: number;
  liveGames: number;
};

export default function DashboardDBStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [liveGamesDetail, setLiveGamesDetail] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(false);
        setLastFetched(new Date());
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const refreshInterval = setInterval(() => fetchData(), 30000);
    const tickInterval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
  }, [fetchData]);

  // Reset secondsAgo when lastFetched changes
  useEffect(() => {
    if (lastFetched) setSecondsAgo(0);
  }, [lastFetched]);

  // Poll live games detail
  useEffect(() => {
    if (!data || data.liveGames === 0) {
      setLiveGamesDetail([]);
      return;
    }
    async function fetchLive() {
      try {
        const res = await fetch("/api/scores/live");
        if (res.ok) {
          const games = await res.json();
          setLiveGamesDetail(Array.isArray(games) ? games.filter((g: any) => g.status === "live") : []);
        }
      } catch {}
    }
    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => clearInterval(interval);
  }, [data?.liveGames]);

  if (error && !data) {
    return (
      <div className="bg-red/5 border border-red/20 rounded-sm p-6 mb-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red/60 mx-auto mb-2" />
        <p className="text-white font-semibold text-sm mb-1">Failed to load dashboard data</p>
        <p className="text-text-secondary text-xs mb-4">Check your connection and try again</p>
        <button onClick={() => { setError(false); fetchData(); }} className="bg-red hover:bg-red-hover text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 mb-8 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bg-secondary border border-border rounded-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-3 w-20 bg-white/10 rounded" />
                <div className="h-4 w-4 bg-white/10 rounded" />
              </div>
              <div className="h-7 w-16 bg-white/10 rounded mb-2" />
              <div className="h-3 w-24 bg-white/10 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-bg-secondary border border-border rounded-sm h-64" />
          <div className="bg-bg-secondary border border-border rounded-sm h-64" />
        </div>
      </div>
    );
  }

  const revenue = data.registrations.paidRevenueCents / 100;
  const isNew = data.registrations.total === 0 && data.liveGames === 0 && data.tournamentStatus.length === 0;
  const stalenessColor = secondsAgo >= 120 ? "text-red" : secondsAgo >= 60 ? "text-amber-400" : "text-text-secondary";

  return (
    <div className="space-y-6 mb-8">
      {/* Staleness indicator */}
      <div className="flex items-center justify-end gap-2">
        <span className={`text-[10px] tabular-nums ${stalenessColor}`}>
          Updated {secondsAgo}s ago
        </span>
        <button
          onClick={() => fetchData()}
          className="text-text-secondary hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50 rounded"
          title="Refresh now"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live game ticker */}
      {liveGamesDetail.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
          <span className="text-[10px] text-red font-bold uppercase tracking-wider flex-shrink-0 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2"><span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red" /></span>
            Live
          </span>
          {liveGamesDetail.map((g) => (
            <div key={g.id} className="flex-shrink-0 bg-red/5 border border-red/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-white text-xs font-bold whitespace-nowrap">{g.homeTeam}</span>
              <span className="text-red text-sm font-bold tabular-nums">{g.homeScore}-{g.awayScore}</span>
              <span className="text-white text-xs font-bold whitespace-nowrap">{g.awayTeam}</span>
              {g.quarter && <span className="text-text-secondary text-[10px] ml-1">{g.quarter}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Registration KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Registrations"
          value={data.registrations.total.toString()}
          icon={ClipboardList}
          trend={`${data.registrations.approvalRate}% approved`}
          trendUp={data.registrations.approvalRate > 50}
        />
        <KPICard
          title="Pending Payments"
          value={data.registrations.pendingPayments.toString()}
          icon={AlertTriangle}
          trend={data.registrations.pendingPayments > 0 ? "Action needed" : "All clear"}
          trendUp={data.registrations.pendingPayments === 0}
        />
        <KPICard
          title="Registration Revenue"
          value={`$${revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          trend="From paid registrations"
          trendUp={true}
        />
        <KPICard
          title="Live Games"
          value={data.liveGames.toString()}
          icon={Radio}
          trend={data.liveGames > 0 ? "In progress now" : "None active"}
          trendUp={data.liveGames > 0}
        />
      </div>

      {/* Tournament Status + Upcoming Schedule row */}
      {isNew ? (
        <div className="bg-bg-secondary border border-border rounded-sm p-6">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Getting Started</h3>
          <p className="text-text-secondary text-xs mb-4">Set up your facility in 3 steps</p>
          <div className="space-y-3">
            {[
              { num: "1", label: "Create your first tournament", href: "/admin/tournaments/manage", icon: Trophy },
              { num: "2", label: "Add an announcement for coaches", href: "/admin/announcements", icon: Megaphone },
              { num: "3", label: "View your leads pipeline", href: "/admin/leads", icon: TrendingUp },
            ].map((step) => (
              <Link key={step.num} href={step.href} className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-lg transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50">
                <span className="w-7 h-7 rounded-full bg-red/20 text-red flex items-center justify-center text-xs font-bold">{step.num}</span>
                <span className="text-white text-sm font-medium group-hover:text-white/80">{step.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Tournaments */}
        <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-red" />
              <h3 className="text-white font-bold text-xs uppercase tracking-wider">
                Active Tournaments
              </h3>
            </div>
            <Link
              href="/admin/tournaments/manage"
              className="text-text-secondary hover:text-white text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50"
            >
              View All
            </Link>
          </div>
          {data.tournamentStatus.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="w-12 h-12 bg-red/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-red/60" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">No Active Tournaments</p>
              <p className="text-text-secondary text-xs mb-4">Create your first tournament — it takes less than 60 seconds with templates</p>
              <Link href="/admin/tournaments/manage" className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50">
                <Trophy className="w-3.5 h-3.5" /> Create Tournament
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.tournamentStatus.map((t) => {
                const pct =
                  t.maxCapacity && t.maxCapacity > 0
                    ? Math.min(
                        Math.round((t.registeredCount / t.maxCapacity) * 100),
                        100
                      )
                    : null;
                return (
                  <Link
                    key={t.id}
                    href={`/admin/tournaments/${t.id}/registrations`}
                    className="block px-5 py-3 hover:bg-white/[0.02] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-semibold truncate mr-2">
                        {t.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {t.registrationOpen ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                            Open
                          </span>
                        ) : (
                          <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded font-bold">
                            Closed
                          </span>
                        )}
                        <span className="text-[10px] bg-red/10 text-red px-2 py-0.5 rounded font-bold uppercase">
                          {t.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-text-secondary text-xs mb-2">
                      <span>
                        {new Date(t.startDate + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                      <span>{t.divisions.join(", ")}</span>
                      {t.entryFee != null && t.entryFee > 0 && (
                        <span>${(t.entryFee / 100).toFixed(0)}/team</span>
                      )}
                    </div>
                    {pct !== null ? (() => {
                      const barColor = pct >= 90 ? "bg-red" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400";
                      const textColor = pct >= 90 ? "text-red" : "text-text-secondary";
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-full transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold tabular-nums ${textColor}`}>{pct}%</span>
                          <span className="text-text-secondary text-[10px] font-bold tabular-nums">
                            {t.registeredCount}/{t.maxCapacity}
                          </span>
                        </div>
                      );
                    })() : (
                      <span className="text-text-secondary text-[10px]">
                        {t.registeredCount} registered
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/tournaments/${t.id}/registrations`} className="text-text-secondary hover:text-white text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50" onClick={e => e.stopPropagation()}>
                        Registrations
                      </Link>
                      <span className="text-white/10">&middot;</span>
                      <Link href="/admin/scores/enter" className="text-text-secondary hover:text-white text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50" onClick={e => e.stopPropagation()}>
                        Enter Scores
                      </Link>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-white font-bold text-xs uppercase tracking-wider">
                Upcoming Games
              </h3>
            </div>
            {data.activeAnnouncements > 0 && (
              <Link
                href="/admin/announcements"
                className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold hover:text-amber-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50"
              >
                <Megaphone className="w-3 h-3" />
                {data.activeAnnouncements} announcement{data.activeAnnouncements !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
          {data.upcomingGames.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-cyan-400/60" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">No Games Scheduled</p>
              <p className="text-text-secondary text-xs mb-4">Games will appear here once you create a tournament and set up the bracket</p>
              <Link href="/admin/scores/enter" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50">
                <ClipboardList className="w-3.5 h-3.5" /> Add a Game
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-[10px] uppercase tracking-wider">
                    <th className="text-left px-4 py-2 font-semibold">Time</th>
                    <th className="text-left px-4 py-2 font-semibold">Matchup</th>
                    <th className="text-left px-4 py-2 font-semibold">Court</th>
                    <th className="text-left px-4 py-2 font-semibold">Div</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingGames.map((g) => {
                    const minutesUntil = g.scheduledTime ? Math.round((new Date(g.scheduledTime).getTime() - Date.now()) / 60000) : null;
                    const isSoon = minutesUntil !== null && minutesUntil > 0 && minutesUntil <= 30;
                    return (
                    <tr
                      key={g.id}
                      className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${isSoon ? "bg-amber-500/5" : ""}`}
                    >
                      <td className={`px-4 py-2 text-xs whitespace-nowrap ${isSoon ? "text-amber-400 font-semibold" : "text-white/60"}`}>
                        {isSoon
                          ? `In ${minutesUntil} min`
                          : g.scheduledTime
                            ? new Date(g.scheduledTime).toLocaleTimeString(
                                "en-US",
                                { hour: "numeric", minute: "2-digit" }
                              )
                            : "TBD"}
                      </td>
                      <td className="px-4 py-2 text-white text-xs font-semibold whitespace-nowrap">
                        {g.homeTeam} vs {g.awayTeam}
                      </td>
                      <td className="px-4 py-2 text-white/60 text-xs">
                        {g.court || "—"}
                      </td>
                      <td className="px-4 py-2 text-white/60 text-xs">
                        {g.division || "—"}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
