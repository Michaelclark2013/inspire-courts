"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) setData(await res.json());
      } catch {}
    }
    fetchData();
  }, []);

  if (!data) {
    return (
      <div className="space-y-6 mb-8 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-bg-secondary border border-border rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  const revenue = data.registrations.paidRevenueCents / 100;

  return (
    <div className="space-y-6 mb-8">
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
              className="text-text-secondary hover:text-white text-xs transition-colors"
            >
              View All
            </Link>
          </div>
          {data.tournamentStatus.length === 0 ? (
            <div className="px-5 py-8 text-center text-text-secondary text-sm">
              No active tournaments
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
                    className="block px-5 py-3 hover:bg-white/[0.02] transition-colors"
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
                    {pct !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-text-secondary text-[10px] font-bold tabular-nums">
                          {t.registeredCount}/{t.maxCapacity}
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-secondary text-[10px]">
                        {t.registeredCount} registered
                      </span>
                    )}
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
                className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold hover:text-amber-300 transition-colors"
              >
                <Megaphone className="w-3 h-3" />
                {data.activeAnnouncements} announcement{data.activeAnnouncements !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
          {data.upcomingGames.length === 0 ? (
            <div className="px-5 py-8 text-center text-text-secondary text-sm">
              No games scheduled
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
                  {data.upcomingGames.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-2 text-white/60 text-xs whitespace-nowrap">
                        {g.scheduledTime
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
