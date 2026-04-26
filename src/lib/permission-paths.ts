import type { AdminPage } from "@/lib/permissions";

// Admin URL path → AdminPage enum. Longest-prefix match wins so
// /admin/tournaments/manage routes to "tournaments" even though
// there's no exact entry for the nested path.
//
// Keep these ordered from most-specific to least-specific within the
// same root so the matcher picks the right page. Path segments that
// have no permission key stay absent — those paths fall through to
// a role-only check.
const PATH_TO_PAGE: Array<{ prefix: string; page: AdminPage }> = [
  // Events
  { prefix: "/admin/tournaments", page: "tournaments" },
  { prefix: "/admin/teams", page: "teams" },
  { prefix: "/admin/players", page: "players" },
  { prefix: "/admin/programs", page: "programs" },

  // Game day
  { prefix: "/admin/scores/enter", page: "score_entry" },
  { prefix: "/admin/scores", page: "scores" },
  { prefix: "/admin/checkin", page: "checkin" },
  { prefix: "/admin/waivers", page: "tournaments" },

  // Staff
  { prefix: "/admin/roster", page: "roster" },
  { prefix: "/admin/timeclock", page: "timeclock" },
  { prefix: "/admin/shifts", page: "shifts" },
  { prefix: "/admin/payroll", page: "payroll" },
  { prefix: "/admin/availability", page: "roster" },
  { prefix: "/admin/certifications", page: "certifications" },
  { prefix: "/admin/time-off", page: "time_off" },
  { prefix: "/admin/staffing", page: "roster" },
  { prefix: "/admin/approvals", page: "approvals" },

  // Members + revenue
  { prefix: "/admin/members", page: "members" },
  { prefix: "/admin/membership-plans", page: "members" },
  { prefix: "/admin/revenue", page: "revenue" },
  { prefix: "/admin/leads", page: "leads" },
  { prefix: "/admin/prospects", page: "prospects" },
  { prefix: "/admin/sponsors", page: "sponsors" },

  // Facility
  { prefix: "/admin/resources", page: "resources" },
  { prefix: "/admin/rentals", page: "resources" },
  { prefix: "/admin/equipment", page: "equipment" },
  { prefix: "/admin/maintenance", page: "maintenance" },
  { prefix: "/admin/schools", page: "schools" },

  // Content & comms
  { prefix: "/admin/announcements", page: "announcements" },
  { prefix: "/admin/content", page: "content" },
  { prefix: "/admin/files", page: "files" },
  { prefix: "/admin/gym-schedule", page: "overview" },

  // Admin
  { prefix: "/admin/users", page: "users" },
  { prefix: "/admin/permissions", page: "users" },
  { prefix: "/admin/audit-log", page: "audit_log" },
  { prefix: "/admin/reports", page: "analytics" },
  { prefix: "/admin/analytics", page: "analytics" },
  { prefix: "/admin/contacts", page: "contacts" },
  { prefix: "/admin/launch-readiness", page: "users" },
  { prefix: "/admin/launch-status", page: "users" },
  { prefix: "/admin/security", page: "users" },

  // Cycle 1+2 ships — these were missing from the path map, so
  // per-user permission overrides on these pages weren't enforced
  // by middleware. Admin role still passed (catch-all), but staff /
  // front_desk could slip past page-level gates because
  // pageFromAdminPath returned null → role-only check.
  { prefix: "/admin/owner", page: "owner" },
  { prefix: "/admin/billing", page: "billing" },
  { prefix: "/admin/churn", page: "churn" },
  { prefix: "/admin/inbox", page: "inbox" },
  { prefix: "/admin/scheduler", page: "scheduler" },
  { prefix: "/admin/workouts", page: "workouts" },
  { prefix: "/admin/integrations", page: "integrations" },
  { prefix: "/admin/inquiries", page: "inquiries" },
  { prefix: "/admin/search", page: "search" },

  // Personal — profile always accessible (every user has their own),
  // mapped to "overview" so the page-gate layer treats it as baseline.
  { prefix: "/admin/profile", page: "overview" },
  { prefix: "/admin/my-schedule", page: "my_schedule" },
  { prefix: "/admin/my-history", page: "my_history" },
  { prefix: "/admin/ops", page: "overview" },
];

export function pageFromAdminPath(pathname: string): AdminPage | null {
  // Longest-match wins.
  let best: { prefix: string; page: AdminPage } | null = null;
  for (const m of PATH_TO_PAGE) {
    if (pathname === m.prefix || pathname.startsWith(m.prefix + "/")) {
      if (!best || m.prefix.length > best.prefix.length) best = m;
    }
  }
  return best?.page ?? null;
}
