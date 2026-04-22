"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  Users,
  UserCheck,
  Calendar,
  Truck,
  AlertTriangle,
  TrendingUp,
  Wallet,
  CheckCircle2,
  RefreshCw,
  Trophy,
  DollarSign,
  Zap,
} from "lucide-react";

type OpsSummary = {
  asOf: string;
  staff: {
    activeCount: number;
    onTheClock: Array<{
      id: number;
      userId: number;
      name: string | null;
      role: string | null;
      clockInAt: string;
      source: string;
    }>;
    pendingApprovals: number;
    thresholdAlerts: Array<{
      userId: number;
      name: string | null;
      classification: string;
      ytdCents: number;
      status: "approaching" | "over";
    }>;
    thresholdWarnAtCents: number;
  };
  shifts: {
    upcoming48h: Array<{
      id: number;
      title: string;
      role: string | null;
      startAt: string;
      endAt: string;
      requiredHeadcount: number;
      status: string;
    }>;
    understaffed: Array<{
      id: number;
      title: string;
      startAt: string;
      requiredHeadcount: number;
      filled: number;
    }>;
  };
  tournaments: {
    next: Array<{
      id: number;
      name: string;
      startDate: string;
      status: string;
    }>;
    pendingRegistrations: number;
  };
  resources: {
    activeCount: number;
    inUse: Array<{
      id: number;
      resourceId: number;
      resourceName: string | null;
      renterName: string | null;
      endAt: string;
      status: string;
    }>;
    upcoming: Array<{
      id: number;
      resourceName: string | null;
      renterName: string | null;
      startAt: string;
      endAt: string;
      status: string;
    }>;
  };
  payroll: {
    openPeriods: Array<{
      id: number;
      label: string;
      startsAt: string;
      endsAt: string;
      status: string;
    }>;
  };
  compliance?: {
    expiringWaivers?: Array<{
      id: number;
      playerName: string;
      expiresAt: string | null;
      waiverType: string;
    }>;
  };
};

function fmtCents(c: number): string {
  return `$${Math.floor(c / 100).toLocaleString()}.${String(c % 100).padStart(2, "0")}`;
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtTimeShort(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function elapsedMinutes(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000));
}

