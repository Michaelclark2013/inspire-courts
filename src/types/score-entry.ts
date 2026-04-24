export type GameStatus = "scheduled" | "live" | "final";

export type Game = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  division: string | null;
  court: string | null;
  eventName: string | null;
  scheduledTime: string | null;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  lastQuarter: string | null;
  updatedAt?: string | null;
  // Accountability — who entered the latest score. Shown on every
  // game card so admin can see which scorekeeper captured the result.
  enteredBy?: number | null;
  enteredByName?: string | null;
  enteredByRole?: string | null;
  enteredByPhotoUrl?: string | null;
  enteredAt?: string | null;
};

export type TournamentOption = { id: number; name: string };

export type ScoreFormState = {
  gameId: number;
  homeScore: number;
  awayScore: number;
  quarter: string;
  status: "" | GameStatus;
};

export type CreateGameForm = {
  homeTeam: string;
  awayTeam: string;
  division: string;
  court: string;
  eventName: string;
};
