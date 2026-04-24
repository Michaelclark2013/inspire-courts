import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";
import CheckInDashboard from "./CheckInDashboard";

export const revalidate = 60; // refresh every 60s

export default async function CheckInPage() {
  if (!isGoogleConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading mb-1">
          Game Day Check-In
        </h1>
        <p className="text-text-secondary text-sm mb-4">Manage player check-ins and roster attendance for game days</p>
        <div className="bg-white border border-border shadow-sm rounded-xl p-6 text-navy/60 text-sm">
          Google Sheets not configured. Add your service account credentials to enable check-in.
        </div>
      </div>
    );
  }

  // Fetch teams from masterTeams sheet
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

  // Fetch today's check-ins from playerCheckIn sheet
  const { rows: checkinRows } = await fetchSheetWithHeaders(SHEETS.playerCheckIn);
  const PLAYER_COLS = ["Player Name", "Player", "First Name", "Full Name", "Name"];
  const CI_TEAM_COLS = ["Team Name", "Team", "Club", "Organization"];
  const TIMESTAMP_COLS = ["Timestamp", "Date", "Time", "Check-In Time", "Checked In"];

  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Phoenix" });

  // Filter to today's check-ins (not waivers)
  const todayCheckins = checkinRows
    .filter((row) => {
      const ts = getCol(row, ...TIMESTAMP_COLS);
      if (!ts) return false;
      // Check if timestamp is from today
      try {
        const rowDate = new Date(ts).toLocaleDateString("en-US", { timeZone: "America/Phoenix" });
        return rowDate === today;
      } catch {
        return false;
      }
    })
    .filter((row) => {
      // Exclude waivers (they have "WAIVER" in type column)
      const type = getCol(row, "Type", "type") || "";
      return type.toUpperCase() !== "WAIVER";
    })
    .map((row) => ({
      playerName: getCol(row, ...PLAYER_COLS) || "Unknown",
      teamName: getCol(row, ...CI_TEAM_COLS) || "",
      timestamp: getCol(row, ...TIMESTAMP_COLS) || "",
    }));

  // Build check-in counts per team
  const checkinsByTeam: Record<string, string[]> = {};
  todayCheckins.forEach((ci) => {
    const key = ci.teamName.toLowerCase().trim();
    if (!key) return;
    if (!checkinsByTeam[key]) checkinsByTeam[key] = [];
    checkinsByTeam[key].push(ci.playerName);
  });

  // Merge teams with check-in status
  const teamsWithStatus = teams.map((team) => {
    const key = team.teamName.toLowerCase().trim();
    const checkedInPlayers = checkinsByTeam[key] || [];
    return {
      ...team,
      checkedInPlayers,
      checkedInCount: checkedInPlayers.length,
      hasCheckedIn: checkedInPlayers.length > 0,
      isPaid: /paid|yes|complete/i.test(team.paymentStatus),
    };
  });

  // Sort: unchecked teams first, then by division
  teamsWithStatus.sort((a, b) => {
    if (a.hasCheckedIn !== b.hasCheckedIn) return a.hasCheckedIn ? 1 : -1;
    return a.division.localeCompare(b.division);
  });

  const checkedInTeamCount = teamsWithStatus.filter((t) => t.hasCheckedIn).length;
  const totalPlayerCheckins = todayCheckins.length;

  return (
    <CheckInDashboard
      teams={teamsWithStatus}
      checkedInTeamCount={checkedInTeamCount}
      totalTeams={teams.length}
      totalPlayerCheckins={totalPlayerCheckins}
      today={today}
    />
  );
}
