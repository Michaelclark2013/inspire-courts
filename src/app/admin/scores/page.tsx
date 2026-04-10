"use client";

import { useState } from "react";
import { Search, Trophy, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const GAMES = [
  { home: "Showtime", away: "All AZ", score: "44-53", winner: "All AZ", court: 4, division: "13U", date: "Apr 3", time: "4:00 PM" },
  { home: "DAWGS", away: "Inspire 16U", score: "66-55", winner: "Inspire 16U", court: 4, division: "16U", date: "Apr 3", time: "5:00 PM" },
  { home: "Showtime", away: "Monstarz", score: "65-60", winner: "Monstarz", court: 4, division: "13U", date: "Apr 3", time: "6:00 PM" },
  { home: "Downtown Bang", away: "Hoop Dreams", score: "38-82", winner: "Downtown Bang", court: 4, division: "16U", date: "Apr 3", time: "7:00 PM" },
  { home: "Inspire", away: "Downtown Bang", score: "39-50", winner: "Inspire", court: 5, division: "16U", date: "Apr 3", time: "4:00 PM" },
  { home: "Downtown Bang", away: "Reach", score: "49-46", winner: "Reach", court: 5, division: "16U", date: "Apr 3", time: "5:00 PM" },
  { home: "Southside Yucky Buckets", away: "All-AZ", score: "77-33", winner: "All-AZ", court: 5, division: "13U", date: "Apr 3", time: "6:00 PM" },
  { home: "Santan Dawgs 17U", away: "Monstarz 17U", score: "70-59", winner: "Monstarz", court: 5, division: "17U", date: "Apr 3", time: "7:00 PM" },
  { home: "Inspire", away: "NDO", score: "47-42", winner: "Inspire", court: 6, division: "16U", date: "Apr 3", time: "5:00 PM" },
  { home: "Inspire", away: "Monstarz", score: "71-54", winner: "Monstarz", court: 6, division: "17U", date: "Apr 3", time: "6:00 PM" },
  { home: "NDO", away: "Hoop and Bat", score: "66-50", winner: "NDO", court: 6, division: "17U", date: "Apr 3", time: "7:00 PM" },
  { home: "QC Elite", away: "Inspire", score: "67-41", winner: "Inspire", court: 7, division: "17U", date: "Apr 3", time: "5:00 PM" },
  { home: "NDO Elite", away: "Hoop Dreams", score: "49-47", winner: "Hoop Dreams", court: 7, division: "16U", date: "Apr 3", time: "6:00 PM" },
  { home: "Yucky Buckets", away: "Monstarz", score: "63-26", winner: "Monstarz", court: 7, division: "13U", date: "Apr 3", time: "7:00 PM" },
  { home: "NDO", away: "Inspire 16U", score: "77-54", winner: "Inspire", court: 4, division: "16U", date: "Apr 3", time: "8:00 PM" },
  { home: "Reach", away: "Downtown Bang", score: "46-52", winner: "Reach", court: 5, division: "16U", date: "Apr 3", time: "8:00 PM" },
  { home: "QC Elite", away: "Inspire 17U", score: "61-38", winner: "Inspire 17U", court: 4, division: "17U", date: "Apr 4", time: "11:00 AM" },
  { home: "Monstarz", away: "Santan Dawgs", score: "60-58", winner: "Santan Dawgs", court: 5, division: "17U", date: "Apr 4", time: "11:00 AM" },
  { home: "Hoop Dream", away: "NDO", score: "30-53", winner: "Hoop Dream", court: 4, division: "16U", date: "Apr 4", time: "12:00 PM" },
  { home: "DT Bang White", away: "DT Bang Blue", score: "61-53", winner: "DT Bang Blue", court: 6, division: "16U", date: "Apr 4", time: "12:00 PM" },
  { home: "Hoop N Bat", away: "NDO", score: "49-33", winner: "NDO", court: 5, division: "17U", date: "Apr 4", time: "12:00 PM" },
  { home: "Inspire", away: "Santan Dawgs", score: "73-34", winner: "Inspire", court: 5, division: "17U", date: "Apr 4", time: "1:00 PM" },
  { home: "Showtime", away: "All-AZ", score: "53-41", winner: "All-AZ", court: 4, division: "13U", date: "Apr 4", time: "1:00 PM" },
  { home: "Inspire", away: "Hoop Dreams", score: "60-48", winner: "Inspire", court: 4, division: "14U", date: "Apr 4", time: "2:00 PM" },
  { home: "NDO", away: "Inspire", score: "70-67", winner: "NDO", court: 5, division: "17U", date: "Apr 4", time: "2:00 PM" },
  { home: "Monstarz", away: "All-AZ", score: "39-41", winner: "Monstarz", court: 4, division: "12U", date: "Apr 4", time: "3:00 PM" },
  { home: "Inspire", away: "NDO", score: "56-55", winner: "NDO", court: 5, division: "17U", date: "Apr 4", time: "3:30 PM" },
  { home: "Inspire", away: "Downtown Bang", score: "82-76", winner: "Inspire", court: 6, division: "16U", date: "Apr 4", time: "3:30 PM" },
];

export default function ScoresPage() {
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const divisions = ["All", ...new Set(GAMES.map((g) => g.division).sort())];
  const dates = ["All", ...new Set(GAMES.map((g) => g.date))];

  const filtered = GAMES.filter((g) => {
    const matchSearch = g.home.toLowerCase().includes(search.toLowerCase()) || g.away.toLowerCase().includes(search.toLowerCase()) || g.winner.toLowerCase().includes(search.toLowerCase());
    const matchDivision = divisionFilter === "All" || g.division === divisionFilter;
    const matchDate = dateFilter === "All" || g.date === dateFilter;
    return matchSearch && matchDivision && matchDate;
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
            Game Scores
          </h1>
        </div>
        <p className="text-text-secondary text-sm">
          OFF SZN Session 1 — {GAMES.length} games played
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-4 text-center">
          <p className="text-3xl font-bold text-white">{GAMES.length}</p>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Total Games</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4 text-center">
          <p className="text-3xl font-bold text-white">{divisions.length - 1}</p>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Divisions</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4 text-center">
          <p className="text-3xl font-bold text-white">4</p>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Courts Used</p>
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
            placeholder="Search by team name..."
            className="w-full bg-bg border border-border rounded-sm pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/50"
          />
        </div>
        <select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
          className="bg-bg border border-border rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
        >
          {divisions.map((d) => (
            <option key={d} value={d}>{d === "All" ? "All Divisions" : d}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-bg border border-border rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
        >
          {dates.map((d) => (
            <option key={d} value={d}>{d === "All" ? "All Dates" : d}</option>
          ))}
        </select>
      </div>

      {/* Game Cards */}
      <div className="space-y-2">
        {filtered.map((g, i) => {
          const [homeScore, awayScore] = g.score.split("-").map(Number);
          const homeWon = g.winner.toLowerCase().includes(g.home.toLowerCase().slice(0, 5));
          return (
            <div key={i} className="bg-bg-secondary border border-border rounded-sm p-4 hover:border-border/80 transition-colors">
              <div className="flex items-center gap-4">
                {/* Division & Court Badge */}
                <div className="text-center flex-shrink-0 w-16">
                  <span className="bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-sm text-xs font-bold uppercase block">{g.division}</span>
                  <span className="text-text-secondary text-[10px] uppercase tracking-wider mt-1 block">Court {g.court}</span>
                </div>

                {/* Matchup */}
                <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className={cn("text-right", homeWon ? "text-white font-bold" : "text-text-secondary")}>
                    <p className="text-sm">{g.home}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg tracking-wider font-mono">{g.score}</p>
                  </div>
                  <div className={cn("text-left", !homeWon ? "text-white font-bold" : "text-text-secondary")}>
                    <p className="text-sm">{g.away}</p>
                  </div>
                </div>

                {/* Date/Time */}
                <div className="text-right flex-shrink-0 text-xs text-text-secondary">
                  <p>{g.date}</p>
                  <p>{g.time}</p>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center text-text-secondary">
            No games found
          </div>
        )}
      </div>

      <p className="text-text-secondary text-xs mt-3">Showing {filtered.length} of {GAMES.length} games — Connect Notion API for live data</p>
    </div>
  );
}
