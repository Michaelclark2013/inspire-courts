import { UserCheck, UsersRound } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import PlayersSheetClient from "@/components/admin/PlayersSheetClient";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

export const revalidate = 300;

export default async function PlayersPage() {
  if (!isGoogleConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">Players</h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">Player Check-In from Google Sheets</p>
        </div>
        <div className="bg-off-white border border-border rounded-xl p-5 text-center">
          <UserCheck className="w-10 h-10 text-text-secondary mx-auto mb-3" aria-hidden="true" />
          <p className="text-navy font-semibold mb-1">Google Sheets not connected</p>
          <p className="text-text-secondary text-sm">Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local</p>
        </div>
      </div>
    );
  }

  const { rows } = await fetchSheetWithHeaders(SHEETS.playerCheckIn);

  const PLAYER_COLS = ["Player Name", "Player", "First Name", "Full Name", "Name"];
  const LAST_COLS = ["Last Name", "Last"];
  const PARENT_COLS = ["Parent Name", "Parent", "Guardian", "Parent/Guardian"];
  const TEAM_COLS = ["Team", "Team Name", "Club", "Organization"];
  const DIV_COLS = ["Division", "Age Group", "Age", "Grade", "Level"];
  const PHONE_COLS = ["Phone", "Parent Phone", "Cell", "Contact Phone", "Phone Number"];
  const EMAIL_COLS = ["Email", "Parent Email", "Contact Email"];
  const DATE_COLS = ["Timestamp", "Check-In Date", "Date", "Time"];

  const players = rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => {
      const firstName = getCol(row, ...PLAYER_COLS);
      const lastName = getCol(row, ...LAST_COLS);
      const name = lastName ? `${firstName} ${lastName}`.trim() : firstName || "—";
      const rawDate = getCol(row, ...DATE_COLS);
      return {
        name,
        parent: getCol(row, ...PARENT_COLS) || "—",
        team: getCol(row, ...TEAM_COLS) || "—",
        division: getCol(row, ...DIV_COLS) || "—",
        phone: getCol(row, ...PHONE_COLS) || "—",
        email: getCol(row, ...EMAIL_COLS) || "—",
        date: rawDate
          ? (() => { try { return new Date(rawDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return rawDate; } })()
          : "—",
      };
    });

  // Division breakdown chart
  const divCounts: Record<string, number> = {};
  players.forEach((p) => { divCounts[p.division] = (divCounts[p.division] || 0) + 1; });
  const divData = Object.entries(divCounts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  // Team breakdown
  const teamCounts: Record<string, number> = {};
  players.forEach((p) => { if (p.team !== "—") teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });
  const teamData = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <PageHeader
        title="Players"
        subtitle={`${players.length} players checked in`}
        icon={UsersRound}
      />

      <PlayersSheetClient players={players} divData={divData} teamData={teamData} />
    </div>
  );
}
