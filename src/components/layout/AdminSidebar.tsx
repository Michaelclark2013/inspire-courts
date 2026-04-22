"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Search,
  DollarSign,
  UserCheck,
  ClipboardList,
  ExternalLink,
  LogOut,
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
  Megaphone,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
  CalendarDays,
  Truck,
  Wallet,
  IdCard,
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

const OVERVIEW_ITEM: NavItem = { href: "/admin", label: "Overview", icon: LayoutDashboard, page: "overview" };

const EVENT_SETUP: NavItem[] = [
  { href: "/admin/tournaments/manage", label: "Tournaments", icon: Trophy, page: "tournaments" },
  { href: "/admin/teams", label: "Teams", icon: Users, page: "teams" },
  { href: "/admin/players", label: "Players", icon: UserCheck, page: "players" },
];

const GAME_DAY: NavItem[] = [
  { href: "/admin/scores/enter", label: "Score Entry", icon: PenLine, page: "score_entry" },
  { href: "/admin/scores", label: "Game Scores", icon: ClipboardList, page: "scores" },
  { href: "/admin/checkin", label: "Check-In", icon: UserCheck, page: "checkin" },
];

// Everything that runs the "people + machines" side of the gym.
// Separated from game-day ops because these are the workflows that
// keep the facility running year-round, not just on tournament days.
const STAFF_OPS: NavItem[] = [
  { href: "/admin/roster", label: "Staff Roster", icon: IdCard, page: "roster" },
  { href: "/admin/timeclock", label: "Time Clock", icon: Clock, page: "timeclock" },
  { href: "/admin/shifts", label: "Shifts", icon: CalendarDays, page: "shifts" },
  { href: "/admin/payroll", label: "Payroll", icon: Wallet, page: "payroll" },
  { href: "/admin/resources", label: "Resources / Van", icon: Truck, page: "resources" },
  { href: "/admin/staff", label: "Staff (Legacy Sheet)", icon: UserCheck, page: "staff_refs" },
];

const FINANCE: NavItem[] = [
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign, page: "revenue" },
  { href: "/admin/prospects", label: "Prospects", icon: TrendingUp, page: "prospects" },
  { href: "/admin/leads", label: "Prospect Pipeline", icon: TrendingUp, page: "leads" },
  { href: "/admin/sponsors", label: "Sponsorships", icon: Handshake, page: "sponsors" },
];

const ADMIN_SECTION: NavItem[] = [
  { href: "/admin/approvals", label: "Approvals", icon: Shield, page: "approvals" },
  { href: "/admin/users", label: "User Accounts", icon: Shield, page: "users" },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, page: "announcements" },
  { href: "/admin/schools", label: "Schools", icon: GraduationCap, page: "schools" },
  { href: "/admin/content", label: "Content Editor", icon: FileEdit, page: "content" },
  { href: "/admin/files", label: "Files & Drive", icon: FolderOpen, page: "files" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, page: "analytics" },
];

const PERSONAL: NavItem[] = [
  { href: "/admin/my-schedule", label: "My Schedule", icon: Calendar, page: "my_schedule" },
  { href: "/admin/my-history", label: "My Work History", icon: History, page: "my_history" },
];

