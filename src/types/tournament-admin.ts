// Shared types for the admin tournament detail page.

export type Player = {
  name: string;
  jersey: string;
};

export type Team = {
  id: number;
  teamName: string;
  seed: number | null;
  division: string | null;
  poolGroup: string | null;
  eliminated: boolean;
  players: string | null; // JSON-encoded Player[]
};

export type BracketGame = {
  id: number;
  gameId: number;
  bracketPosition: number | null;
  round: string | null;
  poolGroup: string | null;
  winnerAdvancesTo: number | null;
  loserDropsTo: number | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  lastQuarter: string | null;
  status: string;
  court: string | null;
  scheduledTime: string | null;
  division: string | null;
};

export type TournamentDetail = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  format: string;
  status: string;
  divisions: string[];
  courts: string[];
  gameLength: number;
  breakLength: number;
  teams: Team[];
  bracket: BracketGame[];
  updatedAt?: string | null;
};

export const TABS = ["teams", "bracket", "schedule", "standings"] as const;
export type Tab = (typeof TABS)[number];

export const FORMAT_LABELS: Record<string, string> = {
  single_elim: "Single Elimination",
  double_elim: "Double Elimination",
  round_robin: "Round Robin",
  pool_play: "Pool Play",
};

export const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-blue-50 text-blue-600",
  active: "bg-emerald-50 text-emerald-600",
  completed: "bg-gray-100 text-gray-500",
};

export function parsePlayers(raw: string | null): Player[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Player[];
  } catch {
    return [];
  }
}
