"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Trophy,
  DollarSign,
  UserCheck,
  ClipboardList,
  MessageSquare,
  ExternalLink,
  LogOut,
  Menu,
  X,
  FileEdit,
  BarChart3,
  TrendingUp,
  FolderOpen,
  Handshake,
  GraduationCap,
  Shield,
  PenLine,
  Columns3,
  Calendar,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccess, ROLE_LABELS } from "@/lib/permissions";
import type { AdminPage } from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  page: AdminPage;
};

const OPERATIONS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, page: "overview" },
  { href: "/admin/teams", label: "Teams", icon: Users, page: "teams" },
  { href: "/admin/scores", label: "Game Scores", icon: ClipboardList, page: "scores" },
  { href: "/admin/scores/enter", label: "Score Entry", icon: PenLine, page: "score_entry" },
  { href: "/admin/players", label: "Players", icon: UserCheck, page: "players" },
  { href: "/admin/checkin", label: "Check-In", icon: UserCheck, page: "checkin" },
  { href: "/admin/staff", label: "Staff & Refs", icon: UserCheck, page: "staff_refs" },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign, page: "revenue" },
  { href: "/admin/prospects", label: "Prospects", icon: TrendingUp, page: "prospects" },
];

const RESOURCES: NavItem[] = [
  { href: "/admin/files", label: "Files & Drive", icon: FolderOpen, page: "files" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, page: "analytics" },
  { href: "/admin/contacts", label: "Leads", icon: MessageSquare, page: "contacts" },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy, page: "tournaments" },
  { href: "/admin/sponsors", label: "Sponsorships", icon: Handshake, page: "sponsors" },
  { href: "/admin/schools", label: "Schools", icon: GraduationCap, page: "schools" },
  { href: "/admin/content", label: "Content Editor", icon: FileEdit, page: "content" },
  { href: "/admin/users", label: "User Accounts", icon: Shield, page: "users" },
];

const PERSONAL: NavItem[] = [
  { href: "/admin/my-schedule", label: "My Schedule", icon: Calendar, page: "my_schedule" },
  { href: "/admin/my-history", label: "My Work History", icon: History, page: "my_history" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user?.role || "admin") as UserRole;

  const visibleOps = OPERATIONS.filter((item) => canAccess(role, item.page));
  const visibleRes = RESOURCES.filter((item) => canAccess(role, item.page));
  const visiblePersonal = PERSONAL.filter((item) => canAccess(role, item.page));

  function NavLink({ item }: { item: NavItem }) {
    const active =
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors",
          active
            ? "bg-accent/10 text-accent"
            : "text-text-secondary hover:text-white hover:bg-bg"
        )}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-bg-secondary border border-border rounded-sm p-2 text-white"
        aria-label="Toggle sidebar"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-[56] h-full w-64 bg-bg-secondary border-r border-border flex flex-col transition-transform duration-300",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={36} height={36} className="object-contain" />
            <div>
              <span className="text-white font-bold text-sm uppercase tracking-tight block">Inspire Courts</span>
              <span className="text-text-secondary text-[10px] uppercase tracking-widest">{ROLE_LABELS[role] || "Dashboard"}</span>
            </div>
          </Link>
        </div>

        {/* User info */}
        <div className="px-5 py-3 border-b border-border">
          <p className="text-white text-sm font-medium truncate">{session?.user?.name || "Admin"}</p>
          <p className="text-text-secondary text-xs truncate">{session?.user?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {/* Personal section (staff, ref, front_desk) */}
          {visiblePersonal.length > 0 && (
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">My Dashboard</p>
              <div className="space-y-0.5">
                {visiblePersonal.map((item) => <NavLink key={item.href} item={item} />)}
              </div>
            </div>
          )}

          {visibleOps.length > 0 && (
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">Operations</p>
              <div className="space-y-0.5">
                {visibleOps.map((item) => <NavLink key={item.href} item={item} />)}
              </div>
            </div>
          )}

          {visibleRes.length > 0 && (
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">Resources</p>
              <div className="space-y-0.5">
                {visibleRes.map((item) => <NavLink key={item.href} item={item} />)}
              </div>
            </div>
          )}

          {/* Admin portal link */}
          {role === "admin" && (
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">Portals</p>
              <div className="space-y-0.5">
                <Link href="/portal" onClick={() => setOpen(false)} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors", pathname.startsWith("/portal") ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-white hover:bg-bg")}>
                  <Columns3 className="w-4 h-4 flex-shrink-0" />
                  Coach/Parent Portal
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-secondary hover:text-white hover:bg-bg transition-colors">
            <ExternalLink className="w-4 h-4" />
            View Public Site
          </Link>
          <Link href="/scores" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-secondary hover:text-white hover:bg-bg transition-colors">
            <Trophy className="w-4 h-4" />
            Live Scores
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-secondary hover:text-danger hover:bg-bg transition-colors w-full text-left">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
