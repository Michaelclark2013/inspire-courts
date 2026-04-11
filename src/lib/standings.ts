export type GameResult = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner?: string;
};

export type StandingRow = {
  team: string;
  wins: number;
  losses: number;
  pct: string;
};

export function computeStandings(games: GameResult[]): StandingRow[] {
  const records: Record<string, { wins: number; losses: number }> = {};

  for (const g of games) {
    if (g.homeTeam && g.homeTeam !== "—") {
      if (!records[g.homeTeam]) records[g.homeTeam] = { wins: 0, losses: 0 };
    }
    if (g.awayTeam && g.awayTeam !== "—") {
      if (!records[g.awayTeam]) records[g.awayTeam] = { wins: 0, losses: 0 };
    }

    if (g.winner && g.winner !== "—") {
      if (records[g.winner]) records[g.winner].wins++;
      const loser = g.winner === g.homeTeam ? g.awayTeam : g.homeTeam;
      if (loser && loser !== "—" && records[loser]) records[loser].losses++;
    } else if (g.homeScore !== 0 || g.awayScore !== 0) {
      if (g.homeScore > g.awayScore) {
        if (records[g.homeTeam]) records[g.homeTeam].wins++;
        if (records[g.awayTeam]) records[g.awayTeam].losses++;
      } else if (g.awayScore > g.homeScore) {
        if (records[g.awayTeam]) records[g.awayTeam].wins++;
        if (records[g.homeTeam]) records[g.homeTeam].losses++;
      }
    }
  }

  return Object.entries(records)
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
}
