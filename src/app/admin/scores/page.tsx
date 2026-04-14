import { ClipboardList } from "lucide-react";
import ScoresSheetClient from "@/components/admin/ScoresSheetClient";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

export const revalidate = 300;

export default async function ScoresPage() {
  if (!isGoogleConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-heading">Game Scores</h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">Game Results from Google Sheets</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-5 text-center">
          <ClipboardList className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Google Sheets not connected</p>
          <p className="text-text-secondary text-sm">Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local</p>
        </div>
      </div>
    );
  }

  const { rows } = await fetchSheetWithHeaders(SHEETS.gameScores);

  const HOME_COLS = ["Home Team", "Home", "Team 1", "Team A"];
  const AWAY_COLS = ["Away Team", "Away", "Team 2", "Team B"];
  const HOME_SCORE_COLS = ["Home Score", "Score 1", "Home Points", "Home Final"];
  const AWAY_SCORE_COLS = ["Away Score", "Score 2", "Away Points", "Away Final"];
  const WINNER_COLS = ["Winner", "Winning Team", "Winner (Team Name)", "Result"];
  const DIV_COLS = ["Division", "Age Group", "Age", "Division/Age Group"];
  const COURT_COLS = ["Court", "Court Number", "Court #", "Court No"];
  const TIME_COLS = ["Timestamp", "Game Time", "Date", "Time", "Game Date"];
  const EVENT_COLS = ["Event", "Tournament", "Event Name"];

  const games = rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => {
      const homeScore = parseFloat(getCol(row, ...HOME_SCORE_COLS)) || 0;
      const awayScore = parseFloat(getCol(row, ...AWAY_SCORE_COLS)) || 0;
      const rawTime = getCol(row, ...TIME_COLS);
      let dateStr = "—";
      if (rawTime) {
        try {
          dateStr = new Date(rawTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        } catch {
          dateStr = rawTime;
        }
      }

      return {
        home: getCol(row, ...HOME_COLS) || "—",
        away: getCol(row, ...AWAY_COLS) || "—",
        homeScore: getCol(row, ...HOME_SCORE_COLS) || "—",
        awayScore: getCol(row, ...AWAY_SCORE_COLS) || "—",
        homeScoreNum: homeScore,
        awayScoreNum: awayScore,
        winner: getCol(row, ...WINNER_COLS) || "—",
        division: getCol(row, ...DIV_COLS) || "—",
        court: getCol(row, ...COURT_COLS) || "—",
        date: dateStr,
        event: getCol(row, ...EVENT_COLS) || "—",
      };
    });

  // Win/loss records
  const records: Record<string, { wins: number; losses: number }> = {};
  games.forEach((g) => {
    if (g.home !== "—") {
      if (!records[g.home]) records[g.home] = { wins: 0, losses: 0 };
    }
    if (g.away !== "—") {
      if (!records[g.away]) records[g.away] = { wins: 0, losses: 0 };
    }
    if (g.winner !== "—" && g.winner !== "") {
      if (records[g.winner]) records[g.winner].wins++;
      // figure out loser
      const loser = g.winner === g.home ? g.away : g.home;
      if (loser !== "—" && records[loser]) records[loser].losses++;
    } else if (g.homeScoreNum !== 0 || g.awayScoreNum !== 0) {
      // derive from score
      if (g.homeScoreNum > g.awayScoreNum) {
        if (records[g.home]) records[g.home].wins++;
        if (records[g.away]) records[g.away].losses++;
      } else if (g.awayScoreNum > g.homeScoreNum) {
        if (records[g.away]) records[g.away].wins++;
        if (records[g.home]) records[g.home].losses++;
      }
    }
  });

  const standings = Object.entries(records)
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

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-heading">
          Game Scores
        </h1>
        <p className="text-text-secondary text-sm mt-1 hidden md:block">
          {games.length} games recorded from Google Sheets
        </p>
      </div>
      <ScoresSheetClient games={games} standings={standings} />
    </div>
  );
}
