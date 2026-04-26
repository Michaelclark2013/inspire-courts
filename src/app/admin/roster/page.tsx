"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserCheck, Plus, AlertTriangle, Edit, Archive, MessageSquare } from "lucide-react";
import { SkeletonRows } from "@/components/ui/SkeletonCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

// Roster row shape returned by GET /api/admin/staff.
type StaffRow = {
  userId: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  employmentClassification:
    | "w2"
    | "1099"
    | "cash_no_1099"
    | "volunteer"
    | "stipend";
  paymentMethod: string;
  payRateCents: number;
  payRateType: "hourly" | "per_shift" | "per_game" | "salary" | "stipend";
  roleTags: string;
  payoutHandle: string | null;
  hireDate: string | null;
  notes: string | null;
  status: "active" | "on_leave" | "terminated";
  ytdGrossCents: number;
  form1099: "not_applicable" | "ok" | "approaching" | "over";
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  w2: "W-2",
  "1099": "1099-NEC",
  cash_no_1099: "Cash (no 1099)",
  volunteer: "Volunteer",
  stipend: "Stipend",
};

const CLASSIFICATION_STYLES: Record<string, string> = {
  w2: "bg-emerald-50 text-emerald-700",
  "1099": "bg-cyan-50 text-cyan-700",
  cash_no_1099: "bg-amber-50 text-amber-700",
  volunteer: "bg-navy/10 text-navy/70",
  stipend: "bg-violet-50 text-violet-700",
};

const PAY_RATE_TYPE_LABELS: Record<string, string> = {
  hourly: "/ hr",
  per_shift: "/ shift",
  per_game: "/ game",
  salary: "salary",
  stipend: "stipend",
};

const FORM_1099_STYLES: Record<string, string> = {
  not_applicable: "text-text-muted",
  ok: "text-emerald-600",
  approaching: "text-amber-600",
  over: "text-red",
};

