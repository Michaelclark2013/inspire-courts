"use client";

import { useState } from "react";
import { Search, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Game {
  home: string;
  away: string;
  score: string;
  winner: string;
  court: number | string;
  division: string;
  date: string;
  time: string;
  event: string;
}

export default function ScoresClient({ games }: { games: Game[] }) {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [divisionFilter, setDivisionFilter] = useState("All");

  const events = ["All", ...new Set(games.map((g) => g.event))];
  const divisions = ["All", ...new Set(games.map((g) => g.division).sort())];

  const filtered = games.filter((g) => {
    const matchSearch = g.home.toLowerCase().includes(search.toLowerCase()) || g.away.toLowerCase().includes(search.toLowerCase());
    const matchEvent = eventFilter === "All" || g.event === eventFilter;
    const matchDivision = divisionFilter === "All" || g.division === divisionFilter;
    return matchSearch && matchEvent && matchDivision;
  });

  // Group by event
  const grouped = filtered.reduce<Record<string, Game[]>>((acc, g) => {
    if (!acc[g.event]) acc[g.event] = [];
    acc[g.event].push(g);
    return acc;
  }, {});

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Games</span>
            <Trophy className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-navy">{games.length}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Events</span>
          <p className="text-2xl font-bold text-navy mt-2">{events.length - 1}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Divisions</span>
          <p className="text-2xl font-bold text-navy mt-2">{divisions.length - 1}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Courts Used</span>
          <p className="text-2xl font-bold text-navy mt-2">{new Set(games.map((g) => g.court)).size}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams..." className="w-full bg-bg border border-border rounded-sm pl-10 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/50" />
        </div>
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="bg-bg border border-border rounded-sm px-3 py-2.5 text-navy text-sm focus:outline-none focus:border-accent">
          {events.map((e) => <option key={e} value={e}>{e === "All" ? "All Events" : e}</option>)}
        </select>
        <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} className="bg-bg border border-border rounded-sm px-3 py-2.5 text-navy text-sm focus:outline-none focus:border-accent">
          {divisions.map((d) => <option key={d} value={d}>{d === "All" ? "All Divisions" : d}</option>)}
        </select>
      </div>

      {/* Games grouped by event */}
      {Object.entries(grouped).map(([event, eventGames]) => (
        <div key={event} className="mb-6">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" /> {event}
            <span className="text-text-secondary font-normal">({eventGames.length} games)</span>
          </h3>
          <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Home</th>
                    <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Away</th>
                    <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Score</th>
                    <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Division</th>
                    <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Court</th>
                    <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {eventGames.map((g, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                      <td className={cn("px-4 py-3", g.winner === g.home ? "text-accent font-bold" : "text-navy")}>{g.home}</td>
                      <td className={cn("px-4 py-3", g.winner === g.away ? "text-accent font-bold" : "text-navy")}>{g.away}</td>
                      <td className="px-4 py-3 text-navy font-medium font-mono">{g.score}</td>
                      <td className="px-4 py-3"><span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-sm">{g.division}</span></td>
                      <td className="px-4 py-3 text-navy">{g.court}</td>
                      <td className="px-4 py-3 text-text-secondary">{g.date}</td>
                      <td className="px-4 py-3 text-text-secondary">{g.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center text-text-secondary">No games found</div>
      )}

      <p className="text-text-secondary text-xs mt-3">Showing {filtered.length} of {games.length} games</p>
    </>
  );
}
