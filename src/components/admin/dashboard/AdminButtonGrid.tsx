"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Users,
  UserCheck,
  ClipboardList,
  PenLine,
  BarChart3,
  FolderOpen,
  Megaphone,
  GraduationCap,
  FileEdit,
  Shield,
  History,
  CalendarDays,
  Clock,
  Wallet,
  Truck,
  Package,
  Wrench,
  BadgeCheck,
  Plane,
  DollarSign,
  TrendingUp,
  Calendar,
  IdCard,
  LayoutDashboard,
  Rocket,
  FileSignature,
  Handshake,
  ArrowUpRight,
} from "lucide-react";
import { canAccess } from "@/lib/permissions";
import type { AdminPage } from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";

/**
 * Dramatic tile wall of every admin section — rendered on /admin. Each
 * section has its own color identity (accent bar + icon tint) so the
 * eye can lock onto "Staff" or "Events" from across the dashboard.
 * Permission-gated via canAccess().
 */

type Tile = {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  page: AdminPage;
};

type Tint = "red" | "emerald" | "blue" | "purple" | "amber" | "navy";

type Section = {
  heading: string;
  blurb: string;
  tint: Tint;
  tiles: Tile[];
};

const SECTIONS: Section[] = [
  {
    heading: "Events",
    blurb: "Tournaments, teams, and programs",
    tint: "red",
    tiles: [
      { href: "/admin/tournaments/manage", label: "Tournaments", desc: "Brackets + registration", icon: Trophy, page: "tournaments" },
      { href: "/admin/teams", label: "Teams", desc: "Roster database", icon: Users, page: "teams" },
      { href: "/admin/players", label: "Players", desc: "Eligibility + check-ins", icon: UserCheck, page: "players" },
      { href: "/admin/programs", label: "Programs", desc: "Camps + clinics", icon: Calendar, page: "programs" },
      { href: "/admin/gym-schedule", label: "Gym Calendar", desc: "Owner's schedule", icon: Calendar, page: "overview" as AdminPage },
    ],
  },
  {
    heading: "Game Day",
    blurb: "Scores, check-ins, waivers",
    tint: "emerald",
    tiles: [
      { href: "/admin/scores/enter", label: "Enter Scores", desc: "Live scorekeeping", icon: PenLine, page: "score_entry" },
      { href: "/admin/scores", label: "Game Scores", desc: "Results history", icon: ClipboardList, page: "scores" },
      { href: "/admin/checkin", label: "Check-In", desc: "Team + player", icon: UserCheck, page: "checkin" },
      { href: "/admin/waivers", label: "Waivers", desc: "Signatures on file", icon: FileSignature, page: "tournaments" },
    ],
  },
  {
    heading: "Staff",
    blurb: "Shifts, clock, payroll, PTO",
    tint: "blue",
    tiles: [
      { href: "/admin/roster", label: "Staff Roster", desc: "People directory", icon: IdCard, page: "roster" },
      { href: "/admin/timeclock", label: "Time Clock", desc: "Who's on the floor", icon: Clock, page: "timeclock" },
      { href: "/admin/shifts", label: "Shifts", desc: "Schedule board", icon: CalendarDays, page: "shifts" },
      { href: "/admin/payroll", label: "Payroll", desc: "Run pay periods", icon: Wallet, page: "payroll" },
      { href: "/admin/availability", label: "Availability", desc: "When staff can work", icon: Calendar, page: "roster" },
      { href: "/admin/certifications", label: "Certifications", desc: "Expiring docs", icon: BadgeCheck, page: "certifications" },
      { href: "/admin/time-off", label: "Time Off", desc: "PTO requests", icon: Plane, page: "time_off" },
      { href: "/admin/staffing", label: "Staffing Plan", desc: "Game-day headcount", icon: Users, page: "roster" },
    ],
  },
  {
    heading: "Members + Revenue",
    blurb: "Paying customers & growth",
    tint: "purple",
    tiles: [
      { href: "/admin/members", label: "Members", desc: "Active memberships", icon: Users, page: "members" },
      { href: "/admin/membership-plans", label: "Plans", desc: "Tiers + pricing", icon: ClipboardList, page: "members" },
      { href: "/admin/revenue", label: "Revenue", desc: "Cash + card + Square", icon: DollarSign, page: "revenue" },
      { href: "/admin/leads", label: "Leads", desc: "Prospects pipeline", icon: TrendingUp, page: "leads" },
      { href: "/admin/sponsors", label: "Sponsors", desc: "Partners & deals", icon: Handshake, page: "sponsors" },
    ],
  },
  {
    heading: "Facility",
    blurb: "Gym operations",
    tint: "amber",
    tiles: [
      { href: "/admin/resources", label: "Fleet", desc: "Vehicles + rentals", icon: Truck, page: "resources" },
      { href: "/admin/rentals", label: "Rentals", desc: "Active contracts", icon: FileSignature, page: "resources" },
      { href: "/admin/equipment", label: "Equipment", desc: "Balls, cones, scoreboards", icon: Package, page: "equipment" },
      { href: "/admin/maintenance", label: "Maintenance", desc: "Work orders", icon: Wrench, page: "maintenance" },
      { href: "/admin/schools", label: "Schools", desc: "Partner contacts", icon: GraduationCap, page: "schools" },
    ],
  },
  {
    heading: "Admin",
    blurb: "Configuration & audit",
    tint: "navy",
    tiles: [
      { href: "/admin/approvals", label: "Approvals", desc: "Pending staff", icon: Shield, page: "approvals" },
      { href: "/admin/users", label: "User Accounts", desc: "Everyone with a login", icon: Shield, page: "users" },
      { href: "/admin/announcements", label: "Announcements", desc: "Push to portals", icon: Megaphone, page: "announcements" },
      { href: "/admin/content", label: "Content Editor", desc: "Public site copy", icon: FileEdit, page: "content" },
      { href: "/admin/files", label: "Files & Drive", desc: "Uploads + Google Drive", icon: FolderOpen, page: "files" },
      { href: "/admin/reports", label: "Reports", desc: "Exports + PDFs", icon: BarChart3, page: "analytics" },
      { href: "/admin/analytics", label: "GA Analytics", desc: "Traffic + conversions", icon: BarChart3, page: "analytics" },
      { href: "/admin/audit-log", label: "Audit Log", desc: "Who did what", icon: History, page: "audit_log" },
      { href: "/admin/launch-readiness", label: "Launch", desc: "Pre-flight checklist", icon: Rocket, page: "users" },
      { href: "/admin/gym-schedule", label: "Gym Calendar", desc: "Owner's schedule", icon: Calendar, page: "overview" as AdminPage },
    ],
  },
  {
    heading: "Personal",
    blurb: "Your view",
    tint: "navy",
    tiles: [
      { href: "/admin/my-schedule", label: "My Schedule", desc: "Your shifts", icon: Calendar, page: "my_schedule" },
      { href: "/admin/my-history", label: "My History", desc: "Past pay periods", icon: History, page: "my_history" },
      { href: "/admin/ops", label: "Ops Dashboard", desc: "Live operations", icon: LayoutDashboard, page: "overview" },
    ],
  },
];