// Primary tabs shown in the mobile bottom bar (5 max)
const BOTTOM_TABS: NavItem[] = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, page: "overview" },
  { href: "/admin/tournaments/manage", label: "Events", icon: Trophy, page: "tournaments" },
  { href: "/admin/scores", label: "Scores", icon: ClipboardList, page: "scores" },
  { href: "/admin/teams", label: "Teams", icon: Users, page: "teams" },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign, page: "revenue" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user?.role || "admin") as UserRole;

  // Persist collapsed state in localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("sidebar-collapsed");
      if (saved === "true") setCollapsed(true);
    } catch {
      // localStorage may be unavailable (private browsing, quota, etc.)
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("sidebar-collapsed", String(next));
        } catch {
          // localStorage may be unavailable — state still updates in memory.
        }
      }
      return next;
    });
  }

  const visibleEventSetup = EVENT_SETUP.filter((item) => canAccess(role, item.page));
  const visibleGameDay = GAME_DAY.filter((item) => canAccess(role, item.page));
  const visibleStaffOps = STAFF_OPS.filter((item) => canAccess(role, item.page));
  const visibleFinance = FINANCE.filter((item) => canAccess(role, item.page));
  const visibleAdmin = ADMIN_SECTION.filter((item) => canAccess(role, item.page));
  const visiblePersonal = PERSONAL.filter((item) => canAccess(role, item.page));
  const visibleBottomTabs = BOTTOM_TABS.filter((item) => canAccess(role, item.page));

  // Close more drawer on route change or Escape
  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && showMore) setShowMore(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showMore]);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  // Pages that show a notification dot (pending items likely exist)
  const BADGE_PAGES = new Set(["approvals", "announcements"]);

  function SidebarLink({ item }: { item: NavItem }) {
    const active = isActive(item.href);
    const showBadge = BADGE_PAGES.has(item.page) && !active;
    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
          collapsed && "justify-center px-2",
          active
            ? "bg-red/10 text-red font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-red before:rounded-full"
            : "text-text-muted hover:text-navy hover:bg-off-white"
        )}
      >
        <span className="relative flex-shrink-0">
          <item.icon className="w-4 h-4" aria-hidden="true" />
          {showBadge && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red rounded-full ring-2 ring-white" aria-label="Has pending items" />
          )}
        </span>
        {!collapsed && item.label}
      </Link>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar (lg+) ──────────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-light-gray sticky top-0 h-screen transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className={cn("py-5 border-b border-light-gray flex-shrink-0", collapsed ? "px-3" : "px-5")}>
          <Link href="/admin" className="flex items-center gap-3" title={collapsed ? "Inspire Courts Dashboard" : undefined}>
            <Image
              src="/images/inspire-athletics-logo.png"
              alt="Inspire Courts"
              width={36}
              height={36}
              className="object-contain flex-shrink-0"
            />
            {!collapsed && (
              <div>
                <span className="text-navy font-bold text-sm uppercase tracking-tight block">
                  Inspire Courts
                </span>
                <span className="text-text-muted text-[10px] uppercase tracking-widest">
                  {ROLE_LABELS[role] || "Dashboard"}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* User info */}
        <div className={cn("py-3 border-b border-light-gray flex-shrink-0 flex items-center gap-3", collapsed ? "px-3 justify-center" : "px-5")}>
          <div className="w-9 h-9 bg-navy rounded-full flex items-center justify-center flex-shrink-0" title={collapsed ? (session?.user?.name || "Admin") : undefined}>
            <span className="text-white text-xs font-bold">
              {(session?.user?.name || "A").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-navy text-sm font-medium truncate">
                {session?.user?.name || "Admin"}
              </p>
              <p className="text-text-muted text-xs truncate">{session?.user?.email}</p>
            </div>
          )}
        </div>

        {/* Quick search shortcut */}
        {!collapsed && (
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
            className="mx-3 mt-3 flex items-center gap-2 w-[calc(100%-24px)] px-3 py-2 bg-off-white border border-border rounded-lg text-text-muted text-xs hover:border-navy/20 hover:text-navy transition-colors"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="flex-1 text-left">Search pages...</span>
            <kbd className="text-[10px] font-mono bg-white border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5" aria-label="Admin pages">
          <div>
            <SidebarLink item={OVERVIEW_ITEM} />
          </div>

          {visibleEventSetup.length > 0 && (
            <div>
              {!collapsed && (
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                  Events & Scheduling
                </p>
              )}
              <div className="space-y-0.5">
                {visibleEventSetup.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}

          {visibleGameDay.length > 0 && (
            <div>
              {!collapsed && (
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                  Game Day
                </p>
              )}
              <div className="space-y-0.5">
                {visibleGameDay.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}

          {visibleStaffOps.length > 0 && (
            <div>
              {!collapsed && (
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                  Staff Ops
                </p>
              )}
              <div className="space-y-0.5">
                {visibleStaffOps.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}

          {visibleFinance.length > 0 && (
            <div>
              {!collapsed && (
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                  Finance
                </p>
              )}
              <div className="space-y-0.5">
                {visibleFinance.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}

          {visibleAdmin.length > 0 && (
            <div>
              {!collapsed && (
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                  Admin
                </p>
              )}
              <div className="space-y-0.5">
                {visibleAdmin.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}

          {visiblePersonal.length > 0 && (
            <div>
              {!collapsed && (
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                  My Dashboard
                </p>
              )}
              <div className="space-y-0.5">
                {visiblePersonal.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}

          {role === "admin" && (
            <div>
              {!collapsed && (
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                  Portals
                </p>
              )}
              <div className="space-y-0.5">
                <Link
                  href="/portal"
                  title={collapsed ? "Coach/Parent Portal" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-2",
                    pathname.startsWith("/portal")
                      ? "bg-red/10 text-red"
                      : "text-text-muted hover:text-navy hover:bg-off-white"
                  )}
                >
                  <Columns3 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && "Coach/Parent Portal"}
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-light-gray space-y-1 flex-shrink-0">
          <Link
            href="/"
            title={collapsed ? "View Public Site" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-navy hover:bg-off-white transition-all duration-200",
              collapsed && "justify-center px-2"
            )}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && "View Public Site"}
          </Link>
          <Link
            href="/scores"
            title={collapsed ? "Live Scores" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-navy hover:bg-off-white transition-all duration-200",
              collapsed && "justify-center px-2"
            )}
          >
            <Trophy className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && "Live Scores"}
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={collapsed ? "Sign Out" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-danger hover:bg-red/5 transition-all duration-200 w-full text-left",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && "Sign Out"}
          </button>
          {/* Collapse toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-navy hover:bg-off-white transition-all duration-200 w-full text-left justify-center"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ──────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-light-gray flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Admin quick navigation"
      >
        {visibleBottomTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 min-h-[56px] transition-colors"
            >
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-7 rounded-full transition-colors mb-0.5",
                  active ? "bg-red/10" : ""
                )}
              >
                <tab.icon
                  className={cn("w-6 h-6", active ? "text-red" : "text-text-muted")}
                  strokeWidth={active ? 2.5 : 1.75}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  active ? "text-red" : "text-text-muted"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
        {/* More tab — shows dot when current page lives in the drawer */}
        {(() => {
          const drawerItems = [...visibleEventSetup, ...visibleGameDay, ...visibleFinance, ...visibleAdmin, ...visiblePersonal].filter(
            (item) => !visibleBottomTabs.some((t) => t.href === item.href)
          );
          const drawerActive = !showMore && drawerItems.some((item) => isActive(item.href));
          return (
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
              aria-label="More navigation options"
              className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 min-h-[56px] transition-colors relative"
            >
              {drawerActive && !showMore && (
                <span className="absolute top-2 right-[calc(50%-14px)] w-2 h-2 rounded-full bg-red" />
              )}
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-7 rounded-full transition-colors mb-0.5",
                  showMore || drawerActive ? "bg-red/10" : ""
                )}
              >
                <MoreHorizontal
                  className={cn("w-6 h-6", showMore || drawerActive ? "text-red" : "text-text-muted")}
                  strokeWidth={showMore || drawerActive ? 2.5 : 1.75}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  showMore || drawerActive ? "text-red" : "text-text-muted"
                )}
              >
                More
              </span>
            </button>
          );
        })()}
      </nav>

      {/* ── Mobile "More" slide-up drawer ─────────────────────────────────── */}
      {showMore && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-[65] bg-black/60 animate-backdrop-in"
            onClick={() => setShowMore(false)}
          />
          {/* Drawer */}
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[66] bg-white border-t border-light-gray rounded-t-2xl max-h-[82vh] overflow-y-auto transition-transform duration-300 ease-out animate-slide-up"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-light-gray rounded-full" />
            </div>

            {/* User info */}
            <div className="px-5 py-3 border-b border-light-gray flex-shrink-0 flex items-center gap-3">
              <div className="w-9 h-9 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {(session?.user?.name || "A").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-navy text-sm font-semibold truncate">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="text-text-muted text-xs truncate">{session?.user?.email}</p>
                <span className="text-text-muted text-[10px] uppercase tracking-wider">
                  {ROLE_LABELS[role] || "Dashboard"}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Events & Scheduling */}
              {visibleEventSetup.length > 0 && (
                <div>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-1 mb-2">
                    Events & Scheduling
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleEventSetup.map((item) => (
                      <MoreLink
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                        onClose={() => setShowMore(false)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Game Day */}
              {visibleGameDay.length > 0 && (
                <div>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-1 mb-2">
                    Game Day
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleGameDay.map((item) => (
                      <MoreLink
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                        onClose={() => setShowMore(false)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Finance */}
              {visibleFinance.length > 0 && (
                <div>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-1 mb-2">
                    Finance
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleFinance.map((item) => (
                      <MoreLink
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                        onClose={() => setShowMore(false)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin */}
              {visibleAdmin.length > 0 && (
                <div>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-1 mb-2">
                    Admin
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleAdmin.map((item) => (
                      <MoreLink
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                        onClose={() => setShowMore(false)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Personal */}
              {visiblePersonal.length > 0 && (
                <div>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-1 mb-2">
                    My Dashboard
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {visiblePersonal.map((item) => (
                      <MoreLink
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                        onClose={() => setShowMore(false)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Portals + Sign out */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-light-gray">
                <Link
                  href="/"
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-2 px-3 py-3.5 rounded-xl bg-off-white text-text-muted text-sm min-h-[44px]"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  Public Site
                </Link>
                <Link
                  href="/scores"
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-2 px-3 py-3.5 rounded-xl bg-off-white text-text-muted text-sm min-h-[44px]"
                >
                  <Trophy className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  Live Scores
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-3 py-3.5 rounded-xl bg-red/5 text-red text-sm col-span-2 min-h-[44px]"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MoreLink({
  item,
  active,
  onClose,
}: {
  item: NavItem;
  active: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2.5 px-3 py-3.5 rounded-xl text-sm font-medium transition-colors min-h-[44px]",
        active
          ? "bg-red/10 text-red border border-red/20"
          : "bg-off-white text-text-muted border border-light-gray hover:text-navy"
      )}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
