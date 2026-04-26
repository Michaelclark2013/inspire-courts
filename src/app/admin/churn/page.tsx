"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, MessageSquare, Phone, Mail, RefreshCw, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

type Row = {
  id: number;
  memberId: number;
  score: number;
  tier: "low" | "medium" | "high";
  primaryReason: string | null;
  daysSinceLastVisit: number | null;
  visitsTrend: number | null;
  tenureDays: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  priceCents: number | null;
};

type Resp = { rows: Row[]; mrrAtRisk: number };

export default function ChurnPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"all" | "high" | "medium" | "low">("high");
  const [recomputing, setRecomputing] = useState(false);
  const [draftFor, setDraftFor] = useState<Row | null>(null);
  const [draft, setDraft] = useState<{ sms: string; email: { subject: string; body: string } } | null>(null);

  const load = useCallback(async () => {
    try {
      const url = tier === "all" ? "/api/admin/churn" : `/api/admin/churn?tier=${tier}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tier]);

  useEffect(() => { load(); }, [load]);

  async function recompute() {
    setRecomputing(true);
    try {
      await adminFetch("/api/admin/churn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recompute" }),
      });
      await load();
    } finally {
      setRecomputing(false);
    }
  }

  async function openDraft(r: Row) {
    setDraftFor(r);
    setDraft(null);
    const res = await adminFetch("/api/admin/churn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "draft", memberId: r.memberId }),
    });
    if (res.ok) setDraft(await res.json());
  }

  async function dismiss(r: Row) {
    if (!confirm(`Dismiss ${r.firstName} from this list for 14 days?`)) return;
    await adminFetch("/api/admin/churn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss", memberId: r.memberId, days: 14 }),
    });
    load();
  }

  if (loading || !data) return <div className="p-8 text-text-muted">Loading churn radar…</div>;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <div className="mb-5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">AI churn radar</p>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
            At-risk members
          </h1>
        </div>
        <button
          onClick={recompute}
          disabled={recomputing}
          className="text-xs flex items-center gap-1.5 bg-navy hover:bg-navy/90 text-white font-bold uppercase tracking-wider px-3 py-2 rounded-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? "animate-spin" : ""}`} />
          Recompute now
        </button>
      </div>

      {/* MRR-at-risk callout */}
      <div className="bg-red/5 border border-red/20 rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-red" />
          <span className="text-red text-[11px] uppercase tracking-[0.2em] font-bold">Projected MRR at risk</span>
        </div>
        <p className="text-3xl sm:text-4xl font-bold font-heading text-red">
          ${(data.mrrAtRisk / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </p>
        <p className="text-text-muted text-xs mt-1">
          Sum of monthly recurring revenue from high-risk members. Win-back wins it back.
        </p>
      </div>

      {/* Tier filter */}
      <div className="flex gap-2 mb-4">
        {(["all", "high", "medium", "low"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
              tier === t ? "bg-navy text-white" : "bg-off-white text-text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Member list */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        {data.rows.length === 0 ? (
          <p className="p-6 text-text-muted text-sm text-center">No members in this tier.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.rows.map((r) => (
              <li key={r.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                <ScoreBadge score={r.score} tier={r.tier} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy font-semibold truncate">
                    {r.firstName} {r.lastName}
                    {r.priceCents ? <span className="text-text-muted text-xs ml-2 font-normal">${(r.priceCents / 100).toFixed(0)}/mo</span> : null}
                  </p>
                  <p className="text-xs text-text-muted truncate">{r.primaryReason || "Multiple signals"}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {r.phone && (
                    <a href={`tel:${r.phone}`} title="Call" className="text-text-muted hover:text-navy p-1.5 rounded hover:bg-off-white">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {r.email && (
                    <a href={`mailto:${r.email}`} title="Email" className="text-text-muted hover:text-navy p-1.5 rounded hover:bg-off-white">
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => openDraft(r)} title="Draft win-back message" className="text-text-muted hover:text-navy p-1.5 rounded hover:bg-off-white">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button onClick={() => dismiss(r)} title="Dismiss for 14 days" className="text-text-muted hover:text-navy p-1.5 rounded hover:bg-off-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Draft drawer */}
      {draftFor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setDraftFor(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-navy font-bold text-sm uppercase tracking-wider">
                Win-back draft · {draftFor.firstName}
              </h3>
              <button onClick={() => setDraftFor(null)} className="text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            {!draft ? (
              <p className="text-text-muted text-sm">Drafting…</p>
            ) : (
              <>
                <div className="bg-off-white rounded-xl p-3 mb-3">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">SMS</p>
                  <p className="text-sm text-navy whitespace-pre-wrap">{draft.sms}</p>
                  <button onClick={() => navigator.clipboard.writeText(draft.sms)} className="text-xs text-navy underline mt-2">
                    Copy SMS
                  </button>
                </div>
                <div className="bg-off-white rounded-xl p-3">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Email</p>
                  <p className="text-sm text-navy font-semibold mb-1">{draft.email.subject}</p>
                  <p className="text-sm text-navy whitespace-pre-wrap">{draft.email.body}</p>
                  <button onClick={() => navigator.clipboard.writeText(`${draft.email.subject}\n\n${draft.email.body}`)} className="text-xs text-navy underline mt-2">
                    Copy email
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score, tier }: { score: number; tier: "low" | "medium" | "high" }) {
  const cls =
    tier === "high"
      ? "bg-red/10 text-red border-red/30"
      : tier === "medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border font-bold text-lg ${cls}`}>
      {score}
    </span>
  );
}
