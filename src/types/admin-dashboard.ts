// Shared types for the admin dashboard overview page and its sub-components.

export type AdminRegistrationStats = {
  total: number;
  pendingPayments: number;
  paidRevenueCents: number;
  approvalRate: number;
};

export type AdminUpcomingGame = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  court: string | null;
  scheduledTime: string | null;
  division: string | null;
  status: string;
};

export type AdminTournamentStatus = {
  id: number;
  name: string;
  status: string;
  registeredCount: number;
  maxCapacity: number | null;
  registrationOpen: boolean;
  entryFee: number | null;
  startDate: string;
  divisions: string[];
};

export type AdminLiveGame = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  division: string | null;
  court: string | null;
  status: "scheduled" | "live" | "final";
  scheduledTime: string | null;
  quarter?: string | null;
};

export type AdminLeadCounts = {
  hot: number;
  warm: number;
  cold: number;
  total: number;
};

export type AdminAlertCounts = {
  pendingRegistrations: number;
  activeTournaments: number;
  upcomingGames: number;
  draftTournaments: number;
};

export type AdminDashboardSummary = {
  registrations: AdminRegistrationStats;
  upcomingGames: AdminUpcomingGame[];
  tournamentStatus: AdminTournamentStatus[];
  activeAnnouncements: number;
  liveGames: number;
  liveGamesDetail: AdminLiveGame[];
  alerts: AdminAlertCounts;
  leads: AdminLeadCounts | null;
};

export type AdminDashboardErrors = {
  summary: boolean;
  leads: boolean;
  live: boolean;
};