function formatCents(cents: number): string {
  if (!cents) return "$0.00";
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100).toLocaleString()}.${String(abs % 100).padStart(2, "0")}`;
}

export default function RosterPage() {
  const { data: session, status } = useSession();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"active" | "on_leave" | "terminated">(
    "active"
  );
  const [editing, setEditing] = useState<StaffRow | null>(null);
  // Termination errors — silent failure left the staffer visible and
  // active.
  const [termError, setTermError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`/api/admin/staff?status=${statusFilter}`);
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setRows(json.data || []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  if (status === "loading") return null;
  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Staff Roster
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            DB-backed roster. Pay rates, classifications, YTD totals.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-off-white border border-border rounded-md px-3 py-2 text-sm text-navy"
          >
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
          {/* Add Staff: deep-links to /admin/users where new accounts get
              created + roles assigned. Once a user with role staff/ref/
              front_desk exists + is approved, the staff_profile row is
              created from the user-detail screen. */}
          <a
            href="/admin/users?role=staff&new=1"
            className="bg-red hover:bg-red-hover text-white font-bold uppercase tracking-wider px-3 py-2 rounded-md text-sm flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
            title="Create or invite a new staff member"
          >
            + Add Staff
          </a>
        </div>
      </div>

      <ErrorBanner message={termError} onDismiss={() => setTermError(null)} />

      {loading ? (
        <SkeletonRows count={6} />
      ) : fetchError ? (
        <div className="bg-red/5 border border-red/20 rounded-lg p-4 text-red text-sm">
          Failed to load roster. Try refreshing.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <UserCheck className="w-10 h-10 text-text-secondary mx-auto mb-3" aria-hidden="true" />
          <p className="text-navy font-semibold mb-1">No staff on this list</p>
          <p className="text-text-secondary text-sm">
            Promote an existing user to staff from the user detail page, or hit the API
            directly.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-off-white border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Pay Rate</th>
                <th className="px-4 py-3">Payout</th>
                <th className="px-4 py-3">YTD Gross</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.userId}
                  className="border-b border-border last:border-0 hover:bg-off-white/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy">{r.name || `User #${r.userId}`}</div>
                    <div className="text-xs text-text-secondary">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {r.roleTags || <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                        CLASSIFICATION_STYLES[r.employmentClassification] || ""
                      }`}
                    >
                      {CLASSIFICATION_LABELS[r.employmentClassification]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-navy">
                      {formatCents(r.payRateCents)}
                    </span>{" "}
                    <span className="text-xs text-text-secondary">
                      {PAY_RATE_TYPE_LABELS[r.payRateType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="text-navy">{r.paymentMethod}</div>
                    {r.payoutHandle ? (
                      <div className="text-text-secondary">{r.payoutHandle}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className={`font-mono font-semibold ${FORM_1099_STYLES[r.form1099]}`}
                    >
                      {formatCents(r.ytdGrossCents)}
                    </div>
                    {r.form1099 === "approaching" && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="w-3 h-3" /> approaching $600
                      </div>
                    )}
                    {r.form1099 === "over" && (
                      <div className="flex items-center gap-1 text-xs text-red">
                        <AlertTriangle className="w-3 h-3" /> 1099 required
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/messages?to=${r.userId}`}
                      className="inline-flex items-center gap-1 text-navy hover:text-red text-xs mr-2"
                      title={`Message ${r.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </Link>
                    <button
                      onClick={() => setEditing(r)}
                      className="inline-flex items-center gap-1 text-navy hover:text-red text-xs mr-2"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    {r.status !== "terminated" && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Terminate ${r.name}? (soft delete — history kept)`)) return;
                          setTermError(null);
                          try {
                            const res = await fetch(`/api/admin/staff?userId=${r.userId}`, { method: "DELETE" });
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}));
                              setTermError(data.error || `Couldn't terminate (${res.status}).`);
                              return;
                            }
                            load();
                          } catch {
                            setTermError("Network error. Try again.");
                          }
                        }}
                        className="inline-flex items-center gap-1 text-text-secondary hover:text-red text-xs"
                      >
                        <Archive className="w-3.5 h-3.5" /> Term
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-xs text-text-secondary">
        <Plus className="w-3 h-3 inline-block mr-1" /> To add a new staff member:
        create/select the user first at <code className="font-mono">/admin/users</code>, then
        promote them here via the edit flow.
      </div>

      {editing && (
        <EditStaffModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EditStaffModal({
  row,
  onClose,
  onSaved,
}: {
  row: StaffRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employmentClassification: row.employmentClassification,
    paymentMethod: row.paymentMethod,
    payRateDollars: (row.payRateCents / 100).toFixed(2),
    payRateType: row.payRateType,
    roleTags: row.roleTags,
    payoutHandle: row.payoutHandle ?? "",
    status: row.status,
    notes: row.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const payRateCents = Math.round(parseFloat(form.payRateDollars || "0") * 100);
      const res = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: row.userId,
          employmentClassification: form.employmentClassification,
          paymentMethod: form.paymentMethod,
          payRateCents,
          payRateType: form.payRateType,
          roleTags: form.roleTags,
          payoutHandle: form.payoutHandle || null,
          status: form.status,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
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
          Edit: {row.name || `User #${row.userId}`}
        </h2>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Classification</span>
              <select
                value={form.employmentClassification}
                onChange={(e) =>
                  setForm({
                    ...form,
                    employmentClassification: e.target.value as StaffRow["employmentClassification"],
                  })
                }
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              >
                <option value="cash_no_1099">Cash (no 1099)</option>
                <option value="1099">1099-NEC</option>
                <option value="w2">W-2</option>
                <option value="volunteer">Volunteer</option>
                <option value="stipend">Stipend</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Payment Method</span>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              >
                <option value="venmo">Venmo</option>
                <option value="zelle">Zelle</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="paypal">PayPal</option>
                <option value="direct_deposit">Direct Deposit</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Pay Rate ($)</span>
              <input
                type="number"
                step="0.01"
                value={form.payRateDollars}
                onChange={(e) => setForm({ ...form, payRateDollars: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Rate Type</span>
              <select
                value={form.payRateType}
                onChange={(e) =>
                  setForm({ ...form, payRateType: e.target.value as StaffRow["payRateType"] })
                }
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              >
                <option value="hourly">Hourly</option>
                <option value="per_shift">Per Shift</option>
                <option value="per_game">Per Game</option>
                <option value="salary">Salary</option>
                <option value="stipend">Stipend</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Role Tags (comma-sep)</span>
            <input
              value={form.roleTags}
              onChange={(e) => setForm({ ...form, roleTags: e.target.value })}
              placeholder="ref, scorekeeper, front_desk"
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Payout Handle</span>
            <input
              value={form.payoutHandle}
              onChange={(e) => setForm({ ...form, payoutHandle: e.target.value })}
              placeholder="@jake-venmo, jake@example.com, etc."
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StaffRow["status"] })}
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            >
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
