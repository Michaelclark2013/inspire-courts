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
  { href: "/admin/tournaments/manage", label: "Tournaments", icon: Trophy, page: "tournaments" },
  { href: "/admin/scores/enter", label: "Score Entry", icon: PenLine, page: "score_entry" },
  { href: "/admin/teams", label: "Teams", icon: Users, page: "teams" },
  { href: "/admin/scores", label: "Game Scores", icon: ClipboardList, page: "scores" },
  { href: "/admin/players", label: "Players", icon: UserCheck, page: "players" },
  { href: "/admin/checkin", label: "Check-In", icon: UserCheck, page: "checkin" },
  { href: "/admin/staff", label: "Staff & Refs", icon: UserCheck, page: "staff_refs" },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign, page: "revenue" },
  { href: "/admin/prospects", label: "Prospects", icon: TrendingUp, page: "prospects" },
];

const RESOURCES: NavItem[] = [
  { href: "/admin/files", label: "Files & Drive", icon: FolderOpen, page: "files" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, page: "analytics" },
  { href: "/admin/leads", label: "Prospect Pipeline", icon: TrendingUp, page: "leads" },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, page: "announcements" },
  { href: "/admin/sponsors", label: "Sponsorships", icon: Handshake, page: "sponsors" },
  { href: "/admin/schools", label: "Schools", icon: GraduationCap, page: "schools" },
  { href: "/admin/content", label: "Content Editor", icon: FileEdit, page: "content" },
  { href: "/admin/users", label: "User Accounts", icon: Shield, page: "users" },
];

const PERSONAL: NavItem[] = [
  { href: "/admin/my-schedule", label: "My Schedule", icon: Calendar, page: "my_schedule" },
  { href: "/admin/my-history", label: "My Work History", icon: History, page: "my_history" },
];

// Primary tabs shown in the mobile bottom bar (5 max)
const BOTTOM_TABS: NavItem[] = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, page: "overview" },
  { href: "/admin/teams", label: "Teams", icon: Users, page: "teams" },
  { href: "/admin/scores", label: "Scores", icon: ClipboardList, page: "scores" },
  { href: "/admin/staff", label: "Staff", icon: UserCheck, page: "staff_refs" },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign, page: "revenue" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user?.role || "admin") as UserRole;

  const visibleOps = OPERATIONS.filter((item) => canAccess(role, item.page));
  const visibleRes = RESOURCES.filter((item) => canAccess(role, item.page));
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

  function SidebarLink({ item }: { item: NavItem }) {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors relative",
          active
            ? "bg-accent/10 text-accent before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-accent before:rounded-full"
            : "text-text-secondary hover:text-white hover:bg-bg"
        )}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        {item.label}
      </Link>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar (lg+) ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-bg-secondary border-r border-border sticky top-0 h-screen" aria-label="Admin navigation">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/images/inspire-athletics-logo.png"
              alt="Inspire Courts"
              width={36}
              height={36}
              className="object-contain"
            />
            <div>
              <span className="text-white font-bold text-sm uppercase tracking-tight block">
                Inspire Courts
              </span>
              <span className="text-text-secondary text-[10px] uppercase tracking-widest">
                {ROLE_LABELS[role] || "Dashboard"}
              </span>
            </div>
          </Link>
        </div>

        {/* User info */}
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <p className="text-white text-sm font-medium truncate">
            {session?.user?.name || "Admin"}
          </p>
          <p className="text-text-secondary text-xs truncate">{session?.user?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5" aria-label="Admin pages">
          {visiblePersonal.length > 0 && (
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                My Dashboard
              </p>
              <div className="space-y-0.5">
                {visiblePersonal.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}

          {visibleOps.length > 0 && (
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                Operations
              </p>
              <div className="space-y-0.5">
                {visibleOps.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}

          {visibleRes.length > 0 && (
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                Resources
              </p>
              <div className="space-y-0.5">
                {visibleRes.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}

          {role === "admin" && (
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                Portals
              </p>
              <div className="space-y-0.5">
                <Link
                  href="/portal"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors",
                    pathname.startsWith("/portal")
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:text-white hover:bg-bg"
                  )}
                >
                  <Columns3 className="w-4 h-4 flex-shrink-0" />
                  Coach/Parent Portal
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-border space-y-1 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-secondary hover:text-white hover:bg-bg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Public Site
          </Link>
          <Link
            href="/scores"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-secondary hover:text-white hover:bg-bg transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Live Scores
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-secondary hover:text-danger hover:bg-bg transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ──────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-bg-secondary border-t border-border-dark flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Admin quick navigation"
      >
        {visibleBottomTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors",
                active ? "text-accent" : "text-text-secondary"
              )}
            >
              <tab.icon
                className="w-[22px] h-[22px]"
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  active ? "text-accent" : "text-text-secondary"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
        {/* More tab — shows dot when current page lives in the drawer */}
        {(() => {
          const drawerItems = [...visibleOps, ...visibleRes, ...visiblePersonal].filter(
            (item) => !visibleBottomTabs.some((t) => t.href === item.href)
          );
          const drawerActive = !showMore && drawerItems.some((item) => isActive(item.href));
          return (
            <button
              onClick={() => setShowMore((v) => !v)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors relative",
                showMore || drawerActive ? "text-accent" : "text-text-secondary"
              )}
            >
              {drawerActive && !showMore && (
                <span className="absolute top-2 right-[calc(50%-14px)] w-2 h-2 rounded-full bg-accent" />
              )}
              <MoreHorizontal
                className="w-[22px] h-[22px]"
                strokeWidth={showMore || drawerActive ? 2.5 : 1.75}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  showMore || drawerActive ? "text-accent" : "text-text-secondary"
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
            className="lg:hidden fixed inset-0 z-[65] bg-black/60"
            onClick={() => setShowMore(false)}
          />
          {/* Drawer */}
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[66] bg-bg-secondary border-t border-border rounded-t-2xl max-h-[82vh] overflow-y-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* User info */}
            <div className="px-5 py-3 border-b border-border flex-shrink-0">
              <p className="text-white text-sm font-semibold">
                {session?.user?.name || "Admin"}
              </p>
              <p className="text-text-secondary text-xs">{session?.user?.email}</p>
              <span className="text-text-secondary text-[10px] uppercase tracking-wider">
                {ROLE_LABELS[role] || "Dashboard"}
              </span>
            </div>

            <div className="p-4 space-y-5">
              {/* Personal */}
              {visiblePersonal.length > 0 && (
                <div>
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-1 mb-2">
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

              {/* Operations */}
              {visibleOps.length > 0 && (
                <div>
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-1 mb-2">
                    Operations
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleOps.map((item) => (
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

              {/* Resources */}
              {visibleRes.length > 0 && (
                <div>
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-1 mb-2">
                    Resources
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleRes.map((item) => (
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
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <Link
                  href="/"
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-2 px-3 py-3.5 rounded-xl bg-bg text-text-secondary text-sm min-h-[44px]"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  Public Site
                </Link>
                <Link
                  href="/scores"
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-2 px-3 py-3.5 rounded-xl bg-bg text-text-secondary text-sm min-h-[44px]"
                >
                  <Trophy className="w-4 h-4 flex-shrink-0" />
                  Live Scores
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-3 py-3.5 rounded-xl bg-danger/10 text-danger text-sm col-span-2 min-h-[44px]"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
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
          ? "bg-accent/15 text-accent border border-accent/25"
          : "bg-bg text-text-secondary border border-border hover:text-white"
      )}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
