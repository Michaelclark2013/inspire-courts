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
  pending: "bg-amber-500/20 text-amber-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  waived: "bg-blue-500/20 text-blue-400",
  refunded: "bg-white/10 text-white/40",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red/20 text-red",
  waitlisted: "bg-purple-500/20 text-purple-400",
};

export default function RegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
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
      if (res.ok) setRegs(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRegs();
  }, [fetchRegs]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/admin/tournaments/${id}/registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ teamName: "", coachName: "", coachEmail: "", division: "", paymentStatus: "waived", notes: "" });
    setShowForm(false);
    fetchRegs();
    setSaving(false);
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
    <div className="p-6 lg:p-8">
      <Link
        href={`/admin/tournaments/${id}`}
        className="text-text-secondary text-xs hover:text-white flex items-center gap-1 mb-4 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" /> Back to Tournament
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
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
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Walk-In"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Total</p>
          <p className="text-white text-2xl font-bold font-heading">{regs.length}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Approved</p>
          <p className="text-emerald-400 text-2xl font-bold font-heading">{approved}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Pending Payment</p>
          <p className="text-amber-400 text-2xl font-bold font-heading">{pending}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Revenue</p>
          <p className="text-white text-2xl font-bold font-heading">
            ${(totalRevenue / 100).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Walk-in form */}
      {showForm && (
        <div className="bg-card border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Add Walk-In / Comp</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              value={form.teamName}
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
              placeholder="Team name *"
              required
              className="bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
            />
            <input
              type="text"
              value={form.coachName}
              onChange={(e) => setForm({ ...form, coachName: e.target.value })}
              placeholder="Coach name *"
              required
              className="bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
            />
            <input
              type="email"
              value={form.coachEmail}
              onChange={(e) => setForm({ ...form, coachEmail: e.target.value })}
              placeholder="Coach email"
              className="bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
            />
            <input
              type="text"
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              placeholder="Division"
              className="bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
            />
            <select
              value={form.paymentStatus}
              onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
              className="bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
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
              className="bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
            />
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </form>
        </div>
      )}

      {/* Registrations table */}
      <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : regs.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No registrations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Team</th>
                  <th className="text-left px-3 py-3 font-semibold">Coach</th>
                  <th className="text-left px-3 py-3 font-semibold">Division</th>
                  <th className="text-left px-3 py-3 font-semibold">Payment</th>
                  <th className="text-left px-3 py-3 font-semibold">Status</th>
                  <th className="text-left px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {regs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-white font-semibold">{reg.teamName}</td>
                    <td className="px-3 py-3">
                      <div className="text-white/70 text-xs">{reg.coachName}</div>
                      <div className="text-white/40 text-xs">{reg.coachEmail}</div>
                    </td>
                    <td className="px-3 py-3 text-white/50 text-xs">{reg.division || "—"}</td>
                    <td className="px-3 py-3">
                      <select
                        value={reg.paymentStatus}
                        onChange={(e) => updateReg(reg.id, { paymentStatus: e.target.value })}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${PAYMENT_STYLES[reg.paymentStatus] || "bg-white/10 text-white/40"}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="waived">Waived</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={reg.status}
                        onChange={(e) => updateReg(reg.id, { status: e.target.value })}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_STYLES[reg.status] || "bg-white/10 text-white/40"}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="waitlisted">Waitlisted</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 text-white/30 text-xs whitespace-nowrap">
                      {new Date(reg.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => deleteReg(reg.id)}
                        className="text-white/20 hover:text-red transition-colors"
                        title="Cancel registration"
                      >
                        <XCircle className="w-4 h-4" />
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
