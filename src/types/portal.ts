// Shared types for the coach/parent/admin portal dashboard.

import type { ComponentType } from "react";

export type LiveGame = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  quarter: string | null;
  division: string | null;
};

export type Announcement = {
  id: number;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
};

export type Registration = {
  id: number;
  tournamentId: number;
  tournamentName: string;
  tournamentDate: string;
  teamName: string;
  division: string | null;
  paymentStatus: string;
  status: string;
};

export type RegistrationStep = {
  label: string;
  description: string;
  href: string;
  done: boolean;
  icon: ComponentType<{ className?: string }>;
};

export type PortalSummary = {
  liveGames: LiveGame[];
  announcements: Announcement[];
  registrations: Registration[];
  rosterCount: number | null;
  waiverSubmitted: boolean;
};

export type PortalErrors = {
  games: boolean;
  announcements: boolean;
  registrations: boolean;
};
