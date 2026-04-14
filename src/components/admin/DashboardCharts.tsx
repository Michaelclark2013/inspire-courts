"use client";

import { useState } from "react";
import { AdminBarChart, AdminDonutChart, BRAND, CHART_COLORS } from "@/components/dashboard/Charts";
import Link from "next/link";
import { Trophy, ChevronDown } from "lucide-react";

interface DashboardChartsProps {
  divisionData: { label: string; value: number }[];
  revenueData: { label: string; value: number }[];
  recentGames: {
    home: string;
    away: string;
    homeScore: string;
    awayScore: string;
    winner: string;
    division: string;
    court: string;
    time: string;
  }[];
  registrationRevenue?: number;
}

export default function DashboardCharts({
  divisionData,
  revenueData,
  recentGames,
  registrationRevenue,
}: DashboardChartsProps) {
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const divisions = [...new Set(recentGames.map(g => g.division).filter(d => d && d !== "—"))];
  const filteredGames = selectedDivision ? recentGames.filter(g => g.division === selectedDivision) : recentGames;

  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams by Division */}
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                Teams by Division
              </h3>
              <p className="text-text-secondary text-xs mt-0.5">
                Registrations per age group
              </p>
            </div>
            <Link
              href="/admin/teams"
              className="text-accent text-xs hover:underline"
            >
              View all →
            </Link>
          </div>
          {divisionData.length > 0 ? (
            <AdminBarChart
              data={divisionData.map((d, i) => ({
                ...d,
                color: CHART_COLORS[i % CHART_COLORS.length],
              }))}
              height={200}
            />
          ) : (
            <EmptyChart message="No team data loaded yet" />
          )}
        </div>

        {/* Revenue breakdown */}
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                Revenue Breakdown
              </h3>
              <p className="text-text-secondary text-xs mt-0.5">
                Cash vs Card vs Square
              </p>
            </div>
            <Link
              href="/admin/revenue"
              className="text-accent text-xs hover:underline"
            >
              View all →
            </Link>
          </div>
          {registrationRevenue !== undefined && (
            <div className="flex items-center gap-4 mb-4 px-1">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Registration</span>
                <span className="text-lg font-bold text-white">${registrationRevenue.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Walk-In / Cash</span>
                <span className="text-lg font-bold text-white">${revenueData.reduce((s, d) => s + d.value, 0).toLocaleString()}</span>
              </div>
            </div>
          )}
          {revenueData.length > 0 ? (
            <AdminDonutChart
              data={revenueData.map((d, i) => ({
                ...d,
                color: [BRAND.red, BRAND.blue2, BRAND.green][i] || CHART_COLORS[i],
              }))}
              height={200}
              valueFormatter={(v) =>
                `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
              }
            />
          ) : (
            <EmptyChart message="No revenue data loaded yet" />
          )}
        </div>
      </div>

      {/* Recent Game Scores */}
      <div className="bg-bg-secondary border border-border rounded-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            <h2 className="text-white font-bold text-sm uppercase tracking-tight">
              Recent Game Scores
            </h2>
          </div>
          <Link
            href="/admin/scores"
            className="text-accent text-xs hover:underline"
          >
            View all →
          </Link>
        </div>

        {divisions.length > 1 && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-border">
            <button onClick={() => setSelectedDivision(null)} className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider transition-colors ${!selectedDivision ? "bg-red text-white" : "bg-white/5 text-text-secondary hover:text-white"}`}>
              All
            </button>
            {divisions.map(d => (
              <button key={d} onClick={() => setSelectedDivision(d)} className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider transition-colors ${selectedDivision === d ? "bg-red text-white" : "bg-white/5 text-text-secondary hover:text-white"}`}>
                {d}
              </button>
            ))}
          </div>
        )}

        {recentGames.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            No game scores loaded yet. Share the Game Scores sheet with your
            service account to see data here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Home
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Away
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider hidden md:table-cell">
                    Division
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                    Court
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                    Winner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGames.map((game, i) => {
                  const homeWon =
                    game.winner &&
                    game.home &&
                    game.winner.toLowerCase().includes(game.home.toLowerCase().split(" ")[0]);
                  const awayWon =
                    game.winner &&
                    game.away &&
                    game.winner.toLowerCase().includes(game.away.toLowerCase().split(" ")[0]);

                  return (
                    <>
                      <tr
                        key={i}
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        className={`cursor-pointer hover:bg-white/[0.04] transition-colors ${i % 2 === 1 ? "bg-white/[0.015]" : ""}`}
                      >
                        <td
                          className={`px-4 py-3 font-medium ${
                            homeWon ? "text-white" : "text-text-secondary"
                          }`}
                        >
                          {game.home}
                          {homeWon && (
                            <span className="ml-1.5 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">
                              W
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono font-bold text-white">
                            {game.homeScore !== "—" && game.awayScore !== "—"
                              ? `${game.homeScore} – ${game.awayScore}`
                              : "—"}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            awayWon ? "text-white" : "text-text-secondary"
                          }`}
                        >
                          {game.away}
                          {awayWon && (
                            <span className="ml-1.5 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">
                              W
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                          <span className="text-xs bg-bg px-2 py-0.5 rounded">
                            {game.division}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs hidden lg:table-cell">
                          {game.court}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs hidden lg:table-cell truncate max-w-[140px]">
                          {game.winner}
                        </td>
                        <td className="px-2 py-3 text-text-secondary">
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedRow === i ? "rotate-180" : ""}`} />
                        </td>
                      </tr>
                      {expandedRow === i && (
                        <tr key={`${i}-detail`}>
                          <td colSpan={7} className="px-4 py-3 bg-white/[0.02] border-b border-white/5">
                            <div className="flex items-center gap-6 text-xs text-text-secondary">
                              <span><strong className="text-white/60">Court:</strong> {game.court}</span>
                              <span><strong className="text-white/60">Division:</strong> {game.division}</span>
                              <span><strong className="text-white/60">Time:</strong> {game.time}</span>
                              <span><strong className="text-white/60">Winner:</strong> <span className="text-emerald-400">{game.winner}</span></span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-text-secondary text-sm">
      {message}
    </div>
  );
}
