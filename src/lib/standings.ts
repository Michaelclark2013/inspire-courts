export type GameResult = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner?: string;
  scheduledTime?: string | null;
};

export type StandingRow = {
  team: string;
  wins: number;
  losses: number;
  pct: string;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  gb: string;
  streak: string;
  lastFive: string;
};

export function computeStandings(games: GameResult[]): StandingRow[] {
  const records: Record<
    string,
    { wins: number; losses: number; pf: number; pa: number; results: ("W" | "L")[] }
  > = {};

  // Sort games by scheduledTime so streak/L5 are chronological
  const sorted = [...games].sort((a, b) => {
    const ta = a.scheduledTime || "";
    const tb = b.scheduledTime || "";
    return ta.localeCompare(tb);
  });

  for (const g of sorted) {
    if (g.homeTeam && g.homeTeam !== "—") {
      if (!records[g.homeTeam]) records[g.homeTeam] = { wins: 0, losses: 0, pf: 0, pa: 0, results: [] };
    }
    if (g.awayTeam && g.awayTeam !== "—") {
      if (!records[g.awayTeam]) records[g.awayTeam] = { wins: 0, losses: 0, pf: 0, pa: 0, results: [] };
    }

    // Determine winner
    let homeWon = false;
    let awayWon = false;

    if (g.winner && g.winner !== "—") {
      homeWon = g.winner === g.homeTeam;
      awayWon = g.winner === g.awayTeam;
    } else if (g.homeScore !== 0 || g.awayScore !== 0) {
      homeWon = g.homeScore > g.awayScore;
      awayWon = g.awayScore > g.homeScore;
    }

    // Accumulate points
    if (records[g.homeTeam]) {
      records[g.homeTeam].pf += g.homeScore;
      records[g.homeTeam].pa += g.awayScore;
    }
    if (records[g.awayTeam]) {
      records[g.awayTeam].pf += g.awayScore;
      records[g.awayTeam].pa += g.homeScore;
    }

    // Accumulate W/L
    if (homeWon) {
      if (records[g.homeTeam]) { records[g.homeTeam].wins++; records[g.homeTeam].results.push("W"); }
      if (records[g.awayTeam]) { records[g.awayTeam].losses++; records[g.awayTeam].results.push("L"); }
    } else if (awayWon) {
      if (records[g.awayTeam]) { records[g.awayTeam].wins++; records[g.awayTeam].results.push("W"); }
      if (records[g.homeTeam]) { records[g.homeTeam].losses++; records[g.homeTeam].results.push("L"); }
    }
  }

  const rows = Object.entries(records).map(([team, rec]) => {
    const total = rec.wins + rec.losses;
    const pctNum = total > 0 ? (rec.wins / total) * 100 : 0;

    // Streak: count consecutive results from end
    let streak = "";
    if (rec.results.length > 0) {
      const last = rec.results[rec.results.length - 1];
      let count = 0;
      for (let i = rec.results.length - 1; i >= 0; i--) {
        if (rec.results[i] === last) count++;
        else break;
      }
      streak = `${last}${count}`;
    }

    // Last 5
    const l5 = rec.results.slice(-5);
    const l5w = l5.filter((r) => r === "W").length;
    const l5l = l5.length - l5w;
    const lastFive = l5.length > 0 ? `${l5w}-${l5l}` : "—";

    return {
      team,
      wins: rec.wins,
      losses: rec.losses,
      pct: pctNum.toFixed(0),
      pointsFor: rec.pf,
      pointsAgainst: rec.pa,
      pointDiff: rec.pf - rec.pa,
      gb: "", // computed after sort
      streak,
      lastFive,
    };
  });

  // Sort: wins desc → point diff desc → points for desc
  rows.sort((a, b) => b.wins - a.wins || b.pointDiff - a.pointDiff || b.pointsFor - a.pointsFor);

  // Compute games back from leader
  if (rows.length > 0) {
    const leaderWins = rows[0].wins;
    const leaderLosses = rows[0].losses;
    rows[0].gb = "—";
    for (let i = 1; i < rows.length; i++) {
      const diff = ((leaderWins - rows[i].wins) + (rows[i].losses - leaderLosses)) / 2;
      rows[i].gb = diff === 0 ? "—" : diff.toFixed(1).replace(/\.0$/, "");
    }
  }

  return rows;
}