// Tint palette — each section's identity color surfaces on the
// accent bar, icon background, and hover halo.
const TINT: Record<
  Tint,
  {
    bar: string;
    iconBg: string;
    iconFg: string;
    badgeBg: string;
    badgeFg: string;
    hoverRing: string;
  }
> = {
  red: {
    bar: "bg-red",
    iconBg: "bg-red/10",
    iconFg: "text-red",
    badgeBg: "bg-red/10",
    badgeFg: "text-red",
    hoverRing: "hover:border-red/40 hover:shadow-red/10",
  },
  emerald: {
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    iconFg: "text-emerald-600",
    badgeBg: "bg-emerald-50",
    badgeFg: "text-emerald-700",
    hoverRing: "hover:border-emerald-300 hover:shadow-emerald-100",
  },
  blue: {
    bar: "bg-blue-500",
    iconBg: "bg-blue-50",
    iconFg: "text-blue-600",
    badgeBg: "bg-blue-50",
    badgeFg: "text-blue-700",
    hoverRing: "hover:border-blue-300 hover:shadow-blue-100",
  },
  purple: {
    bar: "bg-purple-500",
    iconBg: "bg-purple-50",
    iconFg: "text-purple-600",
    badgeBg: "bg-purple-50",
    badgeFg: "text-purple-700",
    hoverRing: "hover:border-purple-300 hover:shadow-purple-100",
  },
  amber: {
    bar: "bg-amber-500",
    iconBg: "bg-amber-50",
    iconFg: "text-amber-600",
    badgeBg: "bg-amber-50",
    badgeFg: "text-amber-700",
    hoverRing: "hover:border-amber-300 hover:shadow-amber-100",
  },
  navy: {
    bar: "bg-navy",
    iconBg: "bg-navy/5",
    iconFg: "text-navy",
    badgeBg: "bg-navy/5",
    badgeFg: "text-navy",
    hoverRing: "hover:border-navy/40 hover:shadow-navy/10",
  },
};

export default function AdminButtonGrid() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "") as UserRole | "";

  if (!role) return null;

  const visible = SECTIONS.map((s) => ({
    ...s,
    tiles: s.tiles.filter((t) => canAccess(role, t.page)),
  })).filter((s) => s.tiles.length > 0);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-10">
      {visible.map((section) => {
        const tint = TINT[section.tint];
        return (
          <div key={section.heading}>
            {/* Section header with accent bar + count badge */}
            <div className="flex items-end justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  aria-hidden="true"
                  className={`w-1 h-10 rounded-full ${tint.bar}`}
                />
                <div className="min-w-0">
                  <h2 className="text-navy font-heading text-xl sm:text-2xl font-bold tracking-tight">
                    {section.heading}
                  </h2>
                  <p className="text-text-muted text-xs mt-0.5">
                    {section.blurb}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${tint.badgeBg} ${tint.badgeFg} flex-shrink-0`}
              >
                {section.tiles.length} {section.tiles.length === 1 ? "tool" : "tools"}
              </span>
            </div>

            {/* Tile grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {section.tiles.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`group relative bg-white border border-border rounded-2xl p-4 transition-all shadow-sm hover:shadow-md ${tint.hoverRing}`}
                >
                  {/* Accent stripe on hover */}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full ${tint.bar} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${tint.iconBg} flex items-center justify-center`}
                    >
                      <t.icon className={`w-5 h-5 ${tint.iconFg}`} aria-hidden={true} />
                    </div>
                    <ArrowUpRight
                      className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-navy font-bold text-sm leading-tight">
                    {t.label}
                  </p>
                  <p className="text-text-muted text-xs mt-1 leading-snug line-clamp-1">
                    {t.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
