"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Inbox, Clock, AlertCircle, Phone, Mail, MessageSquare, X } from "lucide-react";
import { INQUIRY_CONFIGS } from "@/lib/inquiry-forms";

type InquiryRow = {
  id: number;
  kind: string;
  status: "new" | "contacted" | "qualifying" | "won" | "lost";
  name: string;
  email: string | null;
  phone: string | null;
  sports: string | null;
  source: string | null;
  message: string | null;
  slaDueAt: string | null;
  firstTouchAt: string | null;
  createdAt: string;
  assignedTo: number | null;
  assignedName: string | null;
};

const STATUS_TONES: Record<string, string> = {
  new: "bg-red/10 text-red border-red/30",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  qualifying: "bg-blue-50 text-blue-700 border-blue-200",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-text-muted/10 text-text-muted border-border",
};

function getKindLabel(kind: string): string {
  const c = INQUIRY_CONFIGS.find((x) => x.kind === kind);
  return c?.title || kind;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = d.getTime() - Date.now();
  const absMin = Math.abs(Math.round(diffMs / 60_000));
  if (absMin < 60) return diffMs > 0 ? `in ${absMin}m` : `${absMin}m ago`;
  const absHr = Math.round(absMin / 60);
  if (absHr < 24) return diffMs > 0 ? `in ${absHr}h` : `${absHr}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function InquiriesPage() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [filterKind, setFilterKind] = useState<string>("");
  const [active, setActive] = useState<InquiryRow | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterKind) params.set("kind", filterKind);
      const res = await fetch(`/api/admin/inquiries?${params}`, { cache: "no-store" });
      if (res.ok) setRows((await res.json()).rows || []);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterKind]);

  useEffect(() => { load(); }, [load]);

  async function patch(id: number, body: Record<string, unknown>) {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setNote("");
    load();
    if (active && active.id === id) {
      // refresh active row
      const updated = rows.find((r) => r.id === id);
      if (updated) setActive({ ...updated, ...(body as Partial<InquiryRow>) });
    }
  }

  const stats = {
    total: rows.length,
    overdue: rows.filter((r) => r.status === "new" && r.slaDueAt && new Date(r.slaDueAt) < new Date()).length,
    new: rows.filter((r) => r.status === "new").length,
    inProgress: rows.filter((r) => ["contacted", "qualifying"].includes(r.status)).length,
  };

  if (loading) return <div className="p-8 text-text-muted">Loading inquiries…</div>;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <div className="mb-5">
        <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Lead pipeline</p>
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
          Inquiries
        </h1>
        <p className="text-text-muted text-sm mt-1">30-min response SLA · respond fast, win more.</p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Open" value={stats.total} tone="navy" />
        <Stat label="Overdue" value={stats.overdue} tone={stats.overdue > 0 ? "red" : "navy"} />
        <Stat label="New" value={stats.new} tone="red" />
        <Stat label="In progress" value={stats.inProgress} tone="amber" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-off-white border border-border rounded-lg px-3 py-1.5 text-sm">
          <option value="open">Open</option>
          <option value="">All</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualifying">Qualifying</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <select value={filterKind} onChange={(e) => setFilterKind(e.target.value)} className="bg-off-white border border-border rounded-lg px-3 py-1.5 text-sm">
          <option value="">All kinds</option>
          {INQUIRY_CONFIGS.filter((c) => c.kind !== "general").map((c) => <option key={c.kind} value={c.kind}>{c.title}</option>)}
        </select>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <Inbox className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-navy font-bold">All clear.</p>
          <p className="text-text-muted text-sm mt-1">No inquiries match these filters.</p>
        </div>
      ) : (
        <ul className="bg-white border border-border rounded-2xl shadow-sm divide-y divide-border overflow-hidden">
          {rows.map((r) => {
            const overdue = r.status === "new" && r.slaDueAt && new Date(r.slaDueAt) < new Date();
            return (
              <li key={r.id}>
                <button onClick={() => setActive(r)} className="w-full text-left px-4 py-3 hover:bg-off-white flex items-center gap-3 flex-wrap">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${STATUS_TONES[r.status]}`}>
                    {r.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-navy font-semibold truncate">
                      {r.name}
                      <span className="text-text-muted text-xs ml-2 font-normal">{getKindLabel(r.kind)}</span>
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {r.phone || r.email || "—"}{r.sports ? ` · ${r.sports}` : ""}{r.source ? ` · ${r.source}` : ""}
                    </p>
                  </div>
                  {overdue && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red bg-red/5 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" /> overdue
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {fmtTime(r.createdAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Detail drawer */}
      {active && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-text-muted text-[10px] uppercase tracking-wider">{getKindLabel(active.kind)}</p>
                <p className="text-navy font-bold text-lg">{active.name}</p>
              </div>
              <button onClick={() => setActive(null)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                {active.phone && (
                  <a href={`tel:${active.phone}`} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <Phone className="w-3.5 h-3.5" /> {active.phone}
                  </a>
                )}
                {active.email && (
                  <a href={`mailto:${active.email}`} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <Mail className="w-3.5 h-3.5" /> {active.email}
                  </a>
                )}
                {active.phone && (
                  <a href={`sms:${active.phone}`} className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <MessageSquare className="w-3.5 h-3.5" /> Text
                  </a>
                )}
              </div>
              {active.message && (
                <div className="bg-off-white rounded-lg p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">Message</p>
                  <p className="text-sm text-navy whitespace-pre-wrap">{active.message}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => patch(active.id, { status: "contacted" })} className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                  Mark contacted
                </button>
                <button onClick={() => patch(active.id, { status: "qualifying" })} className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                  Qualifying
                </button>
                <button onClick={() => patch(active.id, { status: "won" })} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                  Won 🎉
                </button>
                <button onClick={() => patch(active.id, { status: "lost" })} className="bg-text-muted/10 hover:bg-text-muted/20 text-text-muted font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                  Lost
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (timeline entry)…"
                rows={2}
                className="w-full bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={() => note && patch(active.id, { note })} disabled={!note} className="w-full bg-navy hover:bg-navy/90 disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                Add note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "navy" | "red" | "amber" | "emerald" }) {
  const t = tone === "red" ? "text-red" : tone === "amber" ? "text-amber-700" : tone === "emerald" ? "text-emerald-700" : "text-navy";
  return (
    <div className="bg-white border border-border rounded-xl p-3 text-center">
      <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold">{label}</p>
      <p className={`text-2xl font-bold font-heading ${t} mt-1`}>{value}</p>
    </div>
  );
}
