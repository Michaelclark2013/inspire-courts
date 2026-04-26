"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DollarSign, AlertCircle, Calendar, Pause, RefreshCw, ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Snapshot = {
  mrr: { cents: number };
  counts: { active: number; pastDue: number; trialing: number; paused: number };
  revenueThisMonth: { cents: number };
  failedThisMonth: { count: number; cents: number };
  pastDueSubscriptions: Array<{
    id: number;
    memberId: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    priceCents: number;
    failedAttempts: number;
    nextRetryAt: string | null;
  }>;
  recentFailures: Array<{
    id: number;
    memberId: number;
    firstName: string | null;
    lastName: string | null;
    amountCents: number;
    failureCode: string | null;
    attemptedAt: string | null;
  }>;
  upcomingRenewals: Array<{
    id: number;
    firstName: string | null;
    lastName: string | null;
    priceCents: number;
    currentPeriodEnd: string;
  }>;
};

const fmt$ = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }) : "—";

export default function AdminBillingPage() {
  useDocumentTitle("Billing");
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/billing/snapshot", { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
        setLoadError(null);
      } else {
        const j = await res.json().catch(() => ({}));
        setLoadError(j.error || `Couldn't load billing snapshot (${res.status}).`);
      }
    } catch (err) {
      // SessionExpiredError already redirects; other throws are network blips.
      if ((err as Error)?.name !== "SessionExpiredError") {
        setLoadError("Network error loading billing snapshot.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function chargeNow(subscriptionId: number) {
    if (!confirm("Charge this card now? This will retry the most recent failed payment.")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/billing/subscriptions/${subscriptionId}/charge`, {
        method: "POST",
      });
      const json = await res.json();
      setMsg(json.ok ? "Charged successfully ✓" : `Failed: ${json.failureCode || "unknown"}`);
      load();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  if (loading) return <div className="p-8 text-text-muted">Loading billing…</div>;
  if (!data) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <div className="bg-red/5 border border-red/20 text-red rounded-2xl p-6 text-center">
          <p className="font-bold mb-1">Couldn&apos;t load billing data</p>
          <p className="text-sm">{loadError || "The snapshot endpoint returned no data."}</p>
          <button
            onClick={load}
            className="mt-3 inline-flex items-center gap-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <div className="mb-5 hidden md:block">
        <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Revenue · Subscriptions</p>
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">Billing</h1>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-4">
          {msg}
        </div>
      )}

      {/* First-run / empty-state — no subscriptions of any status yet.
          Renders zeros below this banner; banner explains the next step. */}
      {data.counts.active === 0 &&
        data.counts.pastDue === 0 &&
        data.counts.trialing === 0 &&
        data.counts.paused === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold mb-1">No subscriptions yet.</p>
            <p className="text-sm">
              Recurring billing fires once members are on a plan. Start by{" "}
              <Link href="/admin/membership-plans" className="underline font-semibold">setting up a plan</Link>{" "}
              and then{" "}
              <Link href="/admin/members" className="underline font-semibold">attaching members</Link>{" "}
              to it. Daily renewals run via the billing-tick cron.
            </p>
          </div>
        )}

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card label="MRR" value={fmt$(data.mrr.cents)} sub={`${data.counts.active} active`} tone="emerald" icon={<DollarSign className="w-4 h-4" />} />
        <Card label="Revenue this month" value={fmt$(data.revenueThisMonth.cents)} sub="Cleared invoices" tone="navy" icon={<Calendar className="w-4 h-4" />} />
        <Card
          label="Past due"
          value={String(data.counts.pastDue)}
          sub={fmt$(data.failedThisMonth.cents) + " at risk"}
          tone={data.counts.pastDue > 0 ? "red" : "navy"}
          icon={<AlertCircle className="w-4 h-4" />}
        />
        <Card label="Paused / trialing" value={`${data.counts.paused} / ${data.counts.trialing}`} sub="Not currently billed" tone="amber" icon={<Pause className="w-4 h-4" />} />
      </div>

      {/* Past-due — the action list */}
      <div className="bg-white border border-border rounded-2xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red" /> Past-due subscriptions
          </h2>
          <span className="text-xs text-text-muted">{data.pastDueSubscriptions.length}</span>
        </div>
        {data.pastDueSubscriptions.length === 0 ? (
          <p className="text-text-muted text-sm">Nothing past due. 🎉</p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {data.pastDueSubscriptions.map((s) => (
              <li key={s.id} className="px-2 py-2.5 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy font-semibold truncate">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-text-muted truncate">
                    {s.email || "no email"} · {fmt$(s.priceCents)} · {s.failedAttempts} failed · retry {fmtDate(s.nextRetryAt)}
                  </p>
                </div>
                <button
                  onClick={() => chargeNow(s.id)}
                  disabled={busy}
                  className="bg-navy hover:bg-navy/90 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Charge now
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent failures */}
      <div className="bg-white border border-border rounded-2xl p-5 mb-5 shadow-sm">
        <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-3">Recent failures</h2>
        {data.recentFailures.length === 0 ? (
          <p className="text-text-muted text-sm">No failed charges this month.</p>
        ) : (
          <ul className="divide-y divide-border -mx-2 text-xs">
            {data.recentFailures.map((f) => (
              <li key={f.id} className="px-2 py-2 grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center">
                <span className="text-text-muted">{fmtDate(f.attemptedAt)}</span>
                <span className="text-navy truncate">{f.firstName} {f.lastName}</span>
                <span className="text-red font-mono">{f.failureCode || "—"}</span>
                <span className="font-bold text-navy">{fmt$(f.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upcoming renewals */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-3">Next 10 renewals</h2>
        {data.upcomingRenewals.length === 0 ? (
          <p className="text-text-muted text-sm">No active subscriptions.</p>
        ) : (
          <ul className="divide-y divide-border -mx-2 text-xs">
            {data.upcomingRenewals.map((r) => (
              <li key={r.id} className="px-2 py-2 grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <span className="text-navy truncate">{r.firstName} {r.lastName}</span>
                <span className="text-text-muted">{fmtDate(r.currentPeriodEnd)}</span>
                <span className="font-bold text-navy">{fmt$(r.priceCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "navy" | "red" | "amber";
  icon: React.ReactNode;
}) {
  const t =
    tone === "emerald" ? "text-emerald-700"
    : tone === "red" ? "text-red"
    : tone === "amber" ? "text-amber-700"
    : "text-navy";
  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
      <div className={`flex items-center gap-1.5 text-text-muted text-[10px] uppercase tracking-wider mb-1 ${t}`}>
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-bold font-heading ${t}`}>{value}</p>
      <p className="text-text-muted text-[10px] mt-0.5 truncate">{sub}</p>
    </div>
  );
}
