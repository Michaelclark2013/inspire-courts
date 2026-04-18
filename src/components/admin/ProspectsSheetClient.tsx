"use client";

import { useState, useMemo } from "react";
import { Search, ExternalLink, Download } from "lucide-react";
import { HorizontalBarList, CHART_COLORS, BRAND } from "@/components/dashboard/Charts";
import SearchHighlight from "@/components/ui/SearchHighlight";

function downloadProspectsCSV(rows: Prospect[], filename: string) {
  const headers = ["Team", "Coach", "Phone", "Email", "Status", "Division", "Notes", "Date"];
  const lines = [
    headers.join(","),
    ...rows.map((p) =>
      [p.team, p.coach, p.phone, p.email, p.status, p.division, p.notes, p.date]
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

interface Prospect {
  team: string;
  coach: string;
  phone: string;
  email: string;
  status: string;
  division: string;
  notes: string;
  date: string;
}

interface Props {
  prospects: Prospect[];
  funnelData: { label: string; value: number }[];
  divData: { label: string; value: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  committed: "bg-success/10 text-success border-success/20",
  registered: "bg-success/10 text-success border-success/20",
  interested: "bg-blue-50 text-blue-600 border-blue-200",
  texted: "bg-amber-50 text-amber-600 border-amber-200",
  contacted: "bg-amber-50 text-amber-600 border-amber-200",
  "no response": "bg-bg text-text-secondary border-border",
  "no go": "bg-danger/10 text-danger border-danger/20",
  unknown: "bg-bg text-text-secondary border-border",
};

function statusClass(status: string) {
  const key = status.toLowerCase();
  for (const [pattern, cls] of Object.entries(STATUS_COLORS)) {
    if (key.includes(pattern)) return `${cls} border`;
  }
  return "bg-bg text-text-secondary border border-border";
}

export default function ProspectsSheetClient({ prospects, funnelData, divData }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [divFilter, setDivFilter] = useState("All");
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const statuses = useMemo(
    () => ["All", ...Array.from(new Set(prospects.map((p) => p.status))).sort()],
    [prospects]
  );
  const divisions = useMemo(
    () => ["All", ...Array.from(new Set(prospects.map((p) => p.division))).filter(d => d !== "—").sort()],
    [prospects]
  );

  const filtered = useMemo(() => {
    let list = prospects;
    if (statusFilter !== "All") list = list.filter((p) => p.status === statusFilter);
    if (divFilter !== "All") list = list.filter((p) => p.division === divFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.team.toLowerCase().includes(q) ||
          p.coach.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sortKey as keyof Prospect] ?? "";
      const bv = b[sortKey as keyof Prospect] ?? "";
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [prospects, search, statusFilter, divFilter, sortKey, sortDir]);

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline funnel (as horizontal bars) */}
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">Pipeline Status</h3>
          <p className="text-text-secondary text-xs mb-4">Prospects by stage</p>
          {funnelData.length > 0 ? (
            <HorizontalBarList
              data={funnelData.map((d, i) => ({
                ...d,
                color: [BRAND.green, BRAND.green, BRAND.blue2, BRAND.yellow, BRAND.yellow, BRAND.red, BRAND.red][i] || CHART_COLORS[i % CHART_COLORS.length],
              }))}
              valueFormatter={(v) => `${v}`}
            />
          ) : (
            <div className="h-[160px] flex items-center justify-center text-text-secondary text-sm">No status data</div>
          )}
        </div>

        {/* By division */}
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">Prospects by Division</h3>
          <p className="text-text-secondary text-xs mb-4">Target age groups</p>
          {divData.length > 0 ? (
            <HorizontalBarList
              data={divData.map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }))}
              valueFormatter={(v) => `${v}`}
            />
          ) : (
            <div className="h-[160px] flex items-center justify-center text-text-secondary text-sm">No division data</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams, coaches, notes..."
            className="w-full bg-bg-secondary border border-border rounded-sm pl-8 pr-3 py-2 text-sm text-navy placeholder:text-text-secondary focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
          ))}
        </select>
        <select
          aria-label="Filter by division"
          value={divFilter}
          onChange={(e) => setDivFilter(e.target.value)}
          className="bg-bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
        >
          {divisions.map((d) => (
            <option key={d} value={d}>{d === "All" ? "All Divisions" : d}</option>
          ))}
        </select>
        <button
          onClick={() => downloadProspectsCSV(filtered, "prospects.csv")}
          title="Download CSV"
          className="flex items-center gap-1.5 bg-bg-secondary border border-border rounded-sm px-3 py-2 text-text-secondary hover:text-navy hover:border-accent/50 text-xs transition-colors flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-text-secondary text-xs">
            <span className="text-navy font-semibold">{filtered.length}</span> prospects
          </p>
        </div>
        <div className="overflow-x-auto scroll-shadow-x">
          <table className="w-full text-sm">
            <caption className="sr-only">Prospect teams</caption>
            <thead>
              <tr className="border-b border-border bg-off-white">
                {([["team","Team"],["coach","Coach"],["division","Division"],["status","Status"],["date","Date"],["","Contact"],["notes","Notes"]] as const).map(([key, label]) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider ${key ? "cursor-pointer hover:text-navy select-none" : ""}`}
                    onClick={key ? () => toggleSort(key) : undefined}
                  >
                    {label}
                    {key && sortKey === key && <span className="ml-1 text-accent">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>}
                    {key && sortKey !== key && <span className="ml-1 text-text-secondary/30">{"\u21C5"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">No prospects match your filters.</td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={i} className="hover:bg-bg/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-navy max-w-[160px] truncate"><SearchHighlight text={p.team} query={search} /></td>
                    <td className="px-4 py-3 text-text-secondary"><SearchHighlight text={p.coach} query={search} /></td>
                    <td className="px-4 py-3">
                      {p.division !== "—" && (
                        <span className="text-xs bg-bg px-2 py-0.5 rounded text-text-secondary">
                          {p.division}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${statusClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{p.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.phone !== "—" && (
                          <a href={`tel:${p.phone}`} className="text-xs text-text-secondary hover:text-accent transition-colors">
                            {p.phone}
                          </a>
                        )}
                        {p.email !== "—" && (
                          <a href={`mailto:${p.email}`} className="text-text-secondary hover:text-accent transition-colors">
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs max-w-[200px] truncate" title={p.notes}>
                      {p.notes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
