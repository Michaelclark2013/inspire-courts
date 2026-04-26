import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";
import BoardClient from "./BoardClient";

// Projector / lobby-screen view for game-day check-in.
//
// Strips the admin chrome and renders a big-type team grid that
// parents and visiting coaches can read from across the room.
// Auto-refreshes every 10s (vs the dashboard's 60s) because parents
// stand in front of it watching for their team's status to flip green.
//
// Same data shape as /admin/checkin so we can share the upstream
// teams + check-ins join. Permissions: still gated by the admin
// middleware (kiosk should be logged in as the front-desk account).

export const revalidate = 10;

export default async function CheckinBoardPage() {
  if (!isGoogleConfigured()) {
    return <BoardClient teams={[]} checkedInTeamCount={0} totalTeams={0} />;
  }

  const { rows: teamRows } = await fetchSheetWithHeaders(SHEETS.masterTeams);
  const TEAM_COLS = ["Team Name", "Team", "Club Name", "Organization"];
  const COACH_COLS = ["Coach", "Head Coach", "Contact Person", "Coach Name"];
  const DIV_COLS = ["Division", "Age Group", "Age", "Grade", "Level"];
  const PAY_STATUS_COLS = ["Payment Status", "Paid", "Status", "Payment"];

  const teams = teamRows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => ({
      teamName: getCol(row, ...TEAM_COLS) || "Unnamed Team",
      coach: getCol(row, ...COACH_COLS) || "—",
      division: getCol(row, ...DIV_COLS) || "—",
      paymentStatus: getCol(row, ...PAY_STATUS_COLS) || "—",
    }));

  const { rows: checkinRows } = await fetchSheetWithHeaders(SHEETS.playerCheckIn);
  const CI_TEAM_COLS = ["Team Name", "Team", "Club", "Organization"];
  const TIMESTAMP_COLS = ["Timestamp", "Date", "Time", "Check-In Time", "Checked In"];
  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Phoenix" });

  const todayCheckins = checkinRows
    .filter((row) => {
      const ts = getCol(row, ...TIMESTAMP_COLS);
      if (!ts) return false;
      try {
        return (
          new Date(ts).toLocaleDateString("en-US", { timeZone: "America/Phoenix" }) === today
        );
      } catch {
        return false;
      }
    })
    .filter((row) => (getCol(row, "Type", "type") || "").toUpperCase() !== "WAIVER");

  const checkinsByTeam: Record<string, number> = {};
  todayCheckins.forEach((row) => {
    const k = (getCol(row, ...CI_TEAM_COLS) || "").toLowerCase().trim();
    if (!k) return;
    checkinsByTeam[k] = (checkinsByTeam[k] || 0) + 1;
  });

  const teamsWithStatus = teams.map((t) => {
    const k = t.teamName.toLowerCase().trim();
    const count = checkinsByTeam[k] || 0;
    return {
      teamName: t.teamName,
      division: t.division,
      checkedInCount: count,
      hasCheckedIn: count > 0,
      isPaid: /paid|yes|complete/i.test(t.paymentStatus),
    };
  });

  // Sort: unchecked first (so the things parents are watching for
  // pop), then by division alphabetical.
  teamsWithStatus.sort((a, b) => {
    if (a.hasCheckedIn !== b.hasCheckedIn) return a.hasCheckedIn ? 1 : -1;
    return a.division.localeCompare(b.division);
  });

  return (
    <BoardClient
      teams={teamsWithStatus}
      checkedInTeamCount={teamsWithStatus.filter((t) => t.hasCheckedIn).length}
      totalTeams={teamsWithStatus.length}
    />
  );
}
