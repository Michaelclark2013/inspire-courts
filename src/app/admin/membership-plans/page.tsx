"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Wallet, Plus, Users, Archive, Edit } from "lucide-react";

type Plan = {
  id: number;
  name: string;
  type: "unlimited" | "single_sport" | "family" | "day_pass" | "class_pack" | "other";
  description: string | null;
  priceMonthlyCents: number | null;
  priceAnnualCents: number | null;
  priceOnceCents: number | null;
  includes: string;
  maxVisitsPerMonth: number | null;
  maxVisitsPerWeek: number | null;
  active: boolean;
  notes: string | null;
  activeMemberCount: number;
};

const TYPE_STYLES: Record<string, string> = {
  unlimited: "bg-emerald-50 text-emerald-700",
  single_sport: "bg-cyan-50 text-cyan-700",
  family: "bg-violet-50 text-violet-700",
  day_pass: "bg-amber-50 text-amber-700",
  class_pack: "bg-navy/10 text-navy",
  other: "bg-navy/10 text-navy/70",
};

function fmtCents(c: number | null): string {
  if (c == null) return "—";
  return `$${(c / 100).toFixed(2)}`;
}

export default function MembershipPlansPage() {
  const { data: session, status } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/membership-plans");
      if (res.ok) setPlans((await res.json()).data || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  if (status === "loading") return null;
  if (status === "unauthenticated" || session?.user?.role !== "admin") redirect("/admin/login");

  const visible = plans.filter((p) => showArchived || p.active);
  const totalMembers = plans.reduce((sum, p) => sum + p.activeMemberCount, 0);
  const mrrCents = plans
    .filter((p) => p.active)
    .reduce((sum, p) => {
      const monthly = p.priceMonthlyCents
        ? p.priceMonthlyCents * p.activeMemberCount
        : p.priceAnnualCents
          ? Math.round((p.priceAnnualCents / 12) * p.activeMemberCount)
          : 0;
      return sum + monthly;
    }, 0);

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Membership Plans
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {totalMembers} members across {plans.filter((p) => p.active).length} active plans · MRR {fmtCents(mrrCents)}
          </p>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-1.5 text-sm text-navy">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90">
            <Plus className="w-4 h-4" /> New Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary text-sm">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Wallet className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No plans yet — create one to start selling memberships.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <div key={p.id} className={`border rounded-xl p-4 shadow-sm ${p.active ? "bg-white border-border" : "bg-off-white border-border opacity-70"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-navy">{p.name}</h3>
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${TYPE_STYLES[p.type]}`}>
                  {p.type.replace("_", " ")}
                </span>
              </div>
              {p.description && <p className="text-xs text-text-secondary mb-2 line-clamp-2">{p.description}</p>}
              <div className="text-sm space-y-0.5 mb-2">
                {p.priceMonthlyCents != null && (
                  <div><span className="font-mono font-semibold text-navy">{fmtCents(p.priceMonthlyCents)}</span><span className="text-text-secondary">/month</span></div>
                )}
                {p.priceAnnualCents != null && (
                  <div><span className="font-mono text-navy">{fmtCents(p.priceAnnualCents)}</span><span className="text-text-secondary">/year</span></div>
                )}
                {p.priceOnceCents != null && (
                  <div><span className="font-mono text-navy">{fmtCents(p.priceOnceCents)}</span><span className="text-text-secondary"> once</span></div>
                )}
              </div>
              <div className="text-xs text-text-secondary space-y-0.5">
                <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.activeMemberCount} active</div>
                {(p.maxVisitsPerWeek || p.maxVisitsPerMonth) && (
                  <div>
                    Visits: {p.maxVisitsPerWeek ? `${p.maxVisitsPerWeek}/wk` : ""}{p.maxVisitsPerWeek && p.maxVisitsPerMonth ? " · " : ""}{p.maxVisitsPerMonth ? `${p.maxVisitsPerMonth}/mo` : ""}
                  </div>
                )}
                {p.includes && <div className="truncate">Includes: {p.includes}</div>}
              </div>
              <div className="mt-3 flex gap-1">
                <button onClick={() => setEditing(p)}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-xs border border-border rounded-md py-1.5 hover:bg-off-white text-navy">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                {p.active && (
                  <button onClick={async () => {
                    if (!confirm(`Archive "${p.name}"? Existing members stay on it but no new signups.`)) return;
                    await fetch(`/api/admin/membership-plans?id=${p.id}`, { method: "DELETE" });
                    load();
                  }} className="text-xs text-text-secondary hover:text-red border border-border rounded-md px-2 py-1.5">
                    <Archive className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <PlanModal plan={editing} onClose={() => { setShowCreate(false); setEditing(null); }}
          onSaved={() => { setShowCreate(false); setEditing(null); load(); }} />
      )}
    </div>
  );
}

function PlanModal({ plan, onClose, onSaved }: { plan: Plan | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!plan;
  const [form, setForm] = useState({
    name: plan?.name ?? "",
    type: plan?.type ?? "unlimited" as Plan["type"],
    description: plan?.description ?? "",
    monthly: plan?.priceMonthlyCents != null ? (plan.priceMonthlyCents / 100).toFixed(2) : "",
    annual: plan?.priceAnnualCents != null ? (plan.priceAnnualCents / 100).toFixed(2) : "",
    once: plan?.priceOnceCents != null ? (plan.priceOnceCents / 100).toFixed(2) : "",
    includes: plan?.includes ?? "",
    maxVisitsPerWeek: plan?.maxVisitsPerWeek != null ? String(plan.maxVisitsPerWeek) : "",
    maxVisitsPerMonth: plan?.maxVisitsPerMonth != null ? String(plan.maxVisitsPerMonth) : "",
    active: plan?.active ?? true,
    notes: plan?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const body: Record<string, unknown> = {
        name: form.name, type: form.type,
        description: form.description || null,
        priceMonthlyCents: form.monthly ? Math.round(parseFloat(form.monthly) * 100) : null,
        priceAnnualCents: form.annual ? Math.round(parseFloat(form.annual) * 100) : null,
        priceOnceCents: form.once ? Math.round(parseFloat(form.once) * 100) : null,
        includes: form.includes,
        maxVisitsPerWeek: form.maxVisitsPerWeek ? Number(form.maxVisitsPerWeek) : null,
        maxVisitsPerMonth: form.maxVisitsPerMonth ? Number(form.maxVisitsPerMonth) : null,
        active: form.active, notes: form.notes || null,
      };
      const res = isEdit
        ? await fetch("/api/admin/membership-plans", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: plan!.id, ...body }) })
        : await fetch("/api/admin/membership-plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? "Edit Plan" : "New Plan"}</h2>
        <div className="space-y-3 text-sm">
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Unlimited Monthly" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Type</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Plan["type"] })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
              <option value="unlimited">Unlimited</option>
              <option value="single_sport">Single Sport</option>
              <option value="family">Family</option>
              <option value="day_pass">Day Pass</option>
              <option value="class_pack">Class Pack</option>
              <option value="other">Other</option>
            </select></label>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Monthly $</span>
              <input type="number" step="0.01" value={form.monthly} onChange={(e) => setForm({ ...form, monthly: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Annual $</span>
              <input type="number" step="0.01" value={form.annual} onChange={(e) => setForm({ ...form, annual: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Once $</span>
              <input type="number" step="0.01" value={form.once} onChange={(e) => setForm({ ...form, once: e.target.value })} placeholder="day pass" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Max visits / week</span>
              <input type="number" value={form.maxVisitsPerWeek} onChange={(e) => setForm({ ...form, maxVisitsPerWeek: e.target.value })} placeholder="unlimited" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Max visits / month</span>
              <input type="number" value={form.maxVisitsPerMonth} onChange={(e) => setForm({ ...form, maxVisitsPerMonth: e.target.value })} placeholder="unlimited" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          </div>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Includes (comma-sep tags)</span>
            <input value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} placeholder="open_gym, classes, pool" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span className="text-xs text-text-secondary">Active (accepts new signups)</span></label>
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
