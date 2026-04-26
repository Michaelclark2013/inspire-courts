"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Wrench, Plus, AlertTriangle } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SkeletonRows } from "@/components/ui/SkeletonCard";

type Ticket = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_vendor" | "resolved" | "closed";
  assignedTo: number | null;
  assignedToName: string | null;
  resourceId: number | null;
  resourceName: string | null;
  vendorName: string | null;
  costCents: number | null;
  createdAt: string;
  resolvedAt: string | null;
};

type StaffLite = { userId: number; name: string | null };

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red text-white",
  high: "bg-red/10 text-red",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-navy/10 text-navy/70",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }); }
  catch { return iso; }
}

export default function MaintenancePage() {
  useDocumentTitle("Maintenance");
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff] = useState<StaffLite[]>([]);
  const [filter, _setFilter] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (priority) params.set("priority", priority);
      const [tRes, sRes] = await Promise.all([
        fetch(`/api/admin/maintenance?${params}`),
        fetch("/api/admin/staff?status=active"),
      ]);
      if (tRes.ok) setTickets((await tRes.json()).data || []);
      if (sRes.ok) setStaff((await sRes.json()).data || []);
    } finally { setLoading(false); }
  }, [filter, priority]);

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  async function updateStatus(id: number, next: Ticket["status"]) {
    await fetch("/api/admin/maintenance", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    load();
  }

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  const byStatus = {
    open: tickets.filter((t) => t.status === "open"),
    in_progress: tickets.filter((t) => t.status === "in_progress"),
    waiting_vendor: tickets.filter((t) => t.status === "waiting_vendor"),
    resolved: tickets.filter((t) => t.status === "resolved"),
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Maintenance
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length} active tickets
          </p>
        </div>
        <div className="flex gap-2">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="bg-off-white border border-border rounded-md px-3 py-1.5 text-sm">
            <option value="">All priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : tickets.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Wrench className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No active tickets — everything&apos;s humming.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
          {(["open", "in_progress", "waiting_vendor", "resolved"] as const).map((col) => (
            <div key={col} className="bg-off-white border border-border rounded-xl p-3">
              <h2 className="text-xs uppercase tracking-wide text-text-secondary font-bold mb-3">
                {col.replace("_", " ")} ({byStatus[col].length})
              </h2>
              <div className="space-y-2">
                {byStatus[col].map((t) => (
                  <div key={t.id} className="bg-white border border-border rounded-lg p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-navy text-sm truncate">{t.title}</div>
                        {t.location && <div className="text-xs text-text-secondary">{t.location}</div>}
                      </div>
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[t.priority]} flex-shrink-0`}>
                        {t.priority === "urgent" && <AlertTriangle className="w-3 h-3 mr-0.5" />}
                        {t.priority}
                      </span>
                    </div>
                    {t.assignedToName && (
                      <div className="text-xs text-text-secondary">→ {t.assignedToName}</div>
                    )}
                    <div className="text-[10px] text-text-secondary mt-1">
                      Opened {fmtDate(t.createdAt)}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {col === "open" && (
                        <button onClick={() => updateStatus(t.id, "in_progress")} className="text-xs bg-cyan-50 text-cyan-700 rounded px-3 py-2 min-h-[36px] hover:bg-cyan-100 font-semibold">
                          Start
                        </button>
                      )}
                      {col === "in_progress" && (
                        <>
                          <button onClick={() => updateStatus(t.id, "waiting_vendor")} className="text-xs bg-violet-50 text-violet-700 rounded px-3 py-2 min-h-[36px] hover:bg-violet-100 font-semibold">
                            Vendor
                          </button>
                          <button onClick={() => updateStatus(t.id, "resolved")} className="text-xs bg-emerald-50 text-emerald-700 rounded px-3 py-2 min-h-[36px] hover:bg-emerald-100 font-semibold">
                            Resolve
                          </button>
                        </>
                      )}
                      {col === "waiting_vendor" && (
                        <button onClick={() => updateStatus(t.id, "resolved")} className="text-xs bg-emerald-50 text-emerald-700 rounded px-3 py-2 min-h-[36px] hover:bg-emerald-100 font-semibold">
                          Resolve
                        </button>
                      )}
                      {col === "resolved" && (
                        <button onClick={() => updateStatus(t.id, "closed")} className="text-xs bg-navy/10 text-navy/70 rounded px-3 py-2 min-h-[36px] hover:bg-navy/20 font-semibold">
                          Close
                        </button>
                      )}
                      <button onClick={() => setEditing(t)} className="text-xs text-text-secondary hover:text-navy ml-auto px-3 py-2 min-h-[36px]">Edit</button>
                    </div>
                  </div>
                ))}
                {byStatus[col].length === 0 && <div className="text-xs text-text-secondary italic p-2">—</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <TicketModal ticket={editing} staff={staff} onClose={() => { setShowCreate(false); setEditing(null); }} onSaved={() => { setShowCreate(false); setEditing(null); load(); }} />
      )}
    </div>
  );
}

function TicketModal({
  ticket, staff, onClose, onSaved,
}: { ticket: Ticket | null; staff: StaffLite[]; onClose: () => void; onSaved: () => void; }) {
  const isEdit = !!ticket;
  const [form, setForm] = useState({
    title: ticket?.title ?? "",
    description: ticket?.description ?? "",
    location: ticket?.location ?? "",
    priority: ticket?.priority ?? ("medium" as const),
    status: ticket?.status ?? ("open" as const),
    assignedTo: ticket?.assignedTo ? String(ticket.assignedTo) : "",
    vendorName: ticket?.vendorName ?? "",
    costDollars: ticket?.costCents != null ? (ticket.costCents / 100).toFixed(2) : "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        priority: form.priority,
        status: form.status,
        assignedTo: form.assignedTo ? Number(form.assignedTo) : null,
        vendorName: form.vendorName || null,
        costCents: form.costDollars ? Math.round(parseFloat(form.costDollars) * 100) : null,
      };
      const res = isEdit
        ? await fetch("/api/admin/maintenance", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ticket!.id, ...body }) })
        : await fetch("/api/admin/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? "Edit Ticket" : "New Ticket"}</h2>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Title</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Loose rim on Court 3" className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Location</span>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Court 3" className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Priority</span>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Ticket["priority"] })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Ticket["status"] })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_vendor">Waiting on Vendor</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Assigned To</span>
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
                <option value="">Unassigned</option>
                {staff.map((s) => <option key={s.userId} value={s.userId}>{s.name || `User #${s.userId}`}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Vendor</span>
              <input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Cost ($)</span>
              <input type="number" step="0.01" value={form.costDollars} onChange={(e) => setForm({ ...form, costDollars: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
          </div>
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
