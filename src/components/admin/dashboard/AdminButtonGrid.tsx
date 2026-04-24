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
} from "lucide-react";
import { canAccess } from "@/lib/permissions";
import type { AdminPage } from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";

/**
 * Tile grid of every admin section — rendered on /admin so coaches +
 * front-desk + admins can jump straight into their most-used area
 * without opening the sidebar/drawer. Permission-gated via canAccess()
 * so lower-privilege roles only see what they can actually open.
 */

type Tile = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  page: AdminPage;
  tint: "red" | "navy" | "emerald" | "amber" | "blue" | "purple";
};

const SECTIONS: { heading: string; tiles: Tile[] }[] = [
  {
    heading: "Events",
    tiles: [
      { href: "/admin/tournaments/manage", label: "Tournaments", icon: Trophy, page: "tournaments", tint: "red" },
      { href: "/admin/teams", label: "Teams", icon: Users, page: "teams", tint: "red" },
      { href: "/admin/players", label: "Players", icon: UserCheck, page: "players", tint: "red" },
      { href: "/admin/programs", label: "Programs", icon: Calendar, page: "programs", tint: "red" },
    ],
  },
  {
    heading: "Game Day",
    tiles: [
      { href: "/admin/scores/enter", label: "Enter Scores", icon: PenLine, page: "score_entry", tint: "emerald" },
      { href: "/admin/scores", label: "Game Scores", icon: ClipboardList, page: "scores", tint: "emerald" },
      { href: "/admin/checkin", label: "Check-In", icon: UserCheck, page: "checkin", tint: "emerald" },
      { href: "/admin/waivers", label: "Waivers", icon: FileSignature, page: "tournaments", tint: "emerald" },
    ],
  },
  {
    heading: "Staff",
    tiles: [
      { href: "/admin/roster", label: "Staff Roster", icon: IdCard, page: "roster", tint: "blue" },
      { href: "/admin/timeclock", label: "Time Clock", icon: Clock, page: "timeclock", tint: "blue" },
      { href: "/admin/shifts", label: "Shifts", icon: CalendarDays, page: "shifts", tint: "blue" },
      { href: "/admin/payroll", label: "Payroll", icon: Wallet, page: "payroll", tint: "blue" },
      { href: "/admin/availability", label: "Availability", icon: Calendar, page: "roster", tint: "blue" },
      { href: "/admin/certifications", label: "Certifications", icon: BadgeCheck, page: "certifications", tint: "blue" },
      { href: "/admin/time-off", label: "Time Off", icon: Plane, page: "time_off", tint: "blue" },
    ],
  },
  {
    heading: "Members + Revenue",
    tiles: [
      { href: "/admin/members", label: "Members", icon: Users, page: "members", tint: "purple" },
      { href: "/admin/membership-plans", label: "Plans", icon: ClipboardList, page: "members", tint: "purple" },
      { href: "/admin/revenue", label: "Revenue", icon: DollarSign, page: "revenue", tint: "purple" },
      { href: "/admin/leads", label: "Leads", icon: TrendingUp, page: "leads", tint: "purple" },
      { href: "/admin/sponsors", label: "Sponsors", icon: Handshake, page: "sponsors", tint: "purple" },
    ],
  },
  {
    heading: "Facility",
    tiles: [
      { href: "/admin/resources", label: "Resources", icon: Truck, page: "resources", tint: "amber" },
      { href: "/admin/equipment", label: "Equipment", icon: Package, page: "equipment", tint: "amber" },
      { href: "/admin/maintenance", label: "Maintenance", icon: Wrench, page: "maintenance", tint: "amber" },
      { href: "/admin/schools", label: "Schools", icon: GraduationCap, page: "schools", tint: "amber" },
    ],
  },
  {
    heading: "Admin",
    tiles: [
      { href: "/admin/approvals", label: "Approvals", icon: Shield, page: "approvals", tint: "navy" },
      { href: "/admin/users", label: "User Accounts", icon: Shield, page: "users", tint: "navy" },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone, page: "announcements", tint: "navy" },
      { href: "/admin/content", label: "Content Editor", icon: FileEdit, page: "content", tint: "navy" },
      { href: "/admin/files", label: "Files & Drive", icon: FolderOpen, page: "files", tint: "navy" },
      { href: "/admin/reports", label: "Reports", icon: BarChart3, page: "analytics", tint: "navy" },
      { href: "/admin/analytics", label: "GA Analytics", icon: BarChart3, page: "analytics", tint: "navy" },
      { href: "/admin/audit-log", label: "Audit Log", icon: History, page: "audit_log", tint: "navy" },
      { href: "/admin/launch-readiness", label: "Launch", icon: Rocket, page: "users", tint: "navy" },
    ],
  },
  {
    heading: "Personal",
    tiles: [
      { href: "/admin/my-schedule", label: "My Schedule", icon: Calendar, page: "my_schedule", tint: "navy" },
      { href: "/admin/my-history", label: "My History", icon: History, page: "my_history", tint: "navy" },
      { href: "/admin/ops", label: "Ops Dashboard", icon: LayoutDashboard, page: "overview", tint: "navy" },
    ],
  },
];

const TINT_CLASS: Record<Tile["tint"], { bg: string; icon: string; hover: string }> = {
  red: { bg: "bg-red/10", icon: "text-red", hover: "hover:border-red/40" },
  navy: { bg: "bg-navy/5", icon: "text-navy", hover: "hover:border-navy/40" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-700", hover: "hover:border-emerald-300" },
  amber: { bg: "bg-amber-50", icon: "text-amber-700", hover: "hover:border-amber-300" },
  blue: { bg: "bg-blue-50", icon: "text-blue-700", hover: "hover:border-blue-300" },
  purple: { bg: "bg-purple-50", icon: "text-purple-700", hover: "hover:border-purple-300" },
};

export default function AdminButtonGrid() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "") as UserRole | "";

  if (!role) return null;

  // Filter every section to the tiles this role can open.
  const visible = SECTIONS.map((s) => ({
    heading: s.heading,
    tiles: s.tiles.filter((t) => canAccess(role, t.page)),
  })).filter((s) => s.tiles.length > 0);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-5">
      {visible.map((section) => (
        <div key={section.heading}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
            {section.heading}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {section.tiles.map((t) => {
              const tint = TINT_CLASS[t.tint];
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`bg-white border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 text-center transition-all min-h-[88px] justify-center ${tint.hover}`}
                >
                  <div className={`w-9 h-9 rounded-lg ${tint.bg} flex items-center justify-center flex-shrink-0`}>
                    <t.icon className={`w-4.5 h-4.5 ${tint.icon}`} aria-hidden={true} />
                  </div>
                  <span className="text-[11px] font-semibold text-navy leading-tight">
                    {t.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
