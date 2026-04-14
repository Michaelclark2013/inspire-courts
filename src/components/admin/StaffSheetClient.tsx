"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { HorizontalBarList, BRAND, CHART_COLORS } from "@/components/dashboard/Charts";

interface StaffRow {
  name: string;
  role: string;
  hours: number;
  payMethod: string;
  rate: number;
  date: string;
  pay: number;
}

interface RefRow {
  name: string;
  games: number;
  courts: string;
  payMethod: string;
  rate: number;
  pay: number;
  date: string;
}

interface Props {
  staff: StaffRow[];
  refs: RefRow[];
  staffHoursData: { label: string; value: number }[];
  refGamesData: { label: string; value: number }[];
}

export default function StaffSheetClient({ staff, refs, staffHoursData, refGamesData }: Props) {
  const [tab, setTab] = useState<"staff" | "refs">("staff");
  const [search, setSearch] = useState("");

  const filteredStaff = staff.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase())
  );
  const filteredRefs = refs.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
            Hours Worked (Top Staff)
          </h3>
          {staffHoursData.length > 0 ? (
            <HorizontalBarList
              data={staffHoursData.map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }))}
              valueFormatter={(v) => `${v}h`}
            />
          ) : (
            <p className="text-text-secondary text-sm text-center py-8">No staff data</p>
          )}
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
            Games Officiated (Top Refs)
          </h3>
          {refGamesData.length > 0 ? (
            <HorizontalBarList
              data={refGamesData.map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }))}
              valueFormatter={(v) => `${v}g`}
            />
          ) : (
            <p className="text-text-secondary text-sm text-center py-8">No ref data</p>
          )}
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-bg-secondary border border-border rounded-sm p-1">
          {(["staff", "refs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-accent text-white" : "text-text-secondary hover:text-white"
              }`}
            >
              {t === "staff" ? `Staff (${staff.length})` : `Refs (${refs.length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full bg-bg-secondary border border-border rounded-sm pl-8 pr-3 py-2 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Staff table */}
      {tab === "staff" && (
        <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {filteredStaff.length === 0 ? (
              <p className="px-4 py-8 text-center text-text-secondary text-sm">No staff records found.</p>
            ) : (
              filteredStaff.map((s, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-white font-semibold text-sm">{s.name}</span>
                    {s.pay > 0 && <span className="text-success font-mono font-bold text-sm">${s.pay.toFixed(0)}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-bg px-2 py-0.5 rounded text-text-secondary">{s.role}</span>
                    {s.hours > 0 && <span className="text-xs text-text-secondary font-mono">{s.hours}h</span>}
                    {s.rate > 0 && <span className="text-xs text-text-secondary font-mono">${s.rate}/hr</span>}
                    <span className="text-xs bg-bg px-2 py-0.5 rounded text-text-secondary">{s.payMethod}</span>
                    <span className="text-xs text-text-secondary ml-auto">{s.date}</span>
                  </div>
                </div>
              ))
            )}
            {filteredStaff.length > 0 && (
              <div className="px-4 py-3 bg-bg/30 flex items-center justify-between">
                <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Totals</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-white text-sm">{filteredStaff.reduce((s, r) => s + r.hours, 0).toFixed(1)}h</span>
                  {(() => { const t = filteredStaff.reduce((s, r) => s + r.pay, 0); return t > 0 ? <span className="font-mono font-bold text-success text-sm">${t.toFixed(0)}</span> : null; })()}
                </div>
              </div>
            )}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Name", "Role", "Date", "Hours", "Rate", "Est. Pay", "Payment"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">No staff records found.</td>
                  </tr>
                ) : (
                  filteredStaff.map((s, i) => (
                    <tr key={i} className="hover:bg-bg/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.role}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{s.date}</td>
                      <td className="px-4 py-3 font-mono text-white font-semibold">
                        {s.hours > 0 ? `${s.hours}h` : "—"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                        {s.rate > 0 ? `$${s.rate}/hr` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-success">
                        {s.pay > 0 ? `$${s.pay.toFixed(0)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-bg px-2 py-0.5 rounded text-text-secondary">
                          {s.payMethod}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredStaff.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-bg/30">
                    <td colSpan={3} className="px-4 py-3 text-text-secondary text-xs font-bold uppercase tracking-wider">
                      Totals
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {filteredStaff.reduce((s, r) => s + r.hours, 0).toFixed(1)}h
                    </td>
                    <td />
                    <td className="px-4 py-3 font-mono font-bold text-success">
                      {(() => {
                        const total = filteredStaff.reduce((s, r) => s + r.pay, 0);
                        return total > 0 ? `$${total.toFixed(0)}` : "—";
                      })()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>{/* end hidden md:block */}
        </div>
      )}

      {/* Refs table */}
      {tab === "refs" && (
        <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {filteredRefs.length === 0 ? (
              <p className="px-4 py-8 text-center text-text-secondary text-sm">No ref records found.</p>
            ) : (
              filteredRefs.map((r, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-white font-semibold text-sm">{r.name}</span>
                    {r.pay > 0 && <span className="text-success font-mono font-bold text-sm">${r.pay.toFixed(0)}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.games > 0 && <span className="text-xs text-text-secondary font-mono">{r.games} games</span>}
                    {r.courts && <span className="text-xs text-text-secondary">{r.courts}</span>}
                    {r.rate > 0 && <span className="text-xs text-text-secondary font-mono">${r.rate}/game</span>}
                    <span className="text-xs bg-bg px-2 py-0.5 rounded text-text-secondary">{r.payMethod}</span>
                    <span className="text-xs text-text-secondary ml-auto">{r.date}</span>
                  </div>
                </div>
              ))
            )}
            {filteredRefs.length > 0 && (
              <div className="px-4 py-3 bg-bg/30 flex items-center justify-between">
                <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Totals</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-white text-sm">{filteredRefs.reduce((s, r) => s + r.games, 0)} games</span>
                  {(() => { const t = filteredRefs.reduce((s, r) => s + r.pay, 0); return t > 0 ? <span className="font-mono font-bold text-success text-sm">${t.toFixed(0)}</span> : null; })()}
                </div>
              </div>
            )}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Name", "Date", "Games", "Courts", "Rate", "Pay", "Method"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRefs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">No ref records found.</td>
                  </tr>
                ) : (
                  filteredRefs.map((r, i) => (
                    <tr key={i} className="hover:bg-bg/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{r.date}</td>
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {r.games > 0 ? r.games : "—"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{r.courts}</td>
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                        {r.rate > 0 ? `$${r.rate}/game` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-success">
                        {r.pay > 0 ? `$${r.pay.toFixed(0)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-bg px-2 py-0.5 rounded text-text-secondary">
                          {r.payMethod}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredRefs.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-bg/30">
                    <td colSpan={2} className="px-4 py-3 text-text-secondary text-xs font-bold uppercase tracking-wider">
                      Totals
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {filteredRefs.reduce((s, r) => s + r.games, 0)} games
                    </td>
                    <td colSpan={2} />
                    <td className="px-4 py-3 font-mono font-bold text-success">
                      {(() => {
                        const total = filteredRefs.reduce((s, r) => s + r.pay, 0);
                        return total > 0 ? `$${total.toFixed(0)}` : "—";
                      })()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>{/* end hidden md:block */}
        </div>
      )}
    </div>
  );
}
