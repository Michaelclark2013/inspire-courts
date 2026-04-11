"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import type { StandingRow } from "@/lib/standings";

export default function StandingsTable() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const res = await fetch("/api/scores/live");
        if (!res.ok) return;
        const games = await res.json();

        // Compute standings client-side from game results
        const records: Record<string, { wins: number; losses: number }> = {};
        for (const g of games) {
          if (g.status !== "final") continue;
          if (g.homeTeam) records[g.homeTeam] = records[g.homeTeam] || { wins: 0, losses: 0 };
          if (g.awayTeam) records[g.awayTeam] = records[g.awayTeam] || { wins: 0, losses: 0 };

          if (g.homeScore > g.awayScore) {
            records[g.homeTeam].wins++;
            records[g.awayTeam].losses++;
          } else if (g.awayScore > g.homeScore) {
            records[g.awayTeam].wins++;
            records[g.homeTeam].losses++;
          }
        }

        const rows = Object.entries(records)
          .map(([team, rec]) => ({
            team,
            wins: rec.wins,
            losses: rec.losses,
            pct:
              rec.wins + rec.losses > 0
                ? ((rec.wins / (rec.wins + rec.losses)) * 100).toFixed(0)
                : "0",
          }))
          .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

        setStandings(rows);
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-white/40">
        <div className="w-4 h-4 border-2 border-white/20 border-t-red rounded-full animate-spin mr-2" />
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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-3 font-semibold">#</th>
            <th className="text-left px-4 py-3 font-semibold">Team</th>
            <th className="text-center px-4 py-3 font-semibold">W</th>
            <th className="text-center px-4 py-3 font-semibold">L</th>
            <th className="text-center px-4 py-3 font-semibold">Win %</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr
              key={row.team}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-4 py-3 text-white/40 font-mono">{i + 1}</td>
              <td className="px-4 py-3 text-white font-semibold">{row.team}</td>
              <td className="px-4 py-3 text-center text-emerald-400 font-bold tabular-nums">
                {row.wins}
              </td>
              <td className="px-4 py-3 text-center text-red font-bold tabular-nums">
                {row.losses}
              </td>
              <td className="px-4 py-3 text-center text-white/60 tabular-nums">
                {row.pct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
