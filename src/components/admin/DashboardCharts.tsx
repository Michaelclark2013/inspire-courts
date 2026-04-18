"use client";

import { useState } from "react";
import { AdminBarChart, AdminDonutChart, BRAND, CHART_COLORS } from "@/components/dashboard/Charts";
import Link from "next/link";
import { Trophy, ChevronDown, AlertCircle } from "lucide-react";

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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Teams by Division */}
        <div className="bg-white border border-light-gray shadow-sm rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-navy font-bold text-sm uppercase tracking-wider">
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
            <EmptyChart message="No team data loaded yet" cta={{ label: "View Teams", href: "/admin/teams" }} />
          )}
        </div>

        {/* Revenue breakdown */}
        <div className="bg-white border border-light-gray shadow-sm rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-navy font-bold text-sm uppercase tracking-wider">
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
                <span className="text-lg font-bold text-navy">${registrationRevenue.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Walk-In / Cash</span>
                <span className="text-lg font-bold text-navy">${revenueData.reduce((s, d) => s + d.value, 0).toLocaleString()}</span>
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
            <EmptyChart message="No revenue data loaded yet" cta={{ label: "View Revenue", href: "/admin/revenue" }} />
          )}
        </div>
      </div>

      {/* Recent Game Scores */}
      <div className="bg-white border border-light-gray shadow-sm rounded-sm">
        <div className="px-5 py-4 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-tight">
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
          <div className="flex gap-1.5 px-4 py-2 border-b border-light-gray overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter games by division">
            <button role="tab" aria-selected={!selectedDivision} onClick={() => setSelectedDivision(null)} className={`flex-shrink-0 text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-colors min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red ${!selectedDivision ? "bg-red text-white" : "bg-off-white text-text-secondary hover:text-navy"}`}>
              All
            </button>
            {divisions.map(d => (
              <button role="tab" aria-selected={selectedDivision === d} key={d} onClick={() => setSelectedDivision(d)} className={`flex-shrink-0 text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-colors min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red ${selectedDivision === d ? "bg-red text-white" : "bg-off-white text-text-secondary hover:text-navy"}`}>
                {d}
              </button>
            ))}
          </div>
        )}

        {recentGames.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary text-sm mb-1">No game scores loaded yet</p>
            <p className="text-text-secondary/60 text-xs mb-4">Share the Game Scores sheet with your service account to see data here.</p>
            <Link href="/admin/scores/enter" className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold hover:underline">
              Enter first score →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Recent game scores</caption>
              <thead>
                <tr className="border-b border-light-gray">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Home
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Away
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider hidden md:table-cell">
                    Division
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                    Court
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                    Winner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
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
                        className={`cursor-pointer hover:bg-off-white transition-colors ${i % 2 === 1 ? "bg-off-white/40" : ""}`}
                      >
                        <td
                          className={`px-4 py-3 font-medium ${
                            homeWon ? "text-navy" : "text-text-secondary"
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
                          <span className="font-mono font-bold text-navy">
                            {game.homeScore !== "—" && game.awayScore !== "—"
                              ? `${game.homeScore} – ${game.awayScore}`
                              : "—"}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            awayWon ? "text-navy" : "text-text-secondary"
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
                          <td colSpan={7} className="px-4 py-3 bg-off-white border-b border-light-gray">
                            <div className="flex items-center gap-6 text-xs text-text-secondary">
                              <span><strong className="text-navy/60">Court:</strong> {game.court}</span>
                              <span><strong className="text-navy/60">Division:</strong> {game.division}</span>
                              <span><strong className="text-navy/60">Time:</strong> {game.time}</span>
                              <span><strong className="text-navy/60">Winner:</strong> <span className="text-emerald-600">{game.winner}</span></span>
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

function EmptyChart({ message, cta }: { message: string; cta?: { label: string; href: string } }) {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center gap-2">
      <p className="text-text-secondary text-sm">{message}</p>
      {cta && (
        <Link href={cta.href} className="text-accent text-xs font-semibold hover:underline">
          {cta.label} →
        </Link>
      )}
    </div>
  );
}
