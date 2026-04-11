"use client";

import { AdminBarChart, AdminDonutChart, BRAND, CHART_COLORS } from "@/components/dashboard/Charts";
import Link from "next/link";
import { Trophy } from "lucide-react";

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
}

export default function DashboardCharts({
  divisionData,
  revenueData,
  recentGames,
}: DashboardChartsProps) {
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
                {recentGames.map((game, i) => {
                  const homeWon =
                    game.winner &&
                    game.home &&
                    game.winner.toLowerCase().includes(game.home.toLowerCase().split(" ")[0]);
                  const awayWon =
                    game.winner &&
                    game.away &&
                    game.winner.toLowerCase().includes(game.away.toLowerCase().split(" ")[0]);

                  return (
                    <tr
                      key={i}
                      className="hover:bg-bg/50 transition-colors"
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
                    </tr>
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
