"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Phone, Mail, Calendar, CheckCircle2,
  AlertTriangle, Pause, Users as UsersIcon, LogIn,
} from "lucide-react";

type Detail = {
  member: {
    id: number; firstName: string; lastName: string;
    email: string | null; phone: string | null; birthDate: string | null;
    status: "active" | "paused" | "past_due" | "cancelled" | "trial";
    source: string; joinedAt: string;
    nextRenewalAt: string | null; autoRenew: boolean;
    pausedUntil: string | null; paymentMethod: string | null;
    notes: string | null; primaryMemberId: number | null;
    planId: number | null; planName: string | null; planType: string | null;
    planMonthlyCents: number | null; planAnnualCents: number | null;
    maxVisitsPerMonth: number | null; maxVisitsPerWeek: number | null;
    renewalReminderSentAt: string | null; createdAt: string;
  };
  visits: Array<{
    id: number; type: string; visitedAt: string;
    checkedInByName: string | null; notes: string | null;
  }>;
  monthVisitCount: number;
  dependents: Array<{ id: number; firstName: string; lastName: string; status: string }>;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  trial: "bg-cyan-50 text-cyan-700",
  paused: "bg-amber-50 text-amber-700",
  past_due: "bg-red/10 text-red",
  cancelled: "bg-navy/10 text-navy/70",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}
function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return iso; }
}
function fmtCents(c: number | null): string { if (c == null) return "—"; return `$${(c / 100).toFixed(2)}`; }

export default function MemberDetailPage() {
  const { data: session, status } = useSession();
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInBusy, setCheckInBusy] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/members/${id}`);
      if (res.ok) setDetail(await res.json());
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  async function checkIn(type: string) {
    if (!detail) return;
    setCheckInBusy(true); setCheckInMsg("");
    try {
      const res = await fetch("/api/admin/members/visits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: detail.member.id, type }),
      });
      if (res.ok) {
        setCheckInMsg(`Checked in for ${type.replace("_", " ")}`);
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        setCheckInMsg(j.error || "Check-in failed");
      }
    } finally {
      setCheckInBusy(false);
      setTimeout(() => setCheckInMsg(""), 4000);
    }
  }

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");
  if (loading) return <div className="p-6 text-text-secondary">Loading…</div>;
  if (!detail) return <div className="p-6 text-text-secondary">Member not found</div>;

  const m = detail.member;
  const monthPct = m.maxVisitsPerMonth
    ? Math.min(100, Math.round((detail.monthVisitCount / m.maxVisitsPerMonth) * 100))
    : 0;

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6">
      <Link href="/admin/members" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-navy">
        <ArrowLeft className="w-4 h-4" /> Back to members
      </Link>

      {/* HERO */}
      <div className="bg-white border border-border rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
              {m.firstName[0]}{m.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">{m.firstName} {m.lastName}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1 text-sm text-text-secondary">
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[m.status]}`}>
                  {m.status === "active" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {m.status === "paused" && <Pause className="w-3 h-3 mr-1" />}
                  {m.status === "past_due" && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {m.status.replace("_", " ")}
                </span>
                {m.email && <><Mail className="w-3.5 h-3.5" /> {m.email}</>}
                {m.phone && <><Phone className="w-3.5 h-3.5" /> {m.phone}</>}
              </div>
              {m.pausedUntil && (
                <div className="text-xs text-amber-700 mt-1">
                  Paused until {fmtDate(m.pausedUntil)} — auto-reactivates
                </div>
              )}
            </div>
          </div>

          {/* Quick check-in */}
          {m.status !== "cancelled" && m.status !== "past_due" && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap gap-1 justify-end">
                <button onClick={() => checkIn("open_gym")} disabled={checkInBusy}
                  className="inline-flex items-center gap-1 bg-emerald-600 text-white rounded-md px-3 py-1.5 text-sm hover:bg-emerald-700 disabled:opacity-50">
                  <LogIn className="w-4 h-4" /> Check in — Open Gym
                </button>
                <button onClick={() => checkIn("class")} disabled={checkInBusy}
                  className="inline-flex items-center gap-1 bg-white border border-border text-navy rounded-md px-3 py-1.5 text-sm hover:bg-off-white">
                  Class
                </button>
                <button onClick={() => checkIn("private_training")} disabled={checkInBusy}
                  className="inline-flex items-center gap-1 bg-white border border-border text-navy rounded-md px-3 py-1.5 text-sm hover:bg-off-white">
                  Training
                </button>
              </div>
              {checkInMsg && <div className="text-xs text-emerald-700">{checkInMsg}</div>}
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-border rounded-lg p-3">
          <div className="text-xs uppercase tracking-wide text-text-secondary mb-1">Member Since</div>
          <div className="text-lg font-semibold text-navy">{fmtDate(m.joinedAt)}</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-3">
          <div className="text-xs uppercase tracking-wide text-text-secondary mb-1">Plan</div>
          <div className="text-lg font-semibold text-navy truncate">{m.planName || "—"}</div>
          <div className="text-xs text-text-secondary">
            {m.planMonthlyCents ? `${fmtCents(m.planMonthlyCents)}/mo` : m.planAnnualCents ? `${fmtCents(m.planAnnualCents)}/yr` : ""}
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-3">
          <div className="text-xs uppercase tracking-wide text-text-secondary mb-1">Next Renewal</div>
          <div className="text-lg font-semibold text-navy">{fmtDate(m.nextRenewalAt)}</div>
          <div className="text-xs text-text-secondary">{m.autoRenew ? "Auto-renew on" : "Manual"}</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-3">
          <div className="text-xs uppercase tracking-wide text-text-secondary mb-1">Visits This Month</div>
          <div className="text-lg font-semibold text-navy">
            {detail.monthVisitCount}
            {m.maxVisitsPerMonth && <span className="text-text-secondary text-sm"> / {m.maxVisitsPerMonth}</span>}
          </div>
          {m.maxVisitsPerMonth && (
            <div className="h-1 bg-off-white rounded-full mt-1 overflow-hidden">
              <div className={`h-full ${monthPct >= 100 ? "bg-red" : monthPct >= 80 ? "bg-amber-600" : "bg-navy"}`}
                style={{ width: `${monthPct}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Family */}
      {detail.dependents.length > 0 && (
        <section className="bg-white border border-border rounded-xl p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy mb-3">
            <UsersIcon className="w-4 h-4 text-navy/60" /> Family dependents ({detail.dependents.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {detail.dependents.map((d) => (
              <Link key={d.id} href={`/admin/members/${d.id}`}
                className={`inline-flex items-center gap-1 border rounded-full px-3 py-1 text-xs ${
                  STATUS_STYLES[d.status]
                } hover:shadow-sm transition-shadow`}>
                {d.firstName} {d.lastName}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent visits */}
      <section className="bg-white border border-border rounded-xl p-5">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy mb-3">
          <Calendar className="w-4 h-4 text-navy/60" /> Recent Visits
        </h2>
        {detail.visits.length === 0 ? (
          <p className="text-sm text-text-secondary">No visits logged yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {detail.visits.map((v) => (
              <li key={v.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <span className="text-navy">{v.type.replace("_", " ")}</span>
                  {v.checkedInByName && <span className="text-text-secondary text-xs ml-2">by {v.checkedInByName}</span>}
                  {v.notes && <span className="text-text-secondary text-xs ml-2 italic">— {v.notes}</span>}
                </div>
                <span className="text-xs text-text-secondary">{fmtTime(v.visitedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {m.notes && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900 mb-1">Notes</h2>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{m.notes}</p>
        </section>
      )}
    </div>
  );
}
