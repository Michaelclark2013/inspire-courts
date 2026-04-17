// Shared public tournament types used across /tournaments pages

export type TournamentPublic = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  format: string;
  status: string;
  divisions: string[];
  entryFee: number | null;
  registrationOpen: boolean;
  registrationDeadline: string | null;
  maxTeamsPerDivision: number | null;
  teamCount: number;
  registrationCount: number;
  description: string | null;
};

export type TournamentDetailPublic = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  format: string;
  status: string;
  divisions: string[];
  entryFee: number | null;
  registrationOpen: boolean;
  registrationDeadline: string | null;
  description: string | null;
  teams: TournamentTeamPublic[];
  bracket: TournamentBracketGame[];
};

export type TournamentTeamPublic = {
  teamName: string;
  seed: number;
  division: string | null;
  poolGroup: string | null;
  eliminated: boolean;
};

export type TournamentBracketGame = {
  bracketPosition: number | null;
  round: string | null;
  poolGroup: string | null;
  winnerAdvancesTo: number | null;
  loserDropsTo: number | null;
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  court: string | null;
  scheduledTime: string | null;
  lastQuarter: string | null;
};

export const FORMAT_LABELS: Record<string, string> = {
  single_elim: "Single Elimination",
  double_elim: "Double Elimination",
  round_robin: "Round Robin",
  pool_play: "Pool Play",
};

export const TOURNAMENT_FEATURES = [
  {
    iconName: "Trophy" as const,
    title: "3+ Game Guarantee",
    desc: "Every team plays at least 3 games. Most play 4-5.",
  },
  {
    iconName: "Video" as const,
    title: "Game Film",
    desc: "Professional game film available as a paid add-on at every tournament.",
  },
  {
    iconName: "Shield" as const,
    title: "10U \u2013 17U Divisions",
    desc: "Boys and girls divisions. Compete against teams at your level.",
  },
  {
    iconName: "Zap" as const,
    title: "Electronic Scoreboards",
    desc: "Live scores updated in real-time. Follow along from anywhere.",
  },
] as const;
