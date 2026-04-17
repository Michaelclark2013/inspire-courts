"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { computeStandings } from "@/lib/standings";
import type { StandingRow } from "@/lib/standings";

type GameData = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  division: string | null;
  scheduledTime: string | null;
  eventName?: string;
};

type Props = {
  eventFilter?: string;
};

export default function StandingsTable({ eventFilter = "" }: Props) {
  const [allGames, setAllGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function fetchGames() {
      try {
        const res = await fetch("/api/scores/live", { signal: controller.signal });
        if (!res.ok) return;
        const games: GameData[] = await res.json();
        setAllGames(games);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // API not available
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
    return () => controller.abort();
  }, []);

  // Filter by event then division, compute standings from final games
  const { standings, divisions } = useMemo(() => {
    let games = allGames;
    if (eventFilter) {
      games = games.filter((g) => g.eventName === eventFilter);
    }

    const divs = [...new Set(games.map((g) => g.division).filter(Boolean))] as string[];

    const filtered = divisionFilter
      ? games.filter((g) => g.division === divisionFilter)
      : games;

    const finalGames = filtered.filter((g) => g.status === "final");
    const rows = computeStandings(
      finalGames.map((g) => ({
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        scheduledTime: g.scheduledTime,
      }))
    );

    return { standings: rows, divisions: divs.sort() };
  }, [allGames, eventFilter, divisionFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-white/40" role="status" aria-live="polite">
        <div className="w-4 h-4 border-2 border-white/20 border-t-red rounded-full animate-spin mr-2" aria-hidden="true" />
        Loading standings...
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Standings will appear once games are finalized.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {divisions.length > 0 && (
        <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center gap-2 sm:gap-2" role="group" aria-label="Filter by division">
          <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Division:</span>
          <button
            type="button"
            onClick={() => setDivisionFilter("")}
            aria-pressed={divisionFilter === ""}
            className={`text-xs px-3 py-1.5 min-h-[36px] rounded-full font-semibold transition-colors ${
              divisionFilter === "" ? "bg-red text-white" : "bg-white/5 text-white/40 hover:text-white"
            }`}
          >
            All
          </button>
          {divisions.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setDivisionFilter(d)}
              aria-pressed={divisionFilter === d}
              className={`text-xs px-3 py-1.5 min-h-[36px] rounded-full font-semibold transition-colors ${
                divisionFilter === d ? "bg-red text-white" : "bg-white/5 text-white/40 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      <table className="w-full text-sm">
        <caption className="sr-only">Team standings</caption>
        <thead>
          <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
            <th scope="col" className="text-left px-4 py-3 font-semibold">#</th>
            <th scope="col" className="text-left px-4 py-3 font-semibold">Team</th>
            <th scope="col" className="text-center px-3 py-3 font-semibold">W</th>
            <th scope="col" className="text-center px-3 py-3 font-semibold">L</th>
            <th scope="col" className="text-center px-3 py-3 font-semibold">PCT</th>
            <th scope="col" className="text-center px-3 py-3 font-semibold hidden sm:table-cell">GB</th>
            <th scope="col" className="text-center px-3 py-3 font-semibold">+/-</th>
            <th scope="col" className="text-center px-3 py-3 font-semibold hidden md:table-cell">PF</th>
            <th scope="col" className="text-center px-3 py-3 font-semibold hidden md:table-cell">PA</th>
            <th scope="col" className="text-center px-3 py-3 font-semibold">STRK</th>
            <th scope="col" className="text-center px-3 py-3 font-semibold hidden sm:table-cell">L5</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr
              key={row.team}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-4 py-3 text-white/40 font-mono text-xs">{i + 1}</td>
              <td className="px-4 py-3 text-white font-semibold max-w-[200px] truncate" title={row.team}>{row.team}</td>
              <td className="px-3 py-3 text-center text-emerald-400 font-bold tabular-nums">
                {row.wins}
              </td>
              <td className="px-3 py-3 text-center text-red font-bold tabular-nums">
                {row.losses}
              </td>
              <td className="px-3 py-3 text-center text-white/60 tabular-nums">
                .{row.pct === "100" ? "1000" : row.pct === "0" ? "000" : row.pct.padStart(3, "0")}
              </td>
              <td className="px-3 py-3 text-center text-white/40 tabular-nums hidden sm:table-cell">
                {row.gb}
              </td>
              <td
                className={`px-3 py-3 text-center font-bold tabular-nums ${
                  row.pointDiff > 0 ? "text-emerald-400" : row.pointDiff < 0 ? "text-red" : "text-white/40"
                }`}
              >
                {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
              </td>
              <td className="px-3 py-3 text-center text-white/40 tabular-nums hidden md:table-cell">
                {row.pointsFor}
              </td>
              <td className="px-3 py-3 text-center text-white/40 tabular-nums hidden md:table-cell">
                {row.pointsAgainst}
              </td>
              <td className="px-3 py-3 text-center tabular-nums">
                <span
                  className={`text-xs font-bold ${
                    row.streak.startsWith("W") ? "text-emerald-400" : row.streak.startsWith("L") ? "text-red" : "text-white/40"
                  }`}
                >
                  {row.streak || "—"}
                </span>
              </td>
              <td className="px-3 py-3 text-center text-white/40 tabular-nums text-xs hidden sm:table-cell">
                {row.lastFive}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
