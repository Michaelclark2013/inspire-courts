"use client";

import { useState } from "react";
import { Search, Users, Flame, Phone, Mail, Download, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchHighlight from "@/components/ui/SearchHighlight";

interface Team {
  teamName: string;
  coach: string;
  phone: string;
  age: string;
  gender: string;
  status: string;
  outreach: string;
  source: string;
}

const STATUS_COLORS: Record<string, string> = {
  Hot: "bg-red/10 text-red border-red/20",
  Warm: "bg-amber-50 text-amber-600 border-amber-200",
  Cold: "bg-blue-50 text-blue-600 border-blue-200",
  Registered: "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Not Contacted": "bg-slate-50 text-slate-500 border-slate-200",
};

function downloadCSV(rows: Team[], filename: string) {
  const headers = ["Team Name", "Coach", "Phone", "Age", "Gender", "Status", "Outreach", "Source"];
  const lines = [
    headers.join(","),
    ...rows.map((t) =>
      [t.teamName, t.coach, t.phone, t.age, t.gender, t.status, t.outreach, t.source]
        .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TeamsClient({ teams }: { teams: Team[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  function toggleRow(i: number) {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIndices.size === filtered.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(filtered.map((_, i) => i)));
    }
  }

  const statuses = ["All", ...new Set(teams.map((t) => t.status))];
  const ages = ["All", ...new Set(teams.map((t) => t.age).sort())];

  const filtered = teams.filter((t) => {
    const matchSearch = t.teamName.toLowerCase().includes(search.toLowerCase()) || t.coach.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchAge = ageFilter === "All" || t.age === ageFilter;
    return matchSearch && matchStatus && matchAge;
  });

  const hotCount = teams.filter((t) => t.status === "Hot").length;
  const warmCount = teams.filter((t) => t.status === "Warm").length;
  const registeredCount = teams.filter((t) => t.status === "Registered").length;

  return (
    <>
      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total</span>
            <Users className="w-4 h-4 text-text-secondary" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-navy">{teams.length}</p>
        </div>
        <div className="bg-bg-secondary border border-red/20 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red text-xs font-bold uppercase tracking-wider">Hot</span>
            <Flame className="w-4 h-4 text-red" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-red">{hotCount}</p>
        </div>
        <div className="bg-bg-secondary border border-amber-200 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">Warm</span>
            <Phone className="w-4 h-4 text-amber-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{warmCount}</p>
        </div>
        <div className="bg-bg-secondary border border-emerald-200 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Registered</span>
            <Mail className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{registeredCount}</p>
        </div>
      </div>

      {/* Filters + CSV export */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams or coaches..."
            className="w-full bg-bg border border-border rounded-sm pl-10 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent transition-colors placeholder:text-text-secondary/50"
          />
        </div>
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-bg border border-border rounded-sm px-3 py-2.5 min-h-[44px] text-navy text-sm focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent">
          {statuses.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
        </select>
        <select aria-label="Filter by age group" value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} className="bg-bg border border-border rounded-sm px-3 py-2.5 min-h-[44px] text-navy text-sm focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent">
          {ages.map((a) => <option key={a} value={a}>{a === "All" ? "All Ages" : a}</option>)}
        </select>
        <button
          onClick={() => downloadCSV(filtered, "teams.csv")}
          title="Download all filtered (CSV)"
          className="flex items-center gap-2 bg-bg border border-border rounded-sm px-3 py-2.5 text-text-secondary hover:text-navy hover:border-accent/50 text-sm transition-colors flex-shrink-0"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">CSV</span>
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIndices.size > 0 && (
        <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-sm px-4 py-2.5 mb-3">
          <span className="text-accent text-sm font-semibold">{selectedIndices.size} selected</span>
          <button
            onClick={() => downloadCSV(filtered.filter((_, i) => selectedIndices.has(i)), `teams-selected.csv`)}
            className="flex items-center gap-1.5 bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export selected
          </button>
          <button
            onClick={() => setSelectedIndices(new Set())}
            className="text-text-secondary hover:text-navy text-xs ml-auto transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {filtered.map((t, i) => (
          <div key={i} className={cn("bg-bg-secondary border border-border rounded-sm p-4", selectedIndices.has(i) ? "border-accent/40 bg-accent/5" : "")}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-navy font-semibold text-sm"><SearchHighlight text={t.teamName} query={search} /></span>
              <span className={cn("inline-block px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider border", STATUS_COLORS[t.status] || "bg-bg text-text-secondary border-border")}>{t.status}</span>
            </div>
            <div className="text-xs text-text-secondary space-y-1">
              <p>Coach: <SearchHighlight text={t.coach} query={search} /></p>
              <div className="flex items-center gap-3">
                <span>{t.age} &middot; {t.gender}</span>
                <span className="ml-auto">{t.source}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center text-text-secondary text-sm">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-text-secondary/50" aria-hidden="true" />
            No teams found
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-bg-secondary border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Teams roster</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIndices.size === filtered.length}
                    ref={(el) => { if (el) el.indeterminate = selectedIndices.size > 0 && selectedIndices.size < filtered.length; }}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="accent-accent cursor-pointer"
                  />
                </th>
                <th scope="col" className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">Team</th>
                <th scope="col" className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">Coach</th>
                <th scope="col" className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">Phone</th>
                <th scope="col" className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">Age</th>
                <th scope="col" className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">Gender</th>
                <th scope="col" className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">Status</th>
                <th scope="col" className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">Outreach</th>
                <th scope="col" className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i} className={`border-b border-border/50 hover:bg-bg/50 transition-colors ${selectedIndices.has(i) ? "bg-accent/5" : ""}`}>
                  <td className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIndices.has(i)}
                      onChange={() => toggleRow(i)}
                      aria-label={`Select ${t.teamName}`}
                      className="accent-accent cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-navy font-medium"><SearchHighlight text={t.teamName} query={search} /></td>
                  <td className="px-4 py-3 text-text-secondary"><SearchHighlight text={t.coach} query={search} /></td>
                  <td className="px-4 py-3">
                    {t.phone && t.phone !== "—" ? (
                      <a
                        href={`tel:${t.phone.replace(/\D/g, "")}`}
                        className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors group"
                        title={`Call ${t.coach}`}
                      >
                        <Phone className="w-3 h-3 flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
                        <span className="text-xs">{t.phone}</span>
                      </a>
                    ) : (
                      <span className="text-text-secondary/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy">{t.age}</td>
                  <td className="px-4 py-3 text-navy">{t.gender}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-block px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider border", STATUS_COLORS[t.status] || "bg-bg text-text-secondary border-border")}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{t.outreach}</td>
                  <td className="px-4 py-3 text-text-secondary">{t.source}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-text-secondary">No teams found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-text-secondary text-xs mt-3">Showing {filtered.length} of {teams.length} teams</p>
    </>
  );
}
