"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { AdminBarChart, CHART_COLORS } from "@/components/dashboard/Charts";
import TeamLogo from "@/components/ui/TeamLogo";
import LogoUploader from "@/components/ui/LogoUploader";
import { formatPhone } from "@/lib/utils";

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
  return "bg-white text-text-secondary border border-border";
}

export default function TeamsSheetClient({ teams, divisionData }: Props) {
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState("All");
  const [payFilter, setPayFilter] = useState("All");
  const [sortKey, setSortKey] = useState<keyof Team>("teamName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [logos, setLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/teams/logo", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === "object") setLogos(data); })
      .catch((err) => { if (err instanceof DOMException && err.name === "AbortError") return; });
    return () => controller.abort();
  }, []);

  function handleLogoSuccess(teamName: string, url: string) {
    setLogos((prev) => ({ ...prev, [teamName]: url }));
  }

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
      <ChevronUp className="inline w-3 h-3 ml-1 text-red" aria-hidden="true" />
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-1 text-red" aria-hidden="true" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Division chart */}
      {divisionData.length > 0 && (
        <div className="bg-off-white border border-border rounded-sm p-5">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams, coaches, email..."
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
            <option key={d} value={d}>
              {d === "All" ? "All Divisions" : d}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by payment status"
          value={payFilter}
          onChange={(e) => setPayFilter(e.target.value)}
          className="bg-off-white border border-border rounded-sm px-3 py-2 text-sm text-navy focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
        >
          {payStatuses.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Payment Status" : s}
            </option>
          ))}
        </select>
      </div>

      {/* Table/card container */}
      <div className="bg-off-white border border-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-text-secondary text-xs">
            Showing <span className="text-navy font-semibold">{filtered.length}</span> of {teams.length} teams
          </p>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-text-secondary text-sm">
              No teams match your filters.
            </p>
          ) : (
            filtered.map((team, i) => (
              <div key={i}>
                <button
                  className="w-full px-4 py-4 text-left hover:bg-white/40 transition-colors"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <TeamLogo teamName={team.teamName} logoUrl={logos[team.teamName]} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-navy font-semibold text-sm truncate">
                          {team.teamName}
                        </p>
                        <p className="text-text-secondary text-xs mt-0.5">{team.coach}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] bg-red/10 text-red px-2 py-0.5 rounded font-mono">
                        {team.division}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-text-secondary transition-transform ${expanded === i ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${paymentColor(team.paymentStatus)}`}>
                      {team.paymentStatus || "—"}
                    </span>
                    {team.amount && team.amount !== "—" && (
                      <span className="text-text-secondary text-xs font-mono">{team.amount}</span>
                    )}
                  </div>
                </button>
                {expanded === i && (
                  <div className="px-4 pb-4 pt-1 bg-white/40 space-y-3">
                    <div>
                      <p className="text-text-secondary text-[10px] uppercase tracking-wider mb-2">Team Logo</p>
                      <LogoUploader
                        teamName={team.teamName}
                        currentLogoUrl={logos[team.teamName]}
                        onSuccess={(url) => handleLogoSuccess(team.teamName, url)}
                        variant="card"
                      />
                    </div>
                    {team.email !== "—" && (
                      <div>
                        <p className="text-text-secondary text-[10px] uppercase tracking-wider mb-1">Email</p>
                        <a href={`mailto:${team.email}`} className="text-red text-sm hover:underline flex items-center gap-1">
                          {team.email} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>
                    )}
                    {team.phone !== "—" && (
                      <div>
                        <p className="text-text-secondary text-[10px] uppercase tracking-wider mb-1">Phone</p>
                        <a href={`tel:${team.phone}`} className="text-red text-sm hover:underline">
                          {formatPhone(team.phone)}
                        </a>
                      </div>
                    )}
                    {team.notes && (
                      <div>
                        <p className="text-text-secondary text-[10px] uppercase tracking-wider mb-1">Notes</p>
                        <p className="text-navy text-sm">{team.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Teams directory</caption>
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
                    className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-navy transition-colors select-none"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <SortIcon col={key} />
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
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
                      className="hover:bg-white/40 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <TeamLogo teamName={team.teamName} logoUrl={logos[team.teamName]} size={28} />
                          <span className="font-semibold text-navy">{team.teamName}</span>
                          <LogoUploader
                            teamName={team.teamName}
                            currentLogoUrl={logos[team.teamName]}
                            onSuccess={(url) => handleLogoSuccess(team.teamName, url)}
                            variant="button"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {team.coach}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-red/10 text-red px-2 py-0.5 rounded font-mono">
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
                        <button aria-label={expanded === i ? "Collapse details" : "Expand details"} className="text-text-secondary hover:text-navy transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                          {expanded === i ? (
                            <ChevronUp className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-4 h-4" aria-hidden="true" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expanded === i && (
                      <tr key={`${i}-expand`} className="bg-white/60">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-text-secondary text-xs uppercase tracking-wider mb-2">Team Logo</p>
                              <LogoUploader
                                teamName={team.teamName}
                                currentLogoUrl={logos[team.teamName]}
                                onSuccess={(url) => handleLogoSuccess(team.teamName, url)}
                                variant="card"
                              />
                            </div>
                            <div>
                              <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Email</p>
                              <p className="text-navy">{team.email !== "—" ? (
                                <a href={`mailto:${team.email}`} className="text-red hover:underline flex items-center gap-1">
                                  {team.email}
                                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                </a>
                              ) : "—"}</p>
                            </div>
                            <div>
                              <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Phone</p>
                              <p className="text-navy">{team.phone !== "—" ? (
                                <a href={`tel:${team.phone}`} className="text-red hover:underline">
                                  {formatPhone(team.phone)}
                                </a>
                              ) : "—"}</p>
                            </div>
                            {team.notes && (
                              <div>
                                <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Notes</p>
                                <p className="text-navy">{team.notes}</p>
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
