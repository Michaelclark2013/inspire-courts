"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { History, Loader2, Clock, DollarSign, Search } from "lucide-react";

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
  const [search, setSearch] = useState("");
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

  const filteredShifts = useMemo(() => {
    if (!search) return shifts;
    const q = search.toLowerCase();
    return shifts.filter(
      (s) =>
        s.event.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q) ||
        s.date.toLowerCase().includes(q)
    );
  }, [shifts, search]);

  const totalHours = shifts.reduce((sum, s) => sum + (parseFloat(s.hoursWorked) || 0), 0);
  const totalPay = shifts.reduce((sum, s) => sum + (parseFloat(s.amount.replace(/[$,]/g, "")) || 0), 0);

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
          My Work History
        </h1>
        <p className="text-text-secondary text-sm mt-1 hidden md:block">
          {role === "ref" ? "Ref Check-Out" : "Staff Check-Out"} records for {session?.user?.name}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-4 md:mb-8">
        <div className="bg-white border border-border rounded-xl p-3 md:p-5">
          <div className="flex items-center gap-1.5 text-navy/50 text-[10px] uppercase tracking-wider mb-1.5">
            <History className="w-3 h-3" /> Shifts
          </div>
          <p className="text-navy text-xl md:text-2xl font-bold">{shifts.length}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-3 md:p-5">
          <div className="flex items-center gap-1.5 text-navy/50 text-[10px] uppercase tracking-wider mb-1.5">
            <Clock className="w-3 h-3" /> Hours
          </div>
          <p className="text-navy text-xl md:text-2xl font-bold">{totalHours.toFixed(1)}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-3 md:p-5">
          <div className="flex items-center gap-1.5 text-navy/50 text-[10px] uppercase tracking-wider mb-1.5">
            <DollarSign className="w-3 h-3" /> Earned
          </div>
          <p className="text-navy text-xl md:text-2xl font-bold">${totalPay.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-3 md:p-5">
          <div className="flex items-center gap-1.5 text-navy/50 text-[10px] uppercase tracking-wider mb-1.5">
            <DollarSign className="w-3 h-3" /> Avg
          </div>
          <p className="text-navy text-xl md:text-2xl font-bold">
            {shifts.length > 0 ? `$${(totalPay / shifts.length).toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      {/* Shift table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <History className="w-4 h-4 text-red flex-shrink-0" />
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider flex-1">Shift History</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events or notes..."
              className="bg-off-white border border-border rounded-lg pl-8 pr-3 py-1.5 text-navy text-xs focus:outline-none focus:border-red placeholder:text-navy/25 w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 md:py-16 text-navy/40">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading history...
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-16 text-navy/40">
            <History className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No shifts found. Your check-out records will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-navy/50 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Date</th>
                  <th className="text-left px-6 py-3 font-semibold">Event</th>
                  <th className="text-center px-6 py-3 font-semibold">Hours</th>
                  <th className="text-right px-6 py-3 font-semibold">Amount</th>
                  <th className="text-left px-6 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-navy/40 text-sm">
                      No shifts match &ldquo;{search}&rdquo;
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((s, i) => (
                    <tr key={i} className="border-b border-border hover:bg-off-white transition-colors">
                      <td className="px-6 py-3 text-navy">{s.date}</td>
                      <td className="px-6 py-3 text-text-secondary">{s.event || "—"}</td>
                      <td className="px-6 py-3 text-center text-navy tabular-nums">{s.hoursWorked || "—"}</td>
                      <td className="px-6 py-3 text-right text-emerald-400 tabular-nums">{s.amount || "—"}</td>
                      <td className="px-6 py-3 text-text-secondary text-xs">{s.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
