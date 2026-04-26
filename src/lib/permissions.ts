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
  admin: "bg-red/10 text-red",
  staff: "bg-blue-50 text-blue-600",
  ref: "bg-amber-50 text-amber-600",
  front_desk: "bg-purple-50 text-purple-600",
  coach: "bg-emerald-50 text-emerald-600",
  parent: "bg-cyan-50 text-cyan-600",
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
  | "approvals"
  | "audit_log"
  | "search"
  | "health"
  | "roster"
  | "timeclock"
  | "shifts"
  | "resources"
  | "payroll"
  | "members"
  | "certifications"
  | "maintenance"
  | "programs"
  | "time_off"
  | "equipment"
  | "owner"
  | "billing"
  | "churn"
  | "inbox"
  | "journeys"
  | "scheduler"
  | "workouts"
  | "integrations"
  | "inquiries";

export const PAGE_ACCESS: Record<AdminPage, UserRole[]> = {
  overview: ["admin", "staff", "front_desk"],
  teams: ["admin"],
  scores: ["admin", "staff", "front_desk"],
  // Score entry is staff + admin only. Refs don't get it (they ref,
  // they don't score-keep — separate role). Every entry is attributed
  // to the authenticated user via game_scores.updated_by so admin
  // can verify who worked the game.
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
  // audit_log + search expose PII in before/after snapshots + cross-entity
  // result sets. Health exposes infra config. All three are admin-only.
  audit_log: ["admin"],
  search: ["admin"],
  health: ["admin"],
  // Staff management + payroll are admin-only by design — pay rates
  // and 1099 YTD totals are sensitive.
  roster: ["admin"],
  timeclock: ["admin", "front_desk"],
  shifts: ["admin"],
  resources: ["admin"],
  payroll: ["admin"],
  // Member mgmt — front desk needs create/edit to check people in at
  // the counter; plan pricing + billing info is admin-only at the
  // API layer (list returns trimmed fields for non-admin roles).
  members: ["admin", "front_desk"],
  // Certifications track expirations for compliance. Admin-only
  // because cert docs may contain PII.
  certifications: ["admin"],
  // Maintenance tickets — front desk files them, admin triages.
  maintenance: ["admin", "front_desk", "staff"],
  // Programs (camps, clinics, classes, open gym, private training).
  // Front desk registers participants at the counter.
  programs: ["admin", "front_desk"],
  // Time-off requests — admin approves; staff file their own from
  // the portal (handled by a separate portal endpoint).
  time_off: ["admin"],
  // Equipment inventory — everyone with admin-surface access can
  // record usage (took 2 basketballs out) + file reorder alerts.
  equipment: ["admin", "front_desk", "staff"],
  // Owner Mode — single-screen executive dashboard. Admin only.
  owner: ["admin"],
  // Billing — subscription management, retries, dunning. Admin only;
  // moves money so we don't broaden it.
  billing: ["admin"],
  // Churn radar — projected revenue at risk + win-back drafts. Admin only.
  churn: ["admin"],
  // Two-way SMS inbox — admin + front desk (member service desk).
  inbox: ["admin", "front_desk"],
  // Journey automation — admin only (controls the autopilot).
  journeys: ["admin"],
  // AI scheduler — auto-fill open shifts. Admin only (commits assignments).
  scheduler: ["admin"],
  // Workouts library — admin + staff (coaches manage class WODs).
  workouts: ["admin", "staff"],
  // Integrations — public API keys + webhook subscriptions. Admin only;
  // keys grant external read/write to PII.
  integrations: ["admin"],
  // Inquiries pipeline — admin + front desk (front desk handles first
  // touch on most inquiries; admin sees the funnel).
  inquiries: ["admin", "front_desk"],
};

// All admin pages, in display order. Used by the permissions matrix UI.
export const ALL_ADMIN_PAGES: AdminPage[] = [
  "overview", "teams", "scores", "score_entry", "players", "checkin",
  "staff_refs", "revenue", "prospects", "files", "analytics", "contacts",
  "tournaments", "sponsors", "schools", "content", "users", "portal",
  "my_schedule", "my_history", "announcements", "leads", "approvals",
  "audit_log", "search", "health", "roster", "timeclock", "shifts",
  "resources", "payroll", "members", "certifications", "maintenance",
  "programs", "time_off", "equipment", "owner", "billing", "churn",
  "inbox", "journeys", "scheduler", "workouts", "integrations", "inquiries",
];

