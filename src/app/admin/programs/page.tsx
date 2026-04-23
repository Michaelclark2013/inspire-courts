"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Plus, Calendar , ArrowRight } from "lucide-react";

type Program = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  minAge: number | null;
  maxAge: number | null;
  capacityPerSession: number | null;
  priceCents: number | null;
  tags: string;
  active: boolean;
  nextSession: { id: number; startsAt: string; endsAt: string; status: string; location: string | null } | null;
  totalSessions: number;
};

const TYPE_STYLES: Record<string, string> = {
  camp: "bg-amber-50 text-amber-700",
  clinic: "bg-cyan-50 text-cyan-700",
  league: "bg-emerald-50 text-emerald-700",
  open_gym: "bg-navy/10 text-navy",
  private_training: "bg-violet-50 text-violet-700",
  class: "bg-red/10 text-red",
  other: "bg-navy/10 text-navy/70",
};

function fmtCents(c: number | null): string {
  if (c == null) return "—";
  return `$${(c / 100).toFixed(2)}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return iso; }
}

export default function ProgramsPage() {
  const { data: session, status } = useSession();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/admin/programs?${params}`);
      if (res.ok) setPrograms((await res.json()).data || []);
    } finally { setLoading(false); }
  }, [typeFilter]);
  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Programs & Camps
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Camps, clinics, open gym, private training, leagues, classes.
          </p>
        </div>
        <div className="flex gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-off-white border border-border rounded-md px-3 py-1.5 text-sm">
            <option value="">All types</option>
            <option value="camp">Camps</option>
            <option value="clinic">Clinics</option>
            <option value="league">Leagues</option>
            <option value="open_gym">Open Gym</option>
            <option value="private_training">Private Training</option>
            <option value="class">Classes</option>
          </select>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90">
            <Plus className="w-4 h-4" /> New Program
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary text-sm">Loading…</div>
      ) : programs.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <GraduationCap className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No active programs — create your first.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <div key={p.id} className="bg-white border border-border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-navy">{p.name}</h3>
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${TYPE_STYLES[p.type]}`}>
                  {p.type.replace("_", " ")}
                </span>
              </div>
              {p.description && <p className="text-xs text-text-secondary mb-2 line-clamp-2">{p.description}</p>}
              <div className="text-xs text-text-secondary space-y-0.5">
                {p.priceCents != null && <div>Price: <span className="font-mono text-navy">{fmtCents(p.priceCents)}</span></div>}
                {(p.minAge != null || p.maxAge != null) && (
                  <div>Ages: {p.minAge ?? "any"}–{p.maxAge ?? "any"}</div>
                )}
                {p.capacityPerSession != null && <div>Capacity: {p.capacityPerSession} / session</div>}
                <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.totalSessions} sessions</div>
                {p.nextSession && (
                  <div className="text-cyan-700">Next: {fmtDate(p.nextSession.startsAt)}</div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/admin/programs/${p.id}`} className="flex-1 inline-flex items-center justify-center gap-1 bg-navy text-white rounded-md py-1.5 text-xs hover:bg-navy/90">
                  Sessions <ArrowRight className="w-3 h-3" />
                </Link>
                <button onClick={() => setEditing(p)} className="text-xs text-text-secondary border border-border rounded-md px-2 py-1.5 hover:text-navy">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <ProgramModal program={editing} onClose={() => { setShowCreate(false); setEditing(null); }} onSaved={() => { setShowCreate(false); setEditing(null); load(); }} />
      )}
    </div>
  );
}

function ProgramModal({
  program, onClose, onSaved,
}: { program: Program | null; onClose: () => void; onSaved: () => void; }) {
  const isEdit = !!program;
  const [form, setForm] = useState({
    name: program?.name ?? "",
    type: program?.type ?? "camp",
    description: program?.description ?? "",
    minAge: program?.minAge != null ? String(program.minAge) : "",
    maxAge: program?.maxAge != null ? String(program.maxAge) : "",
    capacityPerSession: program?.capacityPerSession != null ? String(program.capacityPerSession) : "",
    priceDollars: program?.priceCents != null ? (program.priceCents / 100).toFixed(2) : "",
    tags: program?.tags ?? "",
    active: program?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  async function save() {
    setSaving(true); setErr("");
    try {
      const body: Record<string, unknown> = {
        name: form.name, type: form.type,
        description: form.description || null,
        minAge: form.minAge ? Number(form.minAge) : null,
        maxAge: form.maxAge ? Number(form.maxAge) : null,
        capacityPerSession: form.capacityPerSession ? Number(form.capacityPerSession) : null,
        priceCents: form.priceDollars ? Math.round(parseFloat(form.priceDollars) * 100) : null,
        tags: form.tags, active: form.active,
      };
      const res = isEdit
        ? await fetch("/api/admin/programs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: program!.id, ...body }) })
        : await fetch("/api/admin/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? "Edit Program" : "New Program"}</h2>
        <div className="space-y-3 text-sm">
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Type</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
              <option value="camp">Camp</option>
              <option value="clinic">Clinic</option>
              <option value="league">League</option>
              <option value="open_gym">Open Gym</option>
              <option value="private_training">Private Training</option>
              <option value="class">Class</option>
              <option value="other">Other</option>
            </select></label>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Min Age</span>
              <input type="number" value={form.minAge} onChange={(e) => setForm({ ...form, minAge: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Max Age</span>
              <input type="number" value={form.maxAge} onChange={(e) => setForm({ ...form, maxAge: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Cap</span>
              <input type="number" value={form.capacityPerSession} onChange={(e) => setForm({ ...form, capacityPerSession: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          </div>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Price ($)</span>
            <input type="number" step="0.01" value={form.priceDollars} onChange={(e) => setForm({ ...form, priceDollars: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Tags (comma-sep)</span>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="beginner, shooting" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span className="text-xs text-text-secondary">Active</span></label>
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
