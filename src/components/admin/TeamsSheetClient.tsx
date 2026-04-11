"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { AdminBarChart, CHART_COLORS } from "@/components/dashboard/Charts";

interface Team {
  teamName: string;
  coach: string;
  email: string;
  phone: string;
  division: string;
  paymentStatus: string;
  amount: string;
  notes: string;
}

interface Props {
  teams: Team[];
  divisionData: { label: string; value: number }[];
}

function paymentColor(status: string) {
  if (/paid|yes|complete/i.test(status))
    return "bg-success/10 text-success border border-success/20";
  if (/unpaid|no|pending|due/i.test(status))
    return "bg-danger/10 text-danger border border-danger/20";
  if (/partial|half|deposit/i.test(status))
    return "bg-warning/10 text-warning border border-warning/20";
  return "bg-bg text-text-secondary border border-border";
}

export default function TeamsSheetClient({ teams, divisionData }: Props) {
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState("All");
  const [payFilter, setPayFilter] = useState("All");
  const [sortKey, setSortKey] = useState<keyof Team>("teamName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expanded, setExpanded] = useState<number | null>(null);

  const divisions = useMemo(
    () => ["All", ...Array.from(new Set(teams.map((t) => t.division))).sort()],
    [teams]
  );

  const payStatuses = useMemo(
    () => ["All", ...Array.from(new Set(teams.map((t) => t.paymentStatus))).filter(Boolean).sort()],
    [teams]
  );

  const filtered = useMemo(() => {
    let list = teams;
    if (divFilter !== "All") list = list.filter((t) => t.division === divFilter);
    if (payFilter !== "All") list = list.filter((t) => t.paymentStatus === payFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.teamName.toLowerCase().includes(q) ||
          t.coach.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sortKey] || "";
      const bv = b[sortKey] || "";
      return sortDir === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });
  }, [teams, search, divFilter, payFilter, sortKey, sortDir]);

  function toggleSort(key: keyof Team) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: keyof Team }) {
    if (sortKey !== col) return <span className="text-text-secondary/40 ml-1">↕</span>;
    return sortDir === "asc" ? (
      <ChevronUp className="inline w-3 h-3 ml-1 text-accent" />
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-1 text-accent" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Division chart */}
      {divisionData.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
            Teams per Division
          </h3>
          <AdminBarChart
            data={divisionData.map((d, i) => ({
              ...d,
              color: CHART_COLORS[i % CHART_COLORS.length],
            }))}
            height={180}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams, coaches, email..."
            className="w-full bg-bg-secondary border border-border rounded-sm pl-8 pr-3 py-2 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={divFilter}
          onChange={(e) => setDivFilter(e.target.value)}
          className="bg-bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
        >
          {divisions.map((d) => (
            <option key={d} value={d}>
              {d === "All" ? "All Divisions" : d}
            </option>
          ))}
        </select>
        <select
          value={payFilter}
          onChange={(e) => setPayFilter(e.target.value)}
          className="bg-bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
        >
          {payStatuses.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Payment Status" : s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-text-secondary text-xs">
            Showing <span className="text-white font-semibold">{filtered.length}</span> of {teams.length} teams
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {(
                  [
                    ["teamName", "Team"],
                    ["coach", "Coach"],
                    ["division", "Division"],
                    ["paymentStatus", "Payment"],
                    ["amount", "Amount"],
                  ] as [keyof Team, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <SortIcon col={key} />
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary text-sm">
                    No teams match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((team, i) => (
                  <>
                    <tr
                      key={i}
                      className="hover:bg-bg/40 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                      <td className="px-4 py-3 font-semibold text-white">
                        {team.teamName}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {team.coach}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded font-mono">
                          {team.division}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${paymentColor(team.paymentStatus)}`}
                        >
                          {team.paymentStatus || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                        {team.amount || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-text-secondary hover:text-white transition-colors">
                          {expanded === i ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expanded === i && (
                      <tr key={`${i}-expand`} className="bg-bg/60">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Email</p>
                              <p className="text-white">{team.email !== "—" ? (
                                <a href={`mailto:${team.email}`} className="text-accent hover:underline flex items-center gap-1">
                                  {team.email}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : "—"}</p>
                            </div>
                            <div>
                              <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Phone</p>
                              <p className="text-white">{team.phone !== "—" ? (
                                <a href={`tel:${team.phone}`} className="text-accent hover:underline">
                                  {team.phone}
                                </a>
                              ) : "—"}</p>
                            </div>
                            {team.notes && (
                              <div>
                                <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Notes</p>
                                <p className="text-white">{team.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
