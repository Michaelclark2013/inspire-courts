"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

// Owner Mode — single screen, 5 numbers, refresh on focus.
// This is the "check it from anywhere" surface. Mobile-first by design;
// the desktop layout is just a scaled-up version of the same cards.

type Snapshot = {
  mrr: { cents: number; dollars: number };
  members: {
    active: number;
    paused: number;
    pastDue: number;
    newThisMonth: number;
    churnedThisMonth: number;
    churnRate: number;
    netDelta: number;
  };
  checkins: {
    today: number;
    avgDaily: number;
    sparkline: Array<{ day: string; n: number }>;
  };
  redFlags: Array<{
    kind: string;
    severity: "high" | "medium" | "low";
    label: string;
    href: string;
  }>;
  generatedAt: string;
};

function fmtUSD(dollars: number): string {
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars.toLocaleString()}`;
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default function OwnerPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/owner/snapshot", { cache: "no-store" });
      if (!res.ok) throw new Error("snapshot failed");
      const json = (await res.json()) as Snapshot;
      setData(json);
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh on tab focus — owner glances mid-meeting, expects fresh.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  if (loading) {
    return <div className="p-8 text-text-muted">Loading owner mode…</div>;
  }
  if (error || !data) {
    return (
      <div className="p-8">
        <p className="text-red font-semibold">Couldn&apos;t load snapshot</p>
        <button onClick={load} className="text-navy underline text-sm mt-2">
          Try again
        </button>
      </div>
    );
  }

  const { mrr, members, checkins, redFlags } = data;
  const trendUp = members.netDelta >= 0;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Owner Mode</p>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
            The five numbers
          </h1>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="text-text-muted hover:text-navy text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Top row — MRR + Members net delta. Mobile stacks; desktop side-by-side. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <BigCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Monthly recurring revenue"
          value={fmtUSD(mrr.dollars)}
          sub={`${members.active.toLocaleString()} active members`}
          tone="emerald"
        />
        <BigCard
          icon={trendUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          label="Net members this month"
          value={`${members.netDelta >= 0 ? "+" : ""}${members.netDelta}`}
          sub={`${members.newThisMonth} joined · ${members.churnedThisMonth} churned · ${fmtPct(members.churnRate)} churn`}
          tone={trendUp ? "emerald" : "red"}
        />
      </div>

      {/* Second row — Today's check-ins with sparkline */}
      <div className="bg-white border border-border rounded-2xl p-5 mb-3 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">
              <Activity className="w-3.5 h-3.5" />
              Today&apos;s check-ins
            </div>
            <p className="text-3xl sm:text-4xl font-bold font-heading text-navy">
              {checkins.today}
              <span className="text-text-muted text-base ml-2 font-normal">
                vs {checkins.avgDaily} avg
              </span>
            </p>
          </div>
        </div>
        <Sparkline data={checkins.sparkline} />
      </div>

      {/* Red flags */}
      <div className="bg-white border border-border rounded-2xl p-5 mb-3 shadow-sm">
        <div className="flex items-center gap-2 text-text-muted text-[11px] uppercase tracking-[0.2em] mb-3">
          <AlertTriangle className="w-3.5 h-3.5" />
          Red flags · {redFlags.length}
        </div>
        {redFlags.length === 0 ? (
          <p className="text-emerald-700 text-sm font-semibold">All clear — nothing needs your attention.</p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {redFlags.map((f, i) => (
              <li key={i}>
                <Link
                  href={f.href}
                  className="flex items-center justify-between gap-3 px-2 py-2.5 hover:bg-off-white rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        f.severity === "high" ? "bg-red" : f.severity === "medium" ? "bg-amber-500" : "bg-text-muted"
                      }`}
                    />
                    <span className="text-sm text-navy truncate">{f.label}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Health strip — pause + past-due quick view */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Active" value={members.active} tone="emerald" />
        <Stat label="Paused" value={members.paused} tone="amber" />
        <Stat label="Past due" value={members.pastDue} tone="red" />
      </div>

      <p className="text-[10px] text-text-muted text-center uppercase tracking-[0.2em]">
        Snapshot · {new Date(data.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </p>
    </div>
  );
}

function BigCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "red" | "navy";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "red"
      ? "text-red"
      : "text-navy";
  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-text-muted text-[11px] uppercase tracking-[0.2em] mb-2">
        <span className={toneClass}>{icon}</span>
        {label}
      </div>
      <p className={`text-3xl sm:text-4xl font-bold font-heading ${toneClass}`}>{value}</p>
      <p className="text-text-muted text-xs mt-1">{sub}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "red" }) {
  const toneClass =
    tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-red";
  return (
    <div className="bg-white border border-border rounded-xl p-3 text-center">
      <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold">{label}</p>
      <p className={`text-xl font-bold font-heading ${toneClass} mt-1`}>{value}</p>
    </div>
  );
}

function Sparkline({ data }: { data: Array<{ day: string; n: number }> }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.n), 1);
  const W = 300;
  const H = 50;
  const step = W / (data.length - 1 || 1);
  const points = data
    .map((d, i) => `${i * step},${H - (d.n / max) * H}`)
    .join(" ");
  const last = data[data.length - 1];
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-12">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-navy"
          points={points}
        />
      </svg>
      <p className="text-[10px] text-text-muted mt-1">
        Last 30 days · peak {max} · today {last.n}
      </p>
    </div>
  );
}
