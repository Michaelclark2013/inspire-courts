import type { LucideIcon } from "lucide-react";

export type ProgramCardAccent = "red" | "navy";

export interface ProgramCard {
  icon: LucideIcon;
  accent: ProgramCardAccent;
  title: string;
  subtitle: string;
  points: string[];
  href: string;
  cta: string;
}

export interface UpcomingTournament {
  id: number;
  name: string;
  startDate: string;
  location: string | null;
  format: string;
  divisions: string | null;
  entryFee: number | null;
  registrationOpen: boolean | null;
  registrationDeadline: string | null;
}

export interface StatItem {
  label: string;
  cls: string;
}
