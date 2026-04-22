"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  DollarSign, Users, TrendingUp, TrendingDown, Trophy, Truck,
  Wallet, Calendar, RefreshCw,
} from "lucide-react";

type Report = {
  asOf: string;
  monthStart: string;
  members: {
    active: number; trial: number; pastDue: number;
    newThisMonth: number; cancelledLast30: number;
    churnRate: number; visitsThisMonth: number;
  };
  revenue: {
    mrrCents: number; programRevCentsMonth: number;
    rentalRevCentsMonth: number; tournamentRevCentsMonth: number;
    totalRevCentsMonth: number;
  };
  payroll: {
    lockedGrossCentsMonth: number;
    openPeriodId: number | null;
    openPeriodLabel: string | null;
    openPeriodEstimateCents: number;
  };
  tournaments: { pendingRegistrations: number; paidRevCentsMonth: number };
  rentals: { activeCount: number; hoursRentedMonth: number; revCentsMonth: number };
};

function fmtCents(c: number): string {
  return `$${Math.floor(c / 100).toLocaleString()}.${String(c % 100).padStart(2, "0")}`;
}
function fmtPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}
function monthName(iso: string): string {
  try { return new Date(iso).toLocaleDateString([], { month: "long", year: "numeric" }); }
  catch { return iso; }
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch("/api/admin/reports")
      .then((r) => r.ok ? r.json() : null)
      .then((j) => setReport(j))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading") return null;
  if (status === "unauthenticated" || session?.user?.role !== "admin") redirect("/admin/login");
  if (loading || !report) return <div className="p-6 text-text-secondary">Loading reports…</div>;

  const r = report;
  const mrrAnnualized = r.revenue.mrrCents * 12;

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Reports
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {monthName(r.monthStart)} · updated {new Date(r.asOf).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <button onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-navy">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* BIG NUMBERS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BigCard label="MRR" value={fmtCents(r.revenue.mrrCents)} sub={`${fmtCents(mrrAnnualized)}/yr run rate`} icon={DollarSign} tone="emerald" />
        <BigCard label="Total Rev (Month)" value={fmtCents(r.revenue.totalRevCentsMonth)} sub={`${fmtCents(r.revenue.mrrCents)} recurring`} icon={TrendingUp} tone="navy" />
        <BigCard label="Active Members" value={String(r.members.active)} sub={`${r.members.trial} trial · ${r.members.pastDue} past due`} icon={Users} tone="cyan" />
        <BigCard label="Churn (30d)" value={fmtPct(r.members.churnRate)} sub={`${r.members.cancelledLast30} cancelled`} icon={TrendingDown} tone={r.members.churnRate > 0.05 ? "red" : "navy"} />
      </div>

      {/* REVENUE BREAKDOWN */}
      <section className="bg-white border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy mb-3">
          Revenue this month
        </h2>
        <div className="space-y-2">
          <RevenueRow label="Memberships (MRR)" cents={r.revenue.mrrCents} total={r.revenue.totalRevCentsMonth} />
          <RevenueRow label="Programs & Camps" cents={r.revenue.programRevCentsMonth} total={r.revenue.totalRevCentsMonth} />
          <RevenueRow label="Tournament Fees" cents={r.revenue.tournamentRevCentsMonth} total={r.revenue.totalRevCentsMonth} />
          <RevenueRow label="Rentals (Van / Equipment)" cents={r.revenue.rentalRevCentsMonth} total={r.revenue.totalRevCentsMonth} />
          <div className="pt-3 mt-3 border-t border-border flex justify-between items-baseline">
            <span className="font-semibold text-navy">Total</span>
            <span className="font-mono font-bold text-xl text-navy">{fmtCents(r.revenue.totalRevCentsMonth)}</span>
          </div>
        </div>
      </section>

      {/* OPERATIONS GRID */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white border border-border rounded-xl p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy mb-3">
            <Wallet className="w-4 h-4 text-navy/60" /> Payroll
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Locked / paid this month</span>
              <span className="font-mono font-semibold text-navy">{fmtCents(r.payroll.lockedGrossCentsMonth)}</span>
            </div>
            {r.payroll.openPeriodId && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Open period ({r.payroll.openPeriodLabel})</span>
                <span className="font-mono text-amber-700">est. {fmtCents(r.payroll.openPeriodEstimateCents)}</span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t border-border flex justify-between">
              <span className="font-medium text-navy">Labor cost this month</span>
              <span className="font-mono font-bold text-navy">
                {fmtCents(r.payroll.lockedGrossCentsMonth + r.payroll.openPeriodEstimateCents)}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-white border border-border rounded-xl p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy mb-3">
            <Users className="w-4 h-4 text-navy/60" /> Member Activity
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">New signups this month</span><span className="font-mono text-emerald-700">+{r.members.newThisMonth}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Cancelled last 30 days</span><span className="font-mono text-red">-{r.members.cancelledLast30}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Visits this month</span><span className="font-mono text-navy">{r.members.visitsThisMonth.toLocaleString()}</span></div>
            <div className="pt-2 mt-2 border-t border-border flex justify-between">
              <span className="font-medium text-navy">Net change</span>
              <span className={`font-mono font-bold ${r.members.newThisMonth - r.members.cancelledLast30 >= 0 ? "text-emerald-700" : "text-red"}`}>
                {r.members.newThisMonth - r.members.cancelledLast30 >= 0 ? "+" : ""}
                {r.members.newThisMonth - r.members.cancelledLast30}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-white border border-border rounded-xl p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy mb-3">
            <Trophy className="w-4 h-4 text-navy/60" /> Tournaments
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Pending registrations</span><span className="font-mono text-amber-700">{r.tournaments.pendingRegistrations}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Paid entry fees this month</span><span className="font-mono text-navy">{fmtCents(r.tournaments.paidRevCentsMonth)}</span></div>
          </div>
        </section>

        <section className="bg-white border border-border rounded-xl p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy mb-3">
            <Truck className="w-4 h-4 text-navy/60" /> Rentals
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Currently rented</span><span className="font-mono text-navy">{r.rentals.activeCount}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Hours this month</span><span className="font-mono text-navy">{r.rentals.hoursRentedMonth}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Revenue this month</span><span className="font-mono text-emerald-700">{fmtCents(r.rentals.revCentsMonth)}</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function BigCard({ label, value, sub, icon: Icon, tone = "navy" }: { label: string; value: string; sub: string; icon: React.ComponentType<{ className?: string }>; tone?: "navy" | "emerald" | "cyan" | "red" | "amber" }) {
  const styles = {
    navy: "bg-white border-border text-navy",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-900",
    red: "bg-red/5 border-red/20 text-red",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${styles}`}>
      <div className="flex items-center gap-1 text-xs uppercase tracking-wide opacity-70 mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-70 mt-0.5">{sub}</div>
    </div>
  );
}

function RevenueRow({ label, cents, total }: { label: string; cents: number; total: number }) {
  const pct = total > 0 ? (cents / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline text-sm">
        <span className="text-navy">{label}</span>
        <span className="font-mono text-navy">{fmtCents(cents)}</span>
      </div>
      <div className="h-1.5 bg-off-white rounded-full overflow-hidden mt-1">
        <div className="h-full bg-navy" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-text-secondary mt-0.5">{pct.toFixed(1)}% of total</div>
    </div>
  );
}
