"use client";

import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Check,
  X,
  Shield,
} from "lucide-react";

// Mirrors PAGE_ACCESS in lib/permissions.ts. Duplicated here because
// this is a read-only reference view and we want it client-renderable
// without pulling the whole permissions module (which is fine to pull,
// but keeping it inline keeps this a quick reference card page).

const ROLES = ["admin", "staff", "ref", "front_desk", "coach", "parent"] as const;
type Role = typeof ROLES[number];

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  staff: "Staff",
  ref: "Referee",
  front_desk: "Front Desk",
  coach: "Coach",
  parent: "Parent",
};

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-navy text-white",
  staff: "bg-blue-50 text-blue-700",
  ref: "bg-amber-50 text-amber-700",
  front_desk: "bg-cyan-50 text-cyan-700",
  coach: "bg-emerald-50 text-emerald-700",
  parent: "bg-purple-50 text-purple-700",
};

// Exact mirror of PAGE_ACCESS in lib/permissions.ts.
const PAGE_ACCESS: Record<string, Role[]> = {
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
  audit_log: ["admin"],
  search: ["admin"],
  health: ["admin"],
  roster: ["admin"],
  timeclock: ["admin", "front_desk"],
  shifts: ["admin"],
  resources: ["admin"],
  payroll: ["admin"],
  members: ["admin", "front_desk"],
  certifications: ["admin"],
  maintenance: ["admin", "front_desk", "staff"],
  programs: ["admin", "front_desk"],
  time_off: ["admin"],
  equipment: ["admin", "front_desk", "staff"],
};

const PAGE_GROUPS: Array<{ heading: string; pages: Array<{ key: string; label: string }> }> = [
  { heading: "Overview", pages: [{ key: "overview", label: "Dashboard" }, { key: "search", label: "Search" }, { key: "health", label: "Health" }] },
  { heading: "Events", pages: [{ key: "tournaments", label: "Tournaments" }, { key: "teams", label: "Teams" }, { key: "players", label: "Players" }, { key: "programs", label: "Programs" }] },
  { heading: "Game Day", pages: [{ key: "score_entry", label: "Score Entry" }, { key: "scores", label: "Scores" }, { key: "checkin", label: "Check-in" }] },
  { heading: "Staff", pages: [{ key: "roster", label: "Roster" }, { key: "staff_refs", label: "Staff & Refs" }, { key: "timeclock", label: "Time Clock" }, { key: "shifts", label: "Shifts" }, { key: "payroll", label: "Payroll" }, { key: "certifications", label: "Certifications" }, { key: "time_off", label: "Time Off" }, { key: "approvals", label: "Approvals" }] },
  { heading: "Members + Revenue", pages: [{ key: "members", label: "Members" }, { key: "revenue", label: "Revenue" }, { key: "leads", label: "Leads" }, { key: "prospects", label: "Prospects" }, { key: "sponsors", label: "Sponsors" }] },
  { heading: "Facility", pages: [{ key: "resources", label: "Fleet" }, { key: "equipment", label: "Equipment" }, { key: "maintenance", label: "Maintenance" }, { key: "schools", label: "Schools" }] },
  { heading: "Content & Comms", pages: [{ key: "announcements", label: "Announcements" }, { key: "content", label: "Content" }, { key: "files", label: "Files" }] },
  { heading: "Admin", pages: [{ key: "users", label: "Users" }, { key: "audit_log", label: "Audit Log" }, { key: "analytics", label: "Analytics" }, { key: "contacts", label: "Contacts" }, { key: "portal", label: "Portal" }] },
  { heading: "Personal", pages: [{ key: "my_schedule", label: "My Schedule" }, { key: "my_history", label: "My History" }] },
];

export default function RoleDefaultsPage() {
  function has(role: Role, page: string): boolean {
    return (PAGE_ACCESS[page] || []).includes(role);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin/permissions" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Permissions
      </Link>

      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Reference</p>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8 text-red" />
            Role Defaults
          </h1>
          <p className="text-white/60 text-sm max-w-xl">
            The baseline access each role gets before any per-user overrides. Use this to decide who needs a grant or revoke.
          </p>
        </div>
      </section>

      {/* Matrix */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-off-white border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-navy font-bold text-xs uppercase tracking-wider">Page</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-3 text-center">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${ROLE_STYLES[r]}`}>
                      {ROLE_LABELS[r]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
              {PAGE_GROUPS.map((group) => (
                <tbody key={group.heading}>
                  <tr>
                    <td colSpan={ROLES.length + 1} className="bg-off-white/60 px-5 py-2 text-navy font-bold text-[11px] uppercase tracking-wider border-t border-border">
                      {group.heading}
                    </td>
                  </tr>
                  {group.pages.map((page) => (
                    <tr key={page.key} className="border-t border-border hover:bg-off-white/40">
                      <td className="px-5 py-2.5">
                        <p className="text-navy font-semibold">{page.label}</p>
                        <p className="text-text-muted text-[10px] font-mono">{page.key}</p>
                      </td>
                      {ROLES.map((r) => (
                        <td key={r} className="px-3 py-2.5 text-center">
                          {has(r, page.key) ? (
                            <Check className="w-4 h-4 text-emerald-600 inline-block" />
                          ) : (
                            <X className="w-4 h-4 text-text-muted/40 inline-block" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
          </table>
        </div>
      </div>

      <div className="mt-6 bg-white border border-border rounded-2xl shadow-sm p-5 flex items-start gap-3">
        <Shield className="w-5 h-5 text-red flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-navy font-bold text-sm mb-1">Want someone to have extra access?</p>
          <p className="text-text-muted text-xs mb-3">
            Instead of changing a user's role (which affects their whole experience), add a per-user override.
            Overrides beat defaults — you can grant a Coach access to /admin/scores, or revoke /admin/payroll from a Staff member.
          </p>
          <Link
            href="/admin/permissions"
            className="inline-flex items-center gap-1.5 bg-red hover:bg-red-hover text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full"
          >
            Open permissions matrix
          </Link>
        </div>
      </div>
    </div>
  );
}
