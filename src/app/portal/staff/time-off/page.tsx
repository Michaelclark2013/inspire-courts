"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Plane, Plus, Calendar, X } from "lucide-react";

type Request = {
  id: number;
  startDate: string;
  endDate: string;
  type: "pto" | "unpaid" | "sick" | "other";
  status: "pending" | "approved" | "denied" | "cancelled";
  reason: string | null;
  denialReason: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  denied: "bg-red/10 text-red",
  cancelled: "bg-navy/10 text-navy/70",
};

function fmtDate(iso: string): string { try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); } catch { return iso; } }

export default function StaffTimeOffPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/staff/time-off");
      if (res.ok) setRequests((await res.json()).data || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  async function cancel(id: number) {
    if (!confirm("Cancel this time-off request?")) return;
    await fetch(`/api/portal/staff/time-off?id=${id}`, { method: "DELETE" });
    load();
  }

  if (status === "loading") return null;
  if (status === "unauthenticated") redirect("/login?callbackUrl=/portal/staff/time-off");

  return (
    <div className="min-h-screen bg-off-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">Time Off</h1>
            <p className="text-sm text-text-secondary mt-1">
              {session?.user?.name ? `Hi, ${session.user.name}.` : ""} File a request, track approvals.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90">
            <Plus className="w-4 h-4" /> Request
          </button>
        </div>

        {loading ? (
          <div className="text-text-secondary text-sm">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center">
            <Plane className="w-10 h-10 text-text-secondary mx-auto mb-3" />
            <p className="text-navy font-semibold mb-1">No time-off requests yet</p>
            <p className="text-text-secondary text-sm">File your first one when you need it.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="bg-white border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-text-secondary">{r.type}</span>
                    </div>
                    <div className="text-sm text-navy mt-1">
                      <Calendar className="inline w-3.5 h-3.5 mr-1" />
                      {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                    </div>
                    {r.reason && <div className="text-xs text-text-secondary mt-1 italic">&ldquo;{r.reason}&rdquo;</div>}
                    {r.denialReason && <div className="text-xs text-red mt-1">Reason: {r.denialReason}</div>}
                  </div>
                  {r.status === "pending" && (
                    <button onClick={() => cancel(r.id)}
                      className="text-xs text-text-secondary hover:text-red inline-flex items-center gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <RequestModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }} />
        )}
      </div>
    </div>
  );
}

function RequestModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ startDate: today, endDate: today, type: "pto" as "pto" | "unpaid" | "sick" | "other", reason: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/portal/staff/time-off", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: form.startDate, endDate: form.endDate, type: form.type, reason: form.reason || null }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Submit failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Submit failed"); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-navy mb-4">New Request</h2>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Start</span>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">End</span>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          </div>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Type</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
              <option value="pto">PTO</option>
              <option value="unpaid">Unpaid</option>
              <option value="sick">Sick</option>
              <option value="other">Other</option>
            </select></label>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Reason (optional)</span>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          {err && <div className="text-red text-xs">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-navy text-white rounded-md text-sm hover:bg-navy/90 disabled:opacity-50">
            {saving ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
