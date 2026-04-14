import type { UserRole } from "@/types/next-auth";

// ── Role Definitions ────────────────────────────────────────────────────────
// admin:      Full access — everything from one portal
// staff:      Own work history (Staff Check-Out), score entry, event & personal schedule
// ref:        Own work history (Ref Check-Out), ref checkout details
// front_desk: Scores, schedules, player check-ins, files, staffing schedules
// coach:      Roster, check-in, waiver form, schedule, scores, score entry, game day files, profile
// parent:     Schedule, scores, profile (read-only)

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin (All Access)",
  staff: "Staff",
  ref: "Referee",
  front_desk: "Front Desk",
  coach: "Coach",
  parent: "Parent",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red/20 text-red",
  staff: "bg-blue-500/20 text-blue-400",
  ref: "bg-amber-500/20 text-amber-400",
  front_desk: "bg-purple-500/20 text-purple-400",
  coach: "bg-emerald-500/20 text-emerald-400",
  parent: "bg-cyan-500/20 text-cyan-400",
};

// Which roles go to /admin dashboard on login
export const ADMIN_ROLES: UserRole[] = ["admin", "staff", "ref", "front_desk"];

// Which roles go to /portal on login
export const PORTAL_ROLES: UserRole[] = ["coach", "parent"];

// All valid roles
export const ALL_ROLES: UserRole[] = ["admin", "staff", "ref", "front_desk", "coach", "parent"];

// ── Admin page-level access ─────────────────────────────────────────────────

export type AdminPage =
  | "overview"
  | "teams"
  | "scores"
  | "score_entry"
  | "players"
  | "checkin"
  | "staff_refs"
  | "revenue"
  | "prospects"
  | "files"
  | "analytics"
  | "contacts"
  | "tournaments"
  | "sponsors"
  | "schools"
  | "content"
  | "users"
  | "portal"
  | "my_schedule"
  | "my_history"
  | "announcements"
  | "leads"
  | "approvals";

const PAGE_ACCESS: Record<AdminPage, UserRole[]> = {
  overview: ["admin", "staff", "front_desk"],
  teams: ["admin"],
  scores: ["admin", "staff", "front_desk"],
  score_entry: ["admin", "staff"],
  players: ["admin", "front_desk"],
  checkin: ["admin", "front_desk"],
  staff_refs: ["admin", "front_desk"],
  revenue: ["admin"],
  prospects: ["admin"],
  files: ["admin", "front_desk"],
  analytics: ["admin"],
  contacts: ["admin"],
  tournaments: ["admin"],
  sponsors: ["admin"],
  schools: ["admin"],
  content: ["admin"],
  users: ["admin"],
  portal: ["admin"],
  my_schedule: ["staff", "ref", "front_desk"],
  my_history: ["staff", "ref"],
  announcements: ["admin"],
  leads: ["admin"],
  approvals: ["admin"],
};

export function canAccess(role: UserRole | undefined, page: AdminPage): boolean {
  if (!role) return false;
  return PAGE_ACCESS[page]?.includes(role) ?? false;
}

export function isAdminRole(role: string | undefined): boolean {
  // Admin roles use the /admin dashboard
  return ADMIN_ROLES.includes(role as UserRole);
}

export function isPortalRole(role: string | undefined): boolean {
  return PORTAL_ROLES.includes(role as UserRole);
}

// Admin also has access to portal
export function getLoginRedirect(role: string | undefined): string {
  if (role === "admin") return "/admin";
  if (ADMIN_ROLES.includes(role as UserRole)) return "/admin";
  if (PORTAL_ROLES.includes(role as UserRole)) return "/portal";
  return "/login";
}
