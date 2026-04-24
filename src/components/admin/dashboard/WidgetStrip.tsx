"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Trophy, FileSignature, UserPlus } from "lucide-react";

type Widgets = {
  rentalRevenueThisWeekCents: number;
  activeTournament: null | {
    id: number;
    name: string;
    startDate: string;
    endDate: string | null;
    teamsRegistered: number;
    gamesTotal: number;
    gamesCompleted: number;
    percentComplete: number;
  };
  signupsByDay: Array<{ day: string; count: number }>;
  pendingApprovals: number;
};

function dollars(c: number): string {
  return `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// Four-up mini-widget strip. Lives below the main hero on /admin.
// Each tile is actionable (clicks through to the detail).
export default function WidgetStrip() {
  const [data, setData] = useState<Widgets | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard-widgets")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const last7Total = data.signupsByDay.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...data.signupsByDay.map((d) => d.count));

  return (
    <section aria-label="Quick widgets" className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Rental revenue this week */}
      <Link
        href="/admin/resources"
        className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">This Week</p>
        </div>
        <p className="text-navy font-heading font-bold text-2xl tabular-nums">{dollars(data.rentalRevenueThisWeekCents)}</p>
        <p className="text-text-muted text-xs">Rental revenue</p>
      </Link>

      {/* Active tournament progress */}
      <Link
        href={data.activeTournament ? `/admin/tournaments/${data.activeTournament.id}` : "/admin/tournaments/manage"}
        className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-red" aria-hidden="true" />
          </div>
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Tournament</p>
        </div>
        {data.activeTournament ? (
          <>
            <p className="text-navy font-bold text-sm truncate">{data.activeTournament.name}</p>
            <div className="w-full bg-off-white rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-red h-full transition-all"
                style={{ width: `${data.activeTournament.percentComplete}%` }}
              />
            </div>
            <p className="text-text-muted text-[11px] mt-1 tabular-nums">
              {data.activeTournament.gamesCompleted}/{data.activeTournament.gamesTotal} games
              {" · "}
              {data.activeTournament.teamsRegistered} teams
            </p>
          </>
        ) : (
          <>
            <p className="text-navy font-heading font-bold text-2xl">—</p>
            <p className="text-text-muted text-xs">No active tournament</p>
          </>
        )}
      </Link>

      {/* New signups last 7 days (sparkline) */}
      <Link
        href="/admin/users"
        className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Last 7 days</p>
        </div>
        <p className="text-navy font-heading font-bold text-2xl tabular-nums">{last7Total}</p>
        <p className="text-text-muted text-xs mb-2">New signups</p>
        {/* Bar spark */}
        <div className="flex items-end gap-0.5 h-6">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const day = d.toISOString().slice(0, 10);
            const n = data.signupsByDay.find((s) => s.day === day)?.count ?? 0;
            const h = Math.max(2, Math.round((n / max) * 22));
            return (
              <div
                key={day}
                className={`flex-1 rounded-sm ${n > 0 ? "bg-blue-500" : "bg-off-white"}`}
                style={{ height: `${h}px` }}
                title={`${day}: ${n}`}
              />
            );
          })}
        </div>
      </Link>

      {/* Pending approvals */}
      <Link
        href="/admin/approvals"
        className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <FileSignature className="w-4 h-4 text-amber-600" aria-hidden="true" />
          </div>
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Needs Action</p>
        </div>
        <p className={`font-heading font-bold text-2xl tabular-nums ${data.pendingApprovals > 0 ? "text-amber-600" : "text-navy"}`}>
          {data.pendingApprovals}
        </p>
        <p className="text-text-muted text-xs">Pending approvals</p>
      </Link>
    </section>
  );
}
