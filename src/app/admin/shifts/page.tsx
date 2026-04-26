"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Calendar, Plus, Users, Clock, AlertCircle, X, Check } from "lucide-react";
import { SkeletonRows } from "@/components/ui/SkeletonCard";

type Assignment = {
  assignmentId: number;
  userId: number;
  name: string | null;
  status: "assigned" | "confirmed" | "declined" | "no_show" | "completed";
};

type Shift = {
  id: number;
  title: string;
  role: string | null;
  startAt: string;
  endAt: string;
  courts: string | null;
  requiredHeadcount: number;
  notes: string | null;
  status: "draft" | "published" | "cancelled" | "completed";
  tournamentId: number | null;
  assignedCount: number;
  isOpen: boolean;
  assignments: Assignment[];
};

type StaffRow = {
  userId: number;
  name: string | null;
  roleTags: string;
};

const ASSIGNMENT_STYLES: Record<string, string> = {
  assigned: "bg-navy/10 text-navy/70",
  confirmed: "bg-emerald-50 text-emerald-700",
  declined: "bg-red/10 text-red",
  no_show: "bg-red/10 text-red",
  completed: "bg-cyan-50 text-cyan-700",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-navy/10 text-navy/70",
  published: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red/10 text-red",
  completed: "bg-cyan-50 text-cyan-700",
};

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Format for a <input type="datetime-local"> value: strip seconds + Z.
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (!isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ShiftsPage() {
  const { data: session, status } = useSession();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [assigning, setAssigning] = useState<Shift | null>(null);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shifts");
      if (res.ok) setShifts((await res.json()).data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    const res = await fetch("/api/admin/staff?status=active");
    if (res.ok) setStaffList((await res.json()).data || []);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      load();
      loadStaff();
    }
  }, [status, load, loadStaff]);

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Shifts
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Schedule work. Assign staff. Publish to the open-shift board.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90"
        >
          <Plus className="w-4 h-4" /> New Shift
        </button>
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : shifts.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Calendar className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold mb-1">No shifts in the next 30 days</p>
          <p className="text-text-secondary text-sm">
            Create a shift to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-border rounded-lg p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-navy">{s.title}</h3>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}
                    >
                      {s.status}
                    </span>
                    {s.role && (
                      <span className="text-xs text-text-secondary">
                        {s.role}
                      </span>
                    )}
                    {s.isOpen && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 rounded px-2 py-0.5 text-xs font-medium">
                        <AlertCircle className="w-3 h-3" /> understaffed
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    <Clock className="inline w-3.5 h-3.5 mr-1" />
                    {fmtTime(s.startAt)} → {fmtTime(s.endAt)}
                    {s.courts ? ` · Courts ${s.courts}` : ""}
                  </div>
                  <div className="text-sm mt-2">
                    <Users className="inline w-3.5 h-3.5 mr-1 text-text-secondary" />
                    <span className="font-mono">
                      {s.assignedCount}/{s.requiredHeadcount}
                    </span>{" "}
                    assigned
                    {s.assignments.length > 0 && (
                      <span className="ml-2 text-xs text-text-secondary">
                        {s.assignments
                          .map((a) => a.name || `#${a.userId}`)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setAssigning(s)}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded px-2 py-1 hover:bg-emerald-100"
                  >
                    <Users className="w-3 h-3" /> Assign
                  </button>
                  <button
                    onClick={() => setEditing(s)}
                    className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-navy border border-border rounded px-2 py-1"
                  >
                    Edit
                  </button>
                  {s.status === "draft" && (
                    <button
                      onClick={async () => {
                        await fetch("/api/admin/shifts", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: s.id, status: "published" }),
                        });
                        load();
                      }}
                      className="inline-flex items-center gap-1 text-xs bg-navy text-white rounded px-2 py-1 hover:bg-navy/90"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <ShiftFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
      {editing && (
        <ShiftFormModal
          shift={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {assigning && (
        <AssignModal
          shift={assigning}
          staffList={staffList}
          onClose={() => setAssigning(null)}
          onSaved={() => {
            setAssigning(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ShiftFormModal({
  shift,
  onClose,
  onSaved,
}: {
  shift?: Shift;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: shift?.title ?? "",
    role: shift?.role ?? "",
    startAt: shift ? toLocalInput(shift.startAt) : "",
    endAt: shift ? toLocalInput(shift.endAt) : "",
    courts: shift?.courts ?? "",
    requiredHeadcount: shift?.requiredHeadcount ?? 1,
    notes: shift?.notes ?? "",
    status: shift?.status ?? ("draft" as const),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        role: form.role || null,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        courts: form.courts || null,
        requiredHeadcount: form.requiredHeadcount,
        notes: form.notes || null,
        status: form.status,
      };
      const res = shift
        ? await fetch("/api/admin/shifts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: shift.id, ...body }),
          })
        : await fetch("/api/admin/shifts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          j.errors
            ? Object.entries(j.errors).map(([k, v]) => `${k}: ${v}`).join("; ")
            : j.error || "Save failed"
        );
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-navy mb-4">
          {shift ? "Edit Shift" : "New Shift"}
        </h2>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Saturday Tournament — Ref Crew"
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Role</span>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="ref"
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Headcount</span>
              <input
                type="number"
                min={1}
                max={50}
                value={form.requiredHeadcount}
                onChange={(e) =>
                  setForm({ ...form, requiredHeadcount: Number(e.target.value) || 1 })
                }
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Start</span>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">End</span>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">
              Courts (comma-sep, optional)
            </span>
            <input
              value={form.courts}
              onChange={(e) => setForm({ ...form, courts: e.target.value })}
              placeholder="1,2,3"
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Shift["status"] })}
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            >
              <option value="draft">Draft (not visible to staff)</option>
              <option value="published">Published (open for claims)</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          {err && <div className="text-red text-xs">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 bg-navy text-white rounded-md text-sm hover:bg-navy/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : shift ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignModal({
  shift,
  staffList,
  onClose,
  onSaved,
}: {
  shift: Shift;
  staffList: StaffRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const alreadyIds = new Set(shift.assignments.map((a) => a.userId));
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Highlight staff whose role_tags include the shift's role — easier
  // to pick the right people quickly on a busy tournament day.
  const matchesRole = (s: StaffRow) =>
    shift.role && s.roleTags.toLowerCase().includes(shift.role.toLowerCase());
  const sorted = [...staffList].sort((a, b) => {
    const am = matchesRole(a) ? 0 : 1;
    const bm = matchesRole(b) ? 0 : 1;
    if (am !== bm) return am - bm;
    return (a.name || "").localeCompare(b.name || "");
  });

  async function assign() {
    if (selected.length === 0) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/shifts/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId: shift.id, userIds: selected }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeAssignment(assignmentId: number) {
    setErr("");
    try {
      const res = await fetch(`/api/admin/shifts/assign?id=${assignmentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || `Couldn't remove assignment (${res.status}).`);
        return;
      }
      onSaved();
    } catch {
      setErr("Network error. Try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-xl p-6">
        <h2 className="text-lg font-bold text-navy mb-1">Assign Staff</h2>
        <p className="text-sm text-text-secondary mb-4">
          {shift.title} · {fmtTime(shift.startAt)} · need {shift.requiredHeadcount}
        </p>

        {shift.assignments.length > 0 && (
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wide text-text-secondary mb-2">
              Already on this shift
            </div>
            <div className="flex flex-wrap gap-2">
              {shift.assignments.map((a) => (
                <span
                  key={a.assignmentId}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${ASSIGNMENT_STYLES[a.status]}`}
                >
                  {a.name || `#${a.userId}`}
                  <button
                    onClick={() => removeAssignment(a.assignmentId)}
                    className="hover:text-red ml-1"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs uppercase tracking-wide text-text-secondary mb-2">
          Add staff
        </div>
        <div className="max-h-72 overflow-y-auto border border-border rounded">
          {sorted
            .filter((s) => !alreadyIds.has(s.userId))
            .map((s) => {
              const checked = selected.includes(s.userId);
              return (
                <label
                  key={s.userId}
                  className="flex items-center gap-2 px-3 py-2 text-sm border-b border-border last:border-0 cursor-pointer hover:bg-off-white"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, s.userId]
                          : selected.filter((id) => id !== s.userId)
                      )
                    }
                  />
                  <span className="text-navy flex-1">{s.name || `#${s.userId}`}</span>
                  {matchesRole(s) && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 rounded px-1.5">
                      match
                    </span>
                  )}
                  <span className="text-xs text-text-secondary">{s.roleTags}</span>
                </label>
              );
            })}
          {sorted.filter((s) => !alreadyIds.has(s.userId)).length === 0 && (
            <div className="px-3 py-4 text-center text-text-secondary text-xs">
              No unassigned staff available.
            </div>
          )}
        </div>
        {err && <div className="text-red text-xs mt-3">{err}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy"
          >
            Close
          </button>
          <button
            onClick={assign}
            disabled={busy || selected.length === 0}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 inline-block mr-1" />
            Assign {selected.length > 0 ? `(${selected.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
