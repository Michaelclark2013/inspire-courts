"use client";

import { Fragment, useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Trophy, Users, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminDonutChart, AdminBarChart, CHART_COLORS } from "@/components/dashboard/Charts";
import StatusBadge from "@/components/dashboard/StatusBadge";

interface Tournament {
  name: string;
  date: string;
  rawDate: string;
  divisions: string;
  status: string;
  teams: number;
  fee: string;
  rawFee: number;
  revenue: string;
  rawRevenue: number;
  description: string;
  location: string;
  organizer: string;
}

interface Props {
  tournaments: Tournament[];
  statusData: { label: string; value: number }[];
  revenueData: { label: string; value: number }[];
}

const NUMERIC_KEYS = new Set(["teams", "rawFee", "rawRevenue"]);

export default function TournamentsClient({ tournaments, statusData, revenueData }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState<"All" | "Upcoming" | "Past">("All");
  const [sortKey, setSortKey] = useState<string>("rawDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<number | null>(null);

  const statuses = useMemo(
    () => ["All", ...Array.from(new Set(tournaments.map((t) => t.status))).sort()],
    [tournaments]
  );

  const filtered = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);
    let list = tournaments;

    if (statusFilter !== "All") list = list.filter((t) => t.status === statusFilter);

    if (timeFilter === "Upcoming") list = list.filter((t) => t.rawDate >= now || !t.rawDate);
    if (timeFilter === "Past") list = list.filter((t) => t.rawDate < now && t.rawDate !== "");

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.divisions.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const av = a[sortKey as keyof Tournament] ?? "";
      const bv = b[sortKey as keyof Tournament] ?? "";
      if (NUMERIC_KEYS.has(sortKey)) {
        return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [tournaments, search, statusFilter, timeFilter, sortKey, sortDir]);

  const totalTeams = tournaments.reduce((s, t) => s + t.teams, 0);
  const totalRevenue = tournaments.reduce((s, t) => s + t.rawRevenue, 0);
  const avgTeams = tournaments.length > 0 ? Math.round(totalTeams / tournaments.length) : 0;

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "rawDate" ? "desc" : "asc");
    }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortKey !== col) return <span className="text-text-secondary/40 ml-1">↕</span>;
    return sortDir === "asc" ? (
      <ChevronUp className="inline w-3 h-3 ml-1 text-accent" />
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-1 text-accent" />
    );
  }

  const columns: [string, string][] = [
    ["name", "Name"],
    ["rawDate", "Date"],
    ["divisions", "Divisions"],
    ["status", "Status"],
    ["teams", "Teams"],
    ["rawFee", "Fee"],
    ["rawRevenue", "Revenue"],
  ];

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Events</span>
            <Trophy className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-navy">{tournaments.length}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Teams</span>
            <Users className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-navy">{totalTeams}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Revenue</span>
            <DollarSign className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-navy">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Avg Teams/Event</span>
            <TrendingUp className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-navy">{avgTeams}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">Status Breakdown</h3>
          <p className="text-text-secondary text-xs mb-4">Tournaments by status</p>
          {statusData.length > 0 ? (
            <AdminDonutChart data={statusData} height={200} />
          ) : (
            <div className="h-[160px] flex items-center justify-center text-text-secondary text-sm">No data</div>
          )}
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">Revenue by Tournament</h3>
          <p className="text-text-secondary text-xs mb-4">Top events by revenue</p>
          {revenueData.length > 0 ? (
            <AdminBarChart
              data={revenueData.map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }))}
              height={200}
              valueFormatter={(v) => `$${v.toLocaleString()}`}
            />
          ) : (
            <div className="h-[160px] flex items-center justify-center text-text-secondary text-sm">No revenue data</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments, divisions, location..."
            className="w-full bg-bg-secondary border border-border rounded-sm pl-8 pr-3 py-2 text-sm text-navy placeholder:text-text-secondary focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", "Upcoming", "Past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={cn(
                "px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider border transition-colors",
                timeFilter === t
                  ? "bg-accent/10 text-accent border-accent/30"
                  : "bg-bg border-border text-text-secondary hover:text-navy"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider border transition-colors",
              statusFilter === s
                ? "bg-accent/10 text-accent border-accent/30"
                : "bg-bg border-border text-text-secondary hover:text-navy"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-text-secondary text-xs">
            Showing <span className="text-navy font-semibold">{filtered.length}</span> of {tournaments.length} tournaments
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Tournaments list</caption>
            <thead>
              <tr className="border-b border-border">
                {columns.map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-navy transition-colors select-none whitespace-nowrap"
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
                  <td colSpan={8} className="px-4 py-8 text-center text-text-secondary text-sm">
                    No tournaments match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <Fragment key={i}>
                    <tr
                      className="hover:bg-bg/40 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                      <td className="px-4 py-3 font-semibold text-navy whitespace-nowrap">{t.name}</td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{t.date}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded font-mono">
                          {t.divisions}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-navy">{t.teams}</td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{t.fee}</td>
                      <td className="px-4 py-3 font-bold text-accent">{t.revenue}</td>
                      <td className="px-4 py-3">
                        <button aria-label={expanded === i ? "Collapse details" : "Expand details"} className="text-text-secondary hover:text-navy transition-colors">
                          {expanded === i ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expanded === i && (t.location || t.organizer || t.description) && (
                      <tr className="bg-bg/60">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            {t.location && (
                              <div>
                                <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Location</p>
                                <p className="text-navy">{t.location}</p>
                              </div>
                            )}
                            {t.organizer && (
                              <div>
                                <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Organizer</p>
                                <p className="text-navy">{t.organizer}</p>
                              </div>
                            )}
                            {t.description && (
                              <div className={!t.location && !t.organizer ? "" : "sm:col-span-3"}>
                                <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Description</p>
                                <p className="text-navy">{t.description}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
