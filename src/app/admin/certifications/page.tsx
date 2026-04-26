"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { IdCard, Plus , CheckCircle2 , ExternalLink } from "lucide-react";
import { SkeletonRows } from "@/components/ui/SkeletonCard";

type Cert = {
  id: number;
  userId: number;
  name: string | null;
  email: string | null;
  type: string;
  label: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  documentUrl: string | null;
  verifiedAt: string | null;
  verifiedBy: number | null;
  notes: string | null;
};

type StaffLite = { userId: number; name: string | null };

const TYPE_LABELS: Record<string, string> = {
  cpr: "CPR", first_aid: "First Aid", aed: "AED",
  background_check: "Background Check",
  ref_level_1: "Ref L1", ref_level_2: "Ref L2", ref_level_3: "Ref L3",
  coaching_license: "Coaching License", drivers_license: "Driver's License",
  w4: "W-4", i9: "I-9", other: "Other",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = Date.parse(iso);
  if (!isFinite(d)) return null;
  return Math.ceil((d - Date.now()) / 86_400_000);
}

export default function CertificationsPage() {
  const { data: session, status } = useSession();
  const [certs, setCerts] = useState<Cert[]>([]);
  const [staff, setStaff] = useState<StaffLite[]>([]);
  const [filter, setFilter] = useState<"all" | "expiring" | "expired">("all");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Cert | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "expiring") params.set("expiringInDays", "30");
      if (filter === "expired") params.set("expired", "true");
      const [cRes, sRes] = await Promise.all([
        fetch(`/api/admin/certifications?${params}`),
        fetch("/api/admin/staff?status=active"),
      ]);
      if (cRes.ok) setCerts((await cRes.json()).data || []);
      if (sRes.ok) setStaff((await sRes.json()).data || []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  async function verify(id: number) {
    setVerifyError(null);
    try {
      const res = await fetch(`/api/admin/certifications?id=${id}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVerifyError(data.error || `Couldn't verify cert (${res.status}).`);
        return;
      }
      load();
    } catch {
      setVerifyError("Network error. Try again.");
    }
  }

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Certifications
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            CPR, ref certs, background checks, W-4/I-9.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex border border-border rounded-md overflow-hidden">
            {(["all", "expiring", "expired"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm ${filter === f ? "bg-navy text-white" : "bg-white text-text-secondary hover:text-navy"}`}>
                {f === "expiring" ? "Expiring 30d" : f === "expired" ? "Expired" : "All"}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {verifyError && (
        <div className="bg-red/5 border border-red/30 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
          <p className="text-navy text-sm font-semibold">{verifyError}</p>
          <button onClick={() => setVerifyError(null)} className="text-xs text-text-secondary hover:text-navy">Dismiss</button>
        </div>
      )}

      {loading ? (
        <SkeletonRows count={5} />
      ) : certs.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <IdCard className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No certifications in this view.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-off-white border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Doc</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((c) => {
                const days = daysUntil(c.expiresAt);
                const expired = days !== null && days < 0;
                const expiring = days !== null && days >= 0 && days <= 30;
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-off-white/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy">{c.name || `User #${c.userId}`}</div>
                      {c.email && <div className="text-xs text-text-secondary">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-navy">{TYPE_LABELS[c.type] || c.type}</div>
                      {c.label && <div className="text-xs text-text-secondary">{c.label}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{fmtDate(c.issuedAt)}</td>
                    <td className="px-4 py-3">
                      <div className={`text-xs ${expired ? "text-red font-semibold" : expiring ? "text-amber-700 font-semibold" : "text-text-secondary"}`}>
                        {fmtDate(c.expiresAt)}
                      </div>
                      {days !== null && (
                        <div className="text-[10px] text-text-secondary">
                          {expired ? `${-days}d overdue` : `${days}d left`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.verifiedAt ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> {fmtDate(c.verifiedAt)}
                        </span>
                      ) : (
                        <button onClick={() => verify(c.id)} className="text-xs text-navy hover:text-red underline">
                          Verify
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.documentUrl ? (
                        <a href={c.documentUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-navy hover:text-red">
                          <ExternalLink className="w-3 h-3" /> PDF
                        </a>
                      ) : <span className="text-text-secondary text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditing(c)} className="text-xs text-navy hover:text-red">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(showCreate || editing) && (
        <CertModal cert={editing} staff={staff} onClose={() => { setShowCreate(false); setEditing(null); }} onSaved={() => { setShowCreate(false); setEditing(null); load(); }} />
      )}
    </div>
  );
}

function CertModal({
  cert, staff, onClose, onSaved,
}: { cert: Cert | null; staff: StaffLite[]; onClose: () => void; onSaved: () => void; }) {
  const isEdit = !!cert;
  const [form, setForm] = useState({
    userId: cert?.userId ? String(cert.userId) : (staff[0]?.userId ? String(staff[0].userId) : ""),
    type: cert?.type ?? "cpr",
    label: cert?.label ?? "",
    issuedAt: cert?.issuedAt?.slice(0, 10) ?? "",
    expiresAt: cert?.expiresAt?.slice(0, 10) ?? "",
    documentUrl: cert?.documentUrl ?? "",
    notes: cert?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const body: Record<string, unknown> = {
        userId: Number(form.userId),
        type: form.type,
        label: form.label || null,
        issuedAt: form.issuedAt ? new Date(form.issuedAt + "T00:00:00").toISOString() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt + "T00:00:00").toISOString() : null,
        documentUrl: form.documentUrl || null,
        notes: form.notes || null,
      };
      const res = isEdit
        ? await fetch("/api/admin/certifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cert!.id, ...body }) })
        : await fetch("/api/admin/certifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? "Edit Certification" : "New Certification"}</h2>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Worker</span>
            <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
              {staff.map((s) => <option key={s.userId} value={s.userId}>{s.name || `User #${s.userId}`}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Type</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Label</span>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Red Cross CPR — 2026" className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Issued</span>
              <input type="date" value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Expires</span>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Document URL (Drive / S3)</span>
            <input type="url" value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
          </label>
          {err && <div className="text-red text-xs">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-navy text-white rounded-md text-sm hover:bg-navy/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
