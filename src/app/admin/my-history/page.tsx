"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { History, Loader2, Clock, DollarSign } from "lucide-react";

type ShiftRow = {
  date: string;
  name: string;
  hoursWorked: string;
  event: string;
  notes: string;
  amount: string;
};

export default function MyHistoryPage() {
  const { data: session } = useSession();
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const role = session?.user?.role;

  useEffect(() => {
    if (!session?.user?.name) return;

    // Fetch from the appropriate sheet based on role
    const sheetType = role === "ref" ? "ref" : "staff";
    fetch(`/api/admin/my-history?type=${sheetType}&name=${encodeURIComponent(session.user.name)}`)
      .then((r) => r.json())
      .then((data) => setShifts(data.shifts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, role]);

  const totalHours = shifts.reduce((sum, s) => sum + (parseFloat(s.hoursWorked) || 0), 0);
  const totalPay = shifts.reduce((sum, s) => sum + (parseFloat(s.amount.replace(/[$,]/g, "")) || 0), 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
          My Work History
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {role === "ref" ? "Ref Check-Out" : "Staff Check-Out"} records for {session?.user?.name}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
        <div className="bg-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider mb-2">
            <History className="w-3.5 h-3.5" /> Total Shifts
          </div>
          <p className="text-white text-2xl font-bold">{shifts.length}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" /> Total Hours
          </div>
          <p className="text-white text-2xl font-bold">{totalHours.toFixed(1)}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider mb-2">
            <DollarSign className="w-3.5 h-3.5" /> Total Earned
          </div>
          <p className="text-white text-2xl font-bold">${totalPay.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider mb-2">
            <DollarSign className="w-3.5 h-3.5" /> Avg / Shift
          </div>
          <p className="text-white text-2xl font-bold">
            {shifts.length > 0 ? `$${(totalPay / shifts.length).toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      {/* Shift table */}
      <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <History className="w-4 h-4 text-red" />
          <h2 className="text-white font-bold text-sm uppercase tracking-wider">Shift History</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading history...
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <History className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No shifts found. Your check-out records will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Date</th>
                  <th className="text-left px-6 py-3 font-semibold">Event</th>
                  <th className="text-center px-6 py-3 font-semibold">Hours</th>
                  <th className="text-right px-6 py-3 font-semibold">Amount</th>
                  <th className="text-left px-6 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3 text-white">{s.date}</td>
                    <td className="px-6 py-3 text-text-secondary">{s.event || "—"}</td>
                    <td className="px-6 py-3 text-center text-white tabular-nums">{s.hoursWorked || "—"}</td>
                    <td className="px-6 py-3 text-right text-emerald-400 tabular-nums">{s.amount || "—"}</td>
                    <td className="px-6 py-3 text-text-secondary text-xs">{s.notes || "—"}</td>
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
