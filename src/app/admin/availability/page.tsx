"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Calendar, Plus, X } from "lucide-react";

type Window = {
  id: number;
  userId: number;
  name: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  notes: string | null;
};

type StaffLite = { userId: number; name: string | null };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AvailabilityPage() {
  const { data: session, status } = useSession();
  const [windows, setWindows] = useState<Window[]>([]);
  const [staff, setStaff] = useState<StaffLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [userFilter, setUserFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userFilter) params.set("userId", userFilter);
      const [wRes, sRes] = await Promise.all([
        fetch(`/api/admin/staff-availability?${params}`),
        fetch("/api/admin/staff?status=active"),
      ]);
      if (wRes.ok) setWindows((await wRes.json()).data || []);
      if (sRes.ok) setStaff((await sRes.json()).data || []);
    } finally { setLoading(false); }
  }, [userFilter]);

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  async function remove(id: number) {
    await fetch(`/api/admin/staff-availability?id=${id}`, { method: "DELETE" });
    load();
  }

  if (status === "loading") return null;
  if (status === "unauthenticated" || session?.user?.role !== "admin") redirect("/admin/login");

  // Group by weekday for the grid view.
  const byDay: Record<number, Window[]> = {};
  for (let d = 0; d <= 6; d++) byDay[d] = [];
  for (const w of windows) byDay[w.weekday].push(w);

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Staff Availability
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Recurring weekly windows each worker is available. Used to
            suggest shift assignments.
          </p>
        </div>
        <div className="flex gap-2">
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="bg-off-white border border-border rounded-md px-3 py-1.5 text-sm">
            <option value="">All staff</option>
            {staff.map((s) => <option key={s.userId} value={s.userId}>{s.name || `User #${s.userId}`}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90">
            <Plus className="w-4 h-4" /> Add Window
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary text-sm">Loading…</div>
      ) : windows.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Calendar className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No availability set yet.</p>
          <p className="text-text-secondary text-sm mt-1">
            Add weekly windows so the scheduler knows who's free when.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {DAYS.map((label, day) => (
            <div key={day} className="bg-white border border-border rounded-lg p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-navy/70 mb-2">{label}</div>
              <div className="space-y-1.5">
                {byDay[day].length === 0 ? (
                  <div className="text-[10px] text-text-secondary italic">—</div>
                ) : (
                  byDay[day].map((w) => (
                    <div key={w.id} className="flex items-center justify-between bg-off-white rounded px-2 py-1 group">
                      <div className="text-xs min-w-0">
                        <div className="text-navy font-medium truncate">{w.name || `#${w.userId}`}</div>
                        <div className="font-mono text-text-secondary">{w.startTime}–{w.endTime}</div>
                      </div>
                      <button onClick={() => remove(w.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-red">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddModal staff={staff} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      )}
    </div>
  );
}

function AddModal({ staff, onClose, onSaved }: { staff: StaffLite[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    userId: staff[0]?.userId ? String(staff[0].userId) : "",
    weekday: "1",
    startTime: "09:00",
    endTime: "17:00",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/admin/staff-availability", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(form.userId),
          weekday: Number(form.weekday),
          startTime: form.startTime,
          endTime: form.endTime,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-navy mb-4">Add Availability Window</h2>
        <div className="space-y-3 text-sm">
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Worker</span>
            <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
              {staff.map((s) => <option key={s.userId} value={s.userId}>{s.name || `User #${s.userId}`}</option>)}
            </select></label>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Day</span>
            <select value={form.weekday} onChange={(e) => setForm({ ...form, weekday: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Start</span>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">End</span>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          </div>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Notes</span>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. only tournaments" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          {err && <div className="text-red text-xs">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-navy text-white rounded-md text-sm hover:bg-navy/90 disabled:opacity-50">
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