export default function OpsDashboard({ userName }: { userName: string | null }) {
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  // One AbortController per in-flight fetch — the next call aborts
  // its predecessor so a slow response can't stomp on a fresher
  // state update after the user navigates away.
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/ops-summary", { signal: controller.signal });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      setSummary(await res.json());
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 60s while visible — dashboard is a live board
  // during tournaments so staleness matters more than saved cycles.
  useEffect(() => {
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60_000);
    return () => clearInterval(iv);
  }, [load]);

  // Abort any in-flight fetch on unmount. Without this, a slow
  // /api/admin/ops-summary response completing after the admin
  // navigates to a sub-page would call setSummary on a dead tree.
  useEffect(() => {
    const currentAbort = abortRef;
    return () => currentAbort.current?.abort();
  }, []);

  if (loading && !summary) {
    return <div className="p-6 text-text-secondary text-sm">Loading ops dashboard…</div>;
  }
  if (err && !summary) {
    return (
      <div className="p-6 bg-red/5 border border-red/20 rounded-lg text-red text-sm">
        Failed to load dashboard: {err}
      </div>
    );
  }
  if (!summary) return null;

  const s = summary;
  const onClock = s.staff.onTheClock;
  const hasPending = s.staff.pendingApprovals > 0;
  const hasUnderstaffed = s.shifts.understaffed.length > 0;
  const has1099Alerts = s.staff.thresholdAlerts.length > 0;
  const alertsCount =
    (hasPending ? 1 : 0) +
    (hasUnderstaffed ? 1 : 0) +
    (has1099Alerts ? 1 : 0) +
    (s.tournaments.pendingRegistrations > 0 ? 1 : 0);

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
            Ops Dashboard
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {userName ? `Hi, ${userName}.` : ""} Live staff, schedule, rentals,
            and payroll at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary hidden sm:inline">
            Updated {fmtTimeShort(s.asOf)}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-navy disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Kpi
          label="On the Clock"
          value={onClock.length}
          icon={Clock}
          tone={onClock.length > 0 ? "emerald" : "navy"}
          href="/admin/timeclock"
        />
        <Kpi
          label="Pending Approvals"
          value={s.staff.pendingApprovals}
          icon={CheckCircle2}
          tone={hasPending ? "amber" : "navy"}
          href="/admin/timeclock"
        />
        <Kpi
          label="Active Staff"
          value={s.staff.activeCount}
          icon={Users}
          tone="navy"
          href="/admin/roster"
        />
        <Kpi
          label="Shifts (48h)"
          value={s.shifts.upcoming48h.length}
          icon={Calendar}
          tone={hasUnderstaffed ? "amber" : "navy"}
          href="/admin/shifts"
        />
        <Kpi
          label="Resources Rented"
          value={s.resources.inUse.length}
          icon={Truck}
          tone="cyan"
          href="/admin/resources"
        />
        <Kpi
          label="Pending Regs"
          value={s.tournaments.pendingRegistrations}
          icon={UserCheck}
          tone={s.tournaments.pendingRegistrations > 0 ? "amber" : "navy"}
          href="/admin/tournaments/manage"
        />
      </div>

      {/* ALERT BANNER */}
      {alertsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2 text-sm">
                {alertsCount} item{alertsCount === 1 ? "" : "s"} need attention
              </h3>
              <ul className="space-y-1 text-sm text-amber-900">
                {hasPending && (
                  <li>
                    <Link href="/admin/timeclock" className="hover:underline">
                      • {s.staff.pendingApprovals} time entries awaiting approval
                    </Link>
                  </li>
                )}
                {hasUnderstaffed && (
                  <li>
                    <Link href="/admin/shifts" className="hover:underline">
                      • {s.shifts.understaffed.length} upcoming shifts understaffed
                    </Link>
                  </li>
                )}
                {has1099Alerts && (
                  <li>
                    <Link href="/admin/roster" className="hover:underline">
                      • {s.staff.thresholdAlerts.length} worker
                      {s.staff.thresholdAlerts.length === 1 ? "" : "s"} approaching
                      or past the $600 1099 threshold
                    </Link>
                  </li>
                )}
                {s.tournaments.pendingRegistrations > 0 && (
                  <li>
                    <Link
                      href="/admin/tournaments/manage"
                      className="hover:underline"
                    >
                      • {s.tournaments.pendingRegistrations} tournament registration
                      {s.tournaments.pendingRegistrations === 1 ? "" : "s"} pending
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TWO-COLUMN LIVE BOARDS */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ON THE CLOCK */}
        <Panel
          title="On the Clock"
          icon={Clock}
          href="/admin/timeclock"
          cta="Time Clock →"
        >
          {onClock.length === 0 ? (
            <Empty text="Nobody's clocked in right now." />
          ) : (
            <ul className="divide-y divide-border">
              {onClock.map((e) => (
                <li key={e.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-navy">
                      {e.name || `User #${e.userId}`}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {e.role || "—"} · since {fmtTimeShort(e.clockInAt)} · {e.source}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded px-2 py-0.5 text-xs font-mono">
                    <Clock className="w-3 h-3" /> {elapsedMinutes(e.clockInAt)}m
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* UPCOMING SHIFTS */}
        <Panel
          title="Upcoming Shifts (next 48h)"
          icon={Calendar}
          href="/admin/shifts"
          cta="All Shifts →"
        >
          {s.shifts.upcoming48h.length === 0 ? (
            <Empty text="No shifts scheduled in the next 48 hours." />
          ) : (
            <ul className="divide-y divide-border">
              {s.shifts.upcoming48h.slice(0, 6).map((sh) => (
                <li key={sh.id} className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-navy truncate">
                        {sh.title}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {sh.role || "—"} · {fmtTime(sh.startAt)} → {fmtTimeShort(sh.endAt)}
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary flex-shrink-0">
                      need {sh.requiredHeadcount}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* UNDERSTAFFED */}
        <Panel
          title="Understaffed Shifts"
          icon={AlertTriangle}
          href="/admin/shifts"
          cta="Fix Roster →"
          tone={hasUnderstaffed ? "amber" : undefined}
        >
          {!hasUnderstaffed ? (
            <Empty text="All upcoming shifts are fully staffed." ok />
          ) : (
            <ul className="divide-y divide-border">
              {s.shifts.understaffed.map((sh) => (
                <li key={sh.id} className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-navy truncate">
                        {sh.title}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {fmtTime(sh.startAt)}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 rounded px-2 py-0.5 text-xs font-mono">
                      {sh.filled}/{sh.requiredHeadcount}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* RESOURCES IN USE + UPCOMING */}
        <Panel
          title="Resources / Van"
          icon={Truck}
          href="/admin/resources"
          cta="Manage →"
        >
          {s.resources.inUse.length === 0 && s.resources.upcoming.length === 0 ? (
            <Empty text={`${s.resources.activeCount} active resources · all available.`} ok />
          ) : (
            <div className="space-y-3">
              {s.resources.inUse.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-navy/60 font-semibold mb-1">
                    In Use
                  </p>
                  <ul className="divide-y divide-border">
                    {s.resources.inUse.map((b) => (
                      <li
                        key={b.id}
                        className="py-2 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-navy truncate">
                            {b.resourceName}
                          </div>
                          <div className="text-xs text-text-secondary truncate">
                            {b.renterName || "—"}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 bg-navy/10 text-navy rounded px-2 py-0.5 text-xs">
                          back {fmtTime(b.endAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {s.resources.upcoming.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-navy/60 font-semibold mb-1">
                    Next Out
                  </p>
                  <ul className="divide-y divide-border">
                    {s.resources.upcoming.slice(0, 4).map((b) => (
                      <li
                        key={b.id}
                        className="py-2 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-navy truncate">
                            {b.resourceName}
                          </div>
                          <div className="text-xs text-text-secondary truncate">
                            {b.renterName || "—"}
                          </div>
                        </div>
                        <span className="text-xs text-text-secondary flex-shrink-0">
                          {fmtTime(b.startAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* 1099 THRESHOLD WATCH */}
        <Panel
          title="1099 Threshold Watch"
          icon={TrendingUp}
          href="/admin/roster"
          cta="Roster →"
          tone={has1099Alerts ? "amber" : undefined}
        >
          {!has1099Alerts ? (
            <Empty text="All non-W2 workers below $500 YTD." ok />
          ) : (
            <ul className="divide-y divide-border">
              {s.staff.thresholdAlerts.map((t) => (
                <li
                  key={t.userId}
                  className="py-2 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-navy truncate">
                      {t.name || `User #${t.userId}`}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {t.classification.replace("_", " ")}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`font-mono text-sm font-semibold ${
                        t.status === "over" ? "text-red" : "text-amber-700"
                      }`}
                    >
                      {fmtCents(t.ytdCents)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-text-secondary">
                      {t.status === "over" ? "1099 required" : "approaching"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* EXPIRING WAIVERS */}
        {s.compliance?.expiringWaivers && s.compliance.expiringWaivers.length > 0 && (
          <Panel
            title="Waivers Expiring"
            icon={AlertTriangle}
            href="/admin/waivers?filter=expiring"
            cta="Manage →"
            tone="amber"
          >
            <ul className="divide-y divide-border">
              {s.compliance.expiringWaivers.slice(0, 6).map((w) => {
                const days = w.expiresAt
                  ? Math.ceil((Date.parse(w.expiresAt) - Date.now()) / 86_400_000)
                  : null;
                const expired = days !== null && days < 0;
                return (
                  <li key={w.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-navy truncate">
                        {w.playerName}
                      </div>
                      <div className="text-xs text-text-secondary capitalize">
                        {w.waiverType}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono font-semibold ${
                        expired ? "text-red" : "text-amber-700"
                      }`}
                    >
                      {days === null ? "—" : expired ? `${-days}d overdue` : `${days}d left`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}

        {/* NEXT TOURNAMENTS + PAYROLL */}
        <Panel title="Next Up" icon={Trophy}>
          <div className="space-y-3">
            {s.tournaments.next.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-navy/60 font-semibold mb-1">
                  Tournaments
                </p>
                <ul className="divide-y divide-border">
                  {s.tournaments.next.map((t) => (
                    <li
                      key={t.id}
                      className="py-2 flex items-center justify-between gap-3"
                    >
                      <Link
                        href={`/admin/tournaments/${t.id}`}
                        className="text-sm font-medium text-navy hover:text-red truncate"
                      >
                        {t.name}
                      </Link>
                      <span className="text-xs text-text-secondary flex-shrink-0">
                        {t.startDate}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {s.payroll.openPeriods.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-navy/60 font-semibold mb-1">
                  Open Pay Periods
                </p>
                <ul className="divide-y divide-border">
                  {s.payroll.openPeriods.slice(0, 3).map((p) => (
                    <li
                      key={p.id}
                      className="py-2 flex items-center justify-between gap-3"
                    >
                      <Link
                        href={`/admin/payroll?id=${p.id}`}
                        className="text-sm font-medium text-navy hover:text-red truncate"
                      >
                        {p.label}
                      </Link>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded px-2 py-0.5 text-xs">
                        open
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {s.tournaments.next.length === 0 && s.payroll.openPeriods.length === 0 && (
              <Empty text="No upcoming tournaments or open pay periods." />
            )}
          </div>
        </Panel>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white border border-border rounded-xl p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <QuickLink href="/admin/shifts" icon={Calendar} label="New Shift" />
          <QuickLink href="/admin/roster" icon={UserCheck} label="Add Staff" />
          <QuickLink href="/admin/timeclock" icon={Clock} label="Approve Time" />
          <QuickLink href="/admin/resources" icon={Truck} label="Book Van" />
          <QuickLink href="/admin/payroll" icon={Wallet} label="Run Payroll" />
          <QuickLink href="/admin/tournaments/manage" icon={Trophy} label="Tournaments" />
          <QuickLink href="/admin/announcements" icon={Zap} label="Announce" />
          <QuickLink href="/admin/revenue" icon={DollarSign} label="Revenue" />
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone = "navy",
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "navy" | "emerald" | "amber" | "cyan";
  href?: string;
}) {
  const toneStyles = {
    navy: "bg-white border-border",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
    cyan: "bg-cyan-50 border-cyan-200",
  }[tone];
  const inner = (
    <div className={`rounded-lg border p-3 ${toneStyles}`}>
      <div className="flex items-center gap-1 text-xs text-text-secondary uppercase tracking-wide mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl font-bold text-navy">{value}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:shadow-sm transition-shadow">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function Panel({
  title,
  icon: Icon,
  href,
  cta,
  tone,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  cta?: string;
  tone?: "amber";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-white border rounded-xl p-4 ${
        tone === "amber" ? "border-amber-200" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-navy">
          <Icon className="w-4 h-4 text-navy/60" />
          {title}
        </h2>
        {href && cta && (
          <Link href={href} className="text-xs text-navy/70 hover:text-red">
            {cta}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ text, ok }: { text: string; ok?: boolean }) {
  return (
    <div
      className={`text-sm text-text-secondary ${
        ok ? "flex items-center gap-1.5" : ""
      }`}
    >
      {ok && <CheckCircle2 className="w-4 h-4 text-emerald-600" />} {text}
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 bg-off-white border border-border rounded-lg text-sm text-navy hover:border-navy/30 hover:bg-white transition-colors"
    >
      <Icon className="w-4 h-4 text-navy/60 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
