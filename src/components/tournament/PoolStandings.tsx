"use client";

import { BarChart3, Trophy } from "lucide-react";

type BracketGame = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  poolGroup: string | null;
  round: string | null;
};

interface Props {
  bracket: BracketGame[];
}

type StandingRow = {
  team: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
  pct: number;
};

export default function PoolStandings({ bracket }: Props) {
  // Get only final games
  const finalGames = bracket.filter((g) => g.status === "final");

  if (finalGames.length === 0) {
    return (
      <div className="text-center py-16 text-white/40">
        <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">
          No completed games yet. Standings will appear as games finish.
        </p>
      </div>
    );
  }

  // Group by pool (if pool play) or show overall
  const pools = new Map<string, BracketGame[]>();
  for (const game of finalGames) {
    const pool = game.poolGroup || "Overall";
    if (!pools.has(pool)) pools.set(pool, []);
    pools.get(pool)!.push(game);
  }

  function computeStandings(games: BracketGame[]): StandingRow[] {
    const stats = new Map<
      string,
      { wins: number; losses: number; pf: number; pa: number }
    >();

    for (const game of games) {
      if (!stats.has(game.homeTeam))
        stats.set(game.homeTeam, { wins: 0, losses: 0, pf: 0, pa: 0 });
      if (!stats.has(game.awayTeam))
        stats.set(game.awayTeam, { wins: 0, losses: 0, pf: 0, pa: 0 });

      const home = stats.get(game.homeTeam)!;
      const away = stats.get(game.awayTeam)!;

      home.pf += game.homeScore;
      home.pa += game.awayScore;
      away.pf += game.awayScore;
      away.pa += game.homeScore;

      if (game.homeScore > game.awayScore) {
        home.wins++;
        away.losses++;
      } else if (game.awayScore > game.homeScore) {
        away.wins++;
        home.losses++;
      }
    }

    return [...stats.entries()]
      .map(([team, s]) => ({
        team,
        wins: s.wins,
        losses: s.losses,
        pointsFor: s.pf,
        pointsAgainst: s.pa,
        diff: s.pf - s.pa,
        pct: s.wins + s.losses > 0
          ? Math.round((s.wins / (s.wins + s.losses)) * 1000) / 10
          : 0,
      }))
      .sort((a, b) => b.pct - a.pct || b.diff - a.diff);
  }

  const poolNames = [...pools.keys()].sort();

  return (
    <div className="space-y-6">
      {poolNames.map((poolName) => {
        const poolGames = pools.get(poolName) || [];
        const standings = computeStandings(poolGames);

        return (
          <div
            key={poolName}
            className="bg-card border border-white/10 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-red" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                {poolName === "Overall" ? "Standings" : `Pool ${poolName}`}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/40 text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 w-8">
                      #
                    </th>
                    <th className="text-left text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-2.5">
                      Team
                    </th>
                    <th className="text-center text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 w-12">
                      W
                    </th>
                    <th className="text-center text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 w-12">
                      L
                    </th>
                    <th className="text-center text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 w-14">
                      Win%
                    </th>
                    <th className="text-center text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 w-12">
                      PF
                    </th>
                    <th className="text-center text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 w-12">
                      PA
                    </th>
                    <th className="text-center text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 w-12">
                      +/-
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {standings.map((row, i) => (
                    <tr key={row.team} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-white/30 font-bold tabular-nums">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2.5 text-white font-semibold">
                        {row.team}
                      </td>
                      <td className="text-center px-3 py-2.5 text-emerald-400 font-bold tabular-nums">
                        {row.wins}
                      </td>
                      <td className="text-center px-3 py-2.5 text-red font-bold tabular-nums">
                        {row.losses}
                      </td>
                      <td className="text-center px-3 py-2.5 text-white font-bold tabular-nums">
                        {row.pct}%
                      </td>
                      <td className="text-center px-3 py-2.5 text-white/60 tabular-nums">
                        {row.pointsFor}
                      </td>
                      <td className="text-center px-3 py-2.5 text-white/60 tabular-nums">
                        {row.pointsAgainst}
                      </td>
                      <td
                        className={`text-center px-3 py-2.5 font-bold tabular-nums ${row.diff > 0 ? "text-emerald-400" : row.diff < 0 ? "text-red" : "text-white/30"}`}
                      >
                        {row.diff > 0 ? "+" : ""}
                        {row.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