// Page groups for the matrix UI. Mirrors the AdminButtonGrid sections
// so the permissions view reads like the nav.
export const PAGE_GROUPS: Array<{ heading: string; pages: AdminPage[] }> = [
  { heading: "Overview", pages: ["overview", "owner", "search", "health"] },
  { heading: "Events", pages: ["tournaments", "teams", "players", "programs"] },
  { heading: "Game Day", pages: ["score_entry", "scores", "checkin"] },
  { heading: "Staff", pages: ["roster", "staff_refs", "scheduler", "timeclock", "shifts", "payroll", "certifications", "time_off", "approvals"] },
  { heading: "Members + Revenue", pages: ["members", "billing", "churn", "inquiries", "workouts", "revenue", "leads", "prospects", "sponsors"] },
  { heading: "Facility", pages: ["resources", "equipment", "maintenance", "schools"] },
  { heading: "Content & Comms", pages: ["announcements", "content", "files", "inbox"] },
  { heading: "Admin", pages: ["users", "audit_log", "analytics", "contacts", "integrations", "portal"] },
  { heading: "Personal", pages: ["my_schedule", "my_history"] },
];

export const PAGE_LABELS: Record<AdminPage, string> = {
  overview: "Dashboard overview",
  teams: "Teams",
  scores: "Game scores",
  score_entry: "Enter scores",
  players: "Players database",
  checkin: "Team check-in",
  staff_refs: "Staff & refs",
  revenue: "Revenue",
  prospects: "Prospects pipeline",
  files: "Files & drive",
  analytics: "GA analytics",
  contacts: "Contacts",
  tournaments: "Tournaments",
  sponsors: "Sponsors",
  schools: "Schools",
  content: "Content editor",
  users: "User accounts",
  portal: "Portal switcher",
  my_schedule: "My schedule",
  my_history: "My history",
  announcements: "Announcements",
  leads: "Leads pipeline",
  approvals: "Pending approvals",
  audit_log: "Audit log",
  search: "Global search",
  health: "System health",
  roster: "Staff roster",
  timeclock: "Time clock",
  shifts: "Shift board",
  resources: "Rental fleet",
  payroll: "Payroll",
  members: "Members",
  certifications: "Certifications",
  maintenance: "Maintenance",
  programs: "Programs",
  time_off: "Time off",
  equipment: "Inventory",
  owner: "Owner Mode",
  billing: "Billing",
  churn: "Churn Radar",
  inbox: "SMS Inbox",
  journeys: "Journey Automation",
  scheduler: "AI Scheduler",
  workouts: "Workouts",
  integrations: "Integrations",
  inquiries: "Inquiries",
};

// Role-based default access check. Kept for all call sites that
// already pass just a role (middleware, layout checks, etc.).
export function canAccess(role: UserRole | undefined, page: AdminPage): boolean {
  if (!role) return false;
  return PAGE_ACCESS[page]?.includes(role) ?? false;
}

export type PermissionOverride = {
  page: AdminPage;
  granted: boolean;
  expiresAt?: string | null;
};

// Returns true if the override has an expiresAt that is strictly in
// the past. Expired overrides are ignored by canAccessWithOverrides.
function isExpired(o: PermissionOverride, atMs: number = Date.now()): boolean {
  if (!o.expiresAt) return false;
  const t = new Date(o.expiresAt).getTime();
  return Number.isFinite(t) && t < atMs;
}

// Role-default layered with per-user overrides. Call this where you
// have the user's full permission set available (session callback,
// permission-aware API handlers). Overrides beat defaults — a `false`
// override revokes even an admin's access. Expired overrides are
// ignored.
export function canAccessWithOverrides(
  role: UserRole | undefined,
  page: AdminPage,
  overrides: PermissionOverride[] | undefined
): boolean {
  if (!role) return false;
  const override = overrides?.find((o) => o.page === page && !isExpired(o));
  if (override) return override.granted;
  return canAccess(role, page);
}

// Returns the full effective map for a user: every admin page →
// boolean. Used by the permissions matrix UI to render the grid.
export function effectivePermissions(
  role: UserRole | undefined,
  overrides: PermissionOverride[] | undefined
): Record<AdminPage, { granted: boolean; source: "role" | "override" | "expired" }> {
  const out = {} as Record<AdminPage, { granted: boolean; source: "role" | "override" | "expired" }>;
  for (const page of ALL_ADMIN_PAGES) {
    const override = overrides?.find((o) => o.page === page);
    if (override && !isExpired(override)) {
      out[page] = { granted: override.granted, source: "override" };
    } else if (override) {
      // Row exists but is expired — render as role default but flag so
      // admin UI can show "(expired)" hint if it wants.
      out[page] = { granted: canAccess(role, page), source: "expired" };
    } else {
      out[page] = { granted: canAccess(role, page), source: "role" };
    }
  }
  return out;
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
