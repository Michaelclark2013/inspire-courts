// Shared types for admin Check-In dashboard.

export type TeamStatus = {
  teamName: string;
  coach: string;
  division: string;
  paymentStatus: string;
  checkedInPlayers: string[];
  checkedInCount: number;
  hasCheckedIn: boolean;
  isPaid: boolean;
};

export type FilterStatus = "all" | "checked" | "not";

export type RecentCheckin = {
  name: string;
  team: string;
  time: string;
  /** ISO timestamp for relative display */
  at: string;
  /** Used to roll back optimistic entries on failure */
  id: string;
  /** Optimistic state before server confirmation */
  pending?: boolean;
};

export type CheckInKPIs = {
  checkedInTeamCount: number;
  totalTeams: number;
  totalPlayerCheckins: number;
  sessionCount: number;
};

export type CheckInDashboardProps = {
  teams: TeamStatus[];
  checkedInTeamCount: number;
  totalTeams: number;
  totalPlayerCheckins: number;
  today: string;
};

export type CheckInFormData = {
  playerName: string;
  teamName: string;
  division: string;
};
