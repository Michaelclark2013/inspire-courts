"use client";

import { useState } from "react";
import { Search, Trophy, CalendarDays, DollarSign, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tournament {
  name: string;
  date: string;
  divisions: string;
  status: string;
  teams: number;
  fee: string;
  revenue: string;
}

const STATUS_COLORS: Record<string, string> = {
  "Registration Open": "bg-green-500/10 text-green-400 border-green-500/20",
  Planning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Completed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "In Progress": "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function TournamentsClient({ tournaments }: { tournaments: Tournament[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const statuses = ["All", ...new Set(tournaments.map((t) => t.status))];

  const filtered = tournaments.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.divisions.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const totalTeams = tournaments.reduce((s, t) => s + t.teams, 0);
  const totalRevenue = tournaments.reduce((s, t) => s + parseInt(t.revenue.replace(/[$,]/g, "") || "0"), 0);

  // Find next upcoming event
  const upcoming = tournaments.find((t) => t.status === "Registration Open" || t.status === "Planning");

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Events</span>
            <Trophy className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-white">{tournaments.length}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Teams</span>
            <Users className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-white">{totalTeams}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Revenue</span>
            <DollarSign className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Next Event</span>
            <CalendarDays className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-lg font-bold text-white truncate">{upcoming?.date || "—"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments or divisions..."
            className="w-full bg-bg border border-border rounded-sm pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider border transition-colors",
                filter === s ? "bg-accent/10 text-accent border-accent/30" : "bg-bg border-border text-text-secondary hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tournament Cards */}
      <div className="space-y-3">
        {filtered.map((t, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-sm p-5 hover:border-border/80 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white font-bold text-lg">{t.name}</h3>
                  <span className={cn("inline-block px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider border", STATUS_COLORS[t.status] || "bg-bg text-text-secondary border-border")}>
                    {t.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-text-secondary">
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{t.date}</span>
                  <span>Divisions: {t.divisions}</span>
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">Teams</p>
                  <p className="text-white font-bold text-lg">{t.teams}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">Fee</p>
                  <p className="text-white font-bold text-lg">{t.fee}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">Revenue</p>
                  <p className="text-accent font-bold text-lg">{t.revenue}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center text-text-secondary">No tournaments found</div>
        )}
      </div>
    </>
  );
}
