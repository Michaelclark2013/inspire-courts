"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import {
  Wallet,
  Plus,
  Lock,
  CheckCircle2,
  Download,
  Unlock,
  AlertCircle,
} from "lucide-react";

type PayPeriod = {
  id: number;
  label: string;
  startsAt: string;
  endsAt: string;
  status: "open" | "locked" | "paid";
  lockedBy: number | null;
  lockedAt: string | null;
  paidAt: string | null;
  notes: string | null;
};

type PayrollLine = {
  userId: number;
  name: string | null;
  email: string | null;
  classification: string;
  paymentMethod: string;
  payoutHandle: string | null;
  totalMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  regularCents: number;
  overtimeCents: number;
  bonusCents: number;
  flatPayCents: number;
  grossCents: number;
  entryCount: number;
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700",
  locked: "bg-amber-50 text-amber-700",
  paid: "bg-cyan-50 text-cyan-700",
};

function fmtCents(c: number): string {
  return `$${Math.floor(c / 100).toLocaleString()}.${String(c % 100).padStart(2, "0")}`;
}

function fmtHours(mins: number): string {
  return (mins / 60).toFixed(2);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function PayrollPage() {
  const { data: session, status } = useSession();
  const sp = useSearchParams();
  const preselectId = Number(sp.get("id")) || null;
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(preselectId);
  const [rollup, setRollup] = useState<{
    period: PayPeriod;
    lines: PayrollLine[];
    totalCents: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const loadPeriods = useCallback(async () => {
    const res = await fetch("/api/admin/payroll");
    if (res.ok) {
      const json = await res.json();
      setPeriods(json.data || []);
      if (!selectedId && json.data?.length > 0) {
        setSelectedId(json.data[0].id);
      }
    }
  }, [selectedId]);

  const loadRollup = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payroll?id=${id}`);
      if (res.ok) setRollup(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadPeriods();
  }, [status, loadPeriods]);
  useEffect(() => {
    if (selectedId) loadRollup(selectedId);
    else setLoading(false);
  }, [selectedId, loadRollup]);

  async function transition(id: number, target: "locked" | "paid") {
    if (target === "locked" && !confirm("Lock this pay period? Time entries inside it can't be edited afterward.")) return;
    if (target === "paid" && !confirm("Mark this period as paid? This is a final sign-off.")) return;
    setBusy(true);
    try {
      await fetch("/api/admin/payroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: target }),
      });
      await loadPeriods();
      await loadRollup(id);
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return null;
  if (status === "unauthenticated" || session?.user?.role !== "admin") redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Payroll
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Pay-period rollups. Hours × rate + overtime (W2 only) + bonuses.
            Export to Gusto / QuickBooks.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90"
        >
          <Plus className="w-4 h-4" /> New Period
        </button>
      </div>

      {periods.length === 0 && !loading ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Wallet className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold mb-1">No pay periods yet</p>
          <p className="text-text-secondary text-sm">
            Create a pay period (e.g. biweekly Apr 1 → Apr 14) to see a roll-up
            of approved time entries in that window.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* PERIOD SIDEBAR */}
          <div>
            <h2 className="text-xs uppercase tracking-wide text-text-secondary font-bold mb-2">
              Periods
            </h2>
            <ul className="space-y-1">
              {periods.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border ${
                      selectedId === p.id
                        ? "bg-navy/5 border-navy/30"
                        : "bg-white border-border hover:border-navy/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-navy text-sm">
                        {p.label}
                      </span>
                      <span
                        className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${STATUS_STYLES[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {fmtDate(p.startsAt)} → {fmtDate(p.endsAt)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ROLLUP PANEL */}
          <div>
            {loading ? (
              <div className="text-text-secondary text-sm">Loading rollup…</div>
            ) : !rollup ? (
              <div className="text-text-secondary text-sm">
                Select a period to see the rollup.
              </div>
            ) : (
              <div className="space-y-4">
                {/* PERIOD HEADER */}
                <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-navy">
                      {rollup.period.label}
                    </h2>
                    <p className="text-sm text-text-secondary">
                      {fmtDate(rollup.period.startsAt)} →{" "}
                      {fmtDate(rollup.period.endsAt)} ·{" "}
                      {rollup.lines.length} workers ·{" "}
                      <span className="font-mono font-semibold text-navy">
                        {fmtCents(rollup.totalCents)}
                      </span>{" "}
                      gross
                    </p>
                    {rollup.period.lockedAt && (
                      <p className="text-xs text-text-secondary mt-1">
                        Locked {fmtDate(rollup.period.lockedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/admin/payroll?id=${rollup.period.id}&format=csv`}
                      className="inline-flex items-center gap-1 text-xs border border-border bg-white rounded-md px-2 py-1.5 text-navy hover:bg-off-white"
                    >
                      <Download className="w-3 h-3" /> Generic CSV
                    </a>
                    <a
                      href={`/api/admin/payroll?id=${rollup.period.id}&format=gusto`}
                      className="inline-flex items-center gap-1 text-xs border border-border bg-white rounded-md px-2 py-1.5 text-navy hover:bg-off-white"
                    >
                      <Download className="w-3 h-3" /> Gusto
                    </a>
                    <a
                      href={`/api/admin/payroll?id=${rollup.period.id}&format=quickbooks`}
                      className="inline-flex items-center gap-1 text-xs border border-border bg-white rounded-md px-2 py-1.5 text-navy hover:bg-off-white"
                    >
                      <Download className="w-3 h-3" /> QuickBooks
                    </a>
                    {rollup.period.status === "open" && (
                      <button
                        onClick={() => transition(rollup.period.id, "locked")}
                        disabled={busy}
                        className="inline-flex items-center gap-1 text-xs bg-amber-600 text-white rounded-md px-3 py-1.5 hover:bg-amber-700 disabled:opacity-50"
                      >
                        <Lock className="w-3 h-3" /> Lock
                      </button>
                    )}
                    {rollup.period.status === "locked" && (
                      <button
                        onClick={() => transition(rollup.period.id, "paid")}
                        disabled={busy}
                        className="inline-flex items-center gap-1 text-xs bg-emerald-600 text-white rounded-md px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark Paid
                      </button>
                    )}
                  </div>
                </div>

                {rollup.period.status !== "open" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-sm flex items-start gap-2">
                    {rollup.period.status === "paid" ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      Period is <strong>{rollup.period.status}</strong>. Time
                      entries inside this window can no longer be edited.
                    </div>
                  </div>
                )}

                {/* ROLLUP TABLE */}
                {rollup.lines.length === 0 ? (
                  <div className="bg-off-white border border-border rounded-xl p-8 text-center">
                    <AlertCircle className="w-8 h-8 text-text-secondary mx-auto mb-3" />
                    <p className="text-navy font-semibold mb-1">
                      No approved entries in this window
                    </p>
                    <p className="text-text-secondary text-sm">
                      Approve pending time entries in{" "}
                      <a href="/admin/timeclock" className="underline">
                        Time Clock
                      </a>{" "}
                      to populate the rollup.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white border border-border rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-off-white border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary">
                        <tr>
                          <th className="px-3 py-2">Worker</th>
                          <th className="px-3 py-2">Class.</th>
                          <th className="px-3 py-2">Reg Hrs</th>
                          <th className="px-3 py-2">OT Hrs</th>
                          <th className="px-3 py-2">Reg Pay</th>
                          <th className="px-3 py-2">OT Pay</th>
                          <th className="px-3 py-2">Bonus</th>
                          <th className="px-3 py-2">Flat</th>
                          <th className="px-3 py-2">Gross</th>
                          <th className="px-3 py-2">Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rollup.lines.map((l) => (
                          <tr
                            key={l.userId}
                            className="border-b border-border last:border-0 hover:bg-off-white/50"
                          >
                            <td className="px-3 py-2">
                              <div className="font-medium text-navy">
                                {l.name || `User #${l.userId}`}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {l.email}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {l.classification.replace("_", " ")}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {fmtHours(l.regularMinutes)}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {l.overtimeMinutes > 0 ? fmtHours(l.overtimeMinutes) : "—"}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {fmtCents(l.regularCents)}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {l.overtimeCents > 0 ? fmtCents(l.overtimeCents) : "—"}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {l.bonusCents > 0 ? fmtCents(l.bonusCents) : "—"}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {l.flatPayCents > 0 ? fmtCents(l.flatPayCents) : "—"}
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-navy">
                              {fmtCents(l.grossCents)}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              <div>{l.paymentMethod}</div>
                              {l.payoutHandle && (
                                <div className="text-text-secondary">{l.payoutHandle}</div>
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-off-white font-semibold">
                          <td colSpan={8} className="px-3 py-2 text-right text-navy">
                            Total
                          </td>
                          <td className="px-3 py-2 font-mono text-navy">
                            {fmtCents(rollup.totalCents)}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <PayPeriodCreateModal
          onClose={() => setShowCreate(false)}
          onSaved={(id) => {
            setShowCreate(false);
            setSelectedId(id);
            loadPeriods();
          }}
        />
      )}
    </div>
  );
}

function PayPeriodCreateModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (id: number) => void;
}) {
  const today = new Date();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const [form, setForm] = useState({
    label: `Biweekly ${fmt(fourteenDaysAgo)} — ${fmt(today)}`,
    startsAt: fmt(fourteenDaysAgo),
    endsAt: fmt(today),
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          startsAt: new Date(form.startsAt + "T00:00:00").toISOString(),
          endsAt: new Date(form.endsAt + "T23:59:59").toISOString(),
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      const created = await res.json();
      onSaved(created.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-navy mb-4">New Pay Period</h2>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Label</span>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Start Date</span>
              <input
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">End Date</span>
              <input
                type="date"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
          </div>
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
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
