"use client";

import { useState, useMemo } from "react";
import { Search, ExternalLink, Download } from "lucide-react";
import { formatPhone } from "@/lib/utils";

function downloadPlayersCSV(rows: Player[], filename: string) {
  const headers = ["Player", "Parent/Guardian", "Team", "Division", "Phone", "Email", "Date"];
  const lines = [
    headers.join(","),
    ...rows.map((p) =>
      [p.name, p.parent, p.team, p.division, p.phone, p.email, p.date]
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
import { AdminBarChart, HorizontalBarList, CHART_COLORS } from "@/components/dashboard/Charts";
import SearchHighlight from "@/components/ui/SearchHighlight";
import Badge from "@/components/ui/Badge";

interface Player {
  name: string;
  parent: string;
  team: string;
  division: string;
  phone: string;
  email: string;
  date: string;
}

interface Props {
  players: Player[];
  divData: { label: string; value: number }[];
  teamData: { label: string; value: number }[];
}

export default function PlayersSheetClient({ players, divData, teamData }: Props) {
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");

  // Single pass extracts both unique divisions and teams
  const { divisions, teams } = useMemo(() => {
    const divSet = new Set<string>();
    const teamSet = new Set<string>();
    for (const p of players) {
      divSet.add(p.division);
      if (p.team !== "—") teamSet.add(p.team);
    }
    return {
      divisions: ["All", ...Array.from(divSet).sort()],
      teams: ["All", ...Array.from(teamSet).sort()],
    };
  }, [players]);

  const filtered = useMemo(() => {
    let list = players;
    if (divFilter !== "All") list = list.filter((p) => p.division === divFilter);
    if (teamFilter !== "All") list = list.filter((p) => p.team === teamFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.parent.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q)
      );
    }
    return list;
  }, [players, search, divFilter, teamFilter]);

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-off-white border border-border rounded-sm p-5">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">
            Players by Division
          </h3>
          {divData.length > 0 ? (
            <AdminBarChart
              data={divData.map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }))}
              height={200}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-text-secondary text-sm">No division data</div>
          )}
        </div>
        <div className="bg-off-white border border-border rounded-sm p-5">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">
            Top Teams by Player Count
          </h3>
          {teamData.length > 0 ? (
            <HorizontalBarList
              data={teamData.map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }))}
              valueFormatter={(v) => `${v}`}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-text-secondary text-sm">No team data</div>
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
            placeholder="Search players, parents, teams..."
            className="w-full bg-off-white border border-border rounded-sm pl-8 pr-3 py-2 text-sm text-navy placeholder:text-text-secondary focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
          />
        </div>
        <select
          aria-label="Filter by division"
          value={divFilter}
          onChange={(e) => setDivFilter(e.target.value)}
          className="bg-off-white border border-border rounded-sm px-3 py-2 text-sm text-navy focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
        >
          {divisions.map((d) => (
            <option key={d} value={d}>{d === "All" ? "All Divisions" : d}</option>
          ))}
        </select>
        <select
          aria-label="Filter by team"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="bg-off-white border border-border rounded-sm px-3 py-2 text-sm text-navy focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
        >
          {teams.slice(0, 50).map((t) => (
            <option key={t} value={t}>{t === "All" ? "All Teams" : t}</option>
          ))}
        </select>
        <button
          onClick={() => downloadPlayersCSV(filtered, "players.csv")}
          title="Download CSV"
          className="flex items-center gap-1.5 bg-off-white border border-border rounded-sm px-3 py-2 text-text-secondary hover:text-navy hover:border-red/50 text-xs transition-colors flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-off-white border border-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-text-secondary text-xs">
            <span className="text-navy font-semibold">{filtered.length}</span> players
          </p>
        </div>
        <div className="overflow-x-auto scroll-shadow-x">
          <table className="w-full text-sm">
            <caption className="sr-only">Registered players</caption>
            <thead>
              <tr className="border-b border-border bg-off-white">
                {["Player", "Parent/Guardian", "Team", "Division", "Date", "Contact"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">No players match your filters.</td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={i} className="hover:bg-off-white transition-colors">
                    <td className="px-4 py-3 font-semibold text-navy"><SearchHighlight text={p.name} query={search} /></td>
                    <td className="px-4 py-3 text-text-secondary"><SearchHighlight text={p.parent} query={search} /></td>
                    <td className="px-4 py-3 text-text-secondary text-xs max-w-[140px] truncate" title={p.team}><SearchHighlight text={p.team} query={search} /></td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{p.division}</Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{p.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.phone !== "—" && (
                          <a href={`tel:${p.phone}`} className="text-text-secondary hover:text-red transition-colors text-xs">
                            {formatPhone(p.phone)}
                          </a>
                        )}
                        {p.email !== "—" && (
                          <a href={`mailto:${p.email}`} className="text-text-secondary hover:text-red transition-colors">
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        )}
                      </div>
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
