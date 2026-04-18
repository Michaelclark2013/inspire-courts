"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  X,
} from "lucide-react";

type Registration = {
  id: number;
  teamName: string;
  coachName: string;
  coachEmail: string;
  coachPhone: string | null;
  division: string | null;
  playerCount: number | null;
  entryFee: number | null;
  paymentStatus: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

const PAYMENT_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  paid: "bg-emerald-50 text-emerald-600",
  waived: "bg-blue-50 text-blue-600",
  refunded: "bg-gray-100 text-gray-500",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red/10 text-red",
  waitlisted: "bg-purple-50 text-purple-600",
};

export default function RegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    teamName: "",
    coachName: "",
    coachEmail: "",
    division: "",
    paymentStatus: "waived",
    notes: "",
  });

  const fetchRegs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/tournaments/${id}/registrations`);
      if (res.ok) {
        setRegs(await res.json());
        setFetchError(false);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRegs();
  }, [fetchRegs]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tournaments/${id}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create registration");
      setForm({ teamName: "", coachName: "", coachEmail: "", division: "", paymentStatus: "waived", notes: "" });
      setShowForm(false);
      fetchRegs();
    } catch {
      alert("Failed to create registration. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateReg(registrationId: number, updates: Record<string, string>) {
    await fetch(`/api/admin/tournaments/${id}/registrations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, ...updates }),
    });
    fetchRegs();
  }

  async function deleteReg(registrationId: number) {
    if (!confirm("Cancel this registration?")) return;
    await fetch(
      `/api/admin/tournaments/${id}/registrations?registrationId=${registrationId}`,
      { method: "DELETE" }
    );
    fetchRegs();
  }

  const paid = regs.filter((r) => r.paymentStatus === "paid" || r.paymentStatus === "waived").length;
  const pending = regs.filter((r) => r.paymentStatus === "pending").length;
  const approved = regs.filter((r) => r.status === "approved").length;
  const totalRevenue = regs
    .filter((r) => r.paymentStatus === "paid")
    .reduce((sum, r) => sum + (r.entryFee ?? 0), 0);

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <Link
        href={`/admin/tournaments/${id}`}
        className="text-text-secondary text-xs hover:text-navy flex items-center gap-1 mb-4 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" aria-hidden="true" /> Back to Tournament
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Registrations
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {regs.length} total registrations
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
        >
          {showForm ? <X className="w-4 h-4" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
          {showForm ? "Cancel" : "Add Walk-In"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-border shadow-sm rounded-xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Total</p>
          <p className="text-navy text-2xl font-bold font-heading">{regs.length}</p>
        </div>
        <div className="bg-white border border-border shadow-sm rounded-xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Approved</p>
          <p className="text-emerald-600 text-2xl font-bold font-heading">{approved}</p>
        </div>
        <div className="bg-white border border-border shadow-sm rounded-xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Pending Payment</p>
          <p className="text-amber-600 text-2xl font-bold font-heading">{pending}</p>
        </div>
        <div className="bg-white border border-border shadow-sm rounded-xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Revenue</p>
          <p className="text-navy text-2xl font-bold font-heading">
            ${(totalRevenue / 100).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Walk-in form */}
      {showForm && (
        <div className="bg-white border border-border shadow-sm rounded-xl p-6 mb-6">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">Add Walk-In / Comp</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              value={form.teamName}
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
              placeholder="Team name *"
              required
              className="bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
            />
            <input
              type="text"
              value={form.coachName}
              onChange={(e) => setForm({ ...form, coachName: e.target.value })}
              placeholder="Coach name *"
              required
              className="bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
            />
            <input
              type="email"
              value={form.coachEmail}
              onChange={(e) => setForm({ ...form, coachEmail: e.target.value })}
              placeholder="Coach email"
              autoComplete="email"
              className="bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
            />
            <input
              type="text"
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              placeholder="Division"
              className="bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
            />
            <select
              aria-label="Payment status"
              value={form.paymentStatus}
              onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
              className="bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
            >
              <option value="waived">Waived (Comp)</option>
              <option value="paid">Paid (Cash/Other)</option>
              <option value="pending">Pending</option>
            </select>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes"
              className="bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
            />
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className="flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
              {saving ? "Adding…" : "Add Team"}
            </button>
          </form>
        </div>
      )}

      {fetchError && !loading && (
        <div className="mb-6 bg-red/10 border border-red/20 rounded-xl p-6 text-center" role="alert">
          <p className="text-navy font-semibold text-sm mb-2">Failed to load registrations</p>
          <button
            onClick={() => { setLoading(true); setFetchError(false); fetchRegs(); }}
            className="text-red hover:text-red-hover text-xs font-bold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      )}

      {/* Registrations table */}
      <div className="bg-white border border-border shadow-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" /> Loading registrations...
          </div>
        ) : regs.length === 0 && !fetchError ? (
          <div className="text-center py-16 text-text-muted">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p className="text-sm">No registrations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Tournament registrations</caption>
              <thead>
                <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                  <th scope="col" className="text-left px-5 py-3 font-semibold">Team</th>
                  <th scope="col" className="text-left px-3 py-3 font-semibold">Coach</th>
                  <th scope="col" className="text-left px-3 py-3 font-semibold">Division</th>
                  <th scope="col" className="text-left px-3 py-3 font-semibold">Payment</th>
                  <th scope="col" className="text-left px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="text-left px-3 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {regs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-off-white">
                    <td className="px-5 py-3 text-navy font-semibold">{reg.teamName}</td>
                    <td className="px-3 py-3">
                      <div className="text-navy/70 text-xs">{reg.coachName}</div>
                      <div className="text-text-muted text-xs">{reg.coachEmail}</div>
                    </td>
                    <td className="px-3 py-3 text-text-muted text-xs">{reg.division || "—"}</td>
                    <td className="px-3 py-3">
                      <select
                        aria-label={`Payment status for ${reg.teamName}`}
                        value={reg.paymentStatus}
                        onChange={(e) => updateReg(reg.id, { paymentStatus: e.target.value })}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red min-h-[32px] ${PAYMENT_STYLES[reg.paymentStatus] || "bg-gray-100 text-gray-500"}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="waived">Waived</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        aria-label={`Registration status for ${reg.teamName}`}
                        value={reg.status}
                        onChange={(e) => updateReg(reg.id, { status: e.target.value })}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red min-h-[32px] ${STATUS_STYLES[reg.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="waitlisted">Waitlisted</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 text-text-muted text-xs whitespace-nowrap">
                      {new Date(reg.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => deleteReg(reg.id)}
                        className="text-text-muted/50 hover:text-red transition-colors"
                        title="Cancel registration"
                        aria-label="Cancel registration"
                      >
                        <XCircle className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
