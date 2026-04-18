"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  UserCircle,
  ExternalLink,
  LogOut,
  Menu,
  X,
  UserCheck,
  FileCheck,
  ChevronLeft,
  Radio,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalView } from "@/components/portal/PortalViewContext";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const COACH_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/roster", label: "My Roster", icon: Users },
  { href: "/portal/checkin", label: "Team Check-In", icon: UserCheck },
  { href: "/portal/waiver", label: "Waivers", icon: FileCheck },
  { href: "/portal/schedule", label: "Schedule", icon: Calendar },
  { href: "/portal/scores", label: "Scores", icon: Trophy },
];

const PARENT_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/waiver", label: "Waivers", icon: FileCheck },
  { href: "/portal/schedule", label: "Schedule", icon: Calendar },
  { href: "/portal/scores", label: "Scores", icon: Trophy },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/roster", label: "Roster View", icon: Users },
  { href: "/portal/checkin", label: "Team Check-In", icon: UserCheck },
  { href: "/portal/waiver", label: "Waivers", icon: FileCheck },
  { href: "/portal/schedule", label: "Schedule", icon: Calendar },
  { href: "/portal/scores", label: "Scores", icon: Trophy },
];

export default function PortalSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const actualRole = session?.user?.role;
  const { viewAsRole, setViewAsRole } = usePortalView();
  const role = (actualRole === "admin" && viewAsRole) ? viewAsRole : actualRole;
  const isAdmin = actualRole === "admin";
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [hasLiveGames, setHasLiveGames] = useState(false);

  // Fetch announcement count + live game status
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/portal/announcements", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAnnouncementCount(data.length);
      })
      .catch((err) => { if (err instanceof DOMException && err.name === "AbortError") return; });

    fetch("/api/scores/live", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHasLiveGames(data.some((g: { status: string }) => g.status === "live"));
      })
      .catch((err) => { if (err instanceof DOMException && err.name === "AbortError") return; });
    return () => controller.abort();
  }, []);

  const navItems = role === "parent" ? PARENT_NAV : role === "admin" ? ADMIN_NAV : COACH_NAV;
  const roleLabel = role === "coach" ? "Coach" : role === "parent" ? "Parent" : "Admin";
  const initials = (session?.user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Items that should show live game indicator
  const liveIndicatorItems = ["/portal/schedule", "/portal/scores"];

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[58] bg-white/95 shadow-sm backdrop-blur-sm border-b border-light-gray px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setOpen(!open)}
          className="text-navy p-1.5"
          aria-label="Toggle sidebar"
        >
          {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
        <Link href="/portal" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={28} height={28} className="object-contain" />
          <span className="text-navy font-bold text-sm uppercase tracking-tight">Inspire</span>
        </Link>
        <Link href="/portal/profile" onClick={() => setOpen(false)} className="w-8 h-8 bg-red/20 rounded-full flex items-center justify-center text-red text-xs font-bold">
          {initials}
        </Link>
      </div>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14" />

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[56] h-full w-[260px] bg-white border-r border-light-gray flex flex-col transition-transform duration-300 ease-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Red accent stripe */}
        <div className="h-1 bg-red" />

        {/* Logo area */}
        <div className="px-5 py-5 flex items-center gap-3">
          <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={32} height={32} className="object-contain" />
          <div className="flex-1 min-w-0">
            <span className="text-navy font-bold text-sm block leading-tight">Inspire Courts</span>
            <span className="text-text-muted text-[10px] uppercase tracking-widest">{roleLabel} Portal</span>
          </div>
        </div>

        {/* User card */}
        <Link
          href="/portal/profile"
          onClick={() => setOpen(false)}
          className="mx-3 mb-2 p-3 bg-off-white hover:bg-navy/[0.04] rounded-xl flex items-center gap-3 transition-colors"
        >
          <div className="w-9 h-9 bg-red/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-red text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-navy text-sm font-medium truncate">{session?.user?.name || "User"}</p>
            <p className="text-text-muted text-[11px] truncate">{session?.user?.email}</p>
          </div>
        </Link>

        {/* View As (admin only) */}
        {isAdmin && (
          <div className="mx-3 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              <span className="text-amber-600 text-[10px] font-bold uppercase tracking-widest">View As</span>
            </div>
            <select
              aria-label="View portal as role"
              value={viewAsRole || "admin"}
              onChange={(e) => setViewAsRole(e.target.value === "admin" ? null : e.target.value)}
              className="w-full bg-white border border-light-gray rounded-lg px-3 py-2 text-navy text-xs font-medium focus:outline-none focus:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
            >
              <option value="admin">Admin (default)</option>
              <option value="coach">Coach View</option>
              <option value="parent">Parent View</option>
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label="Portal navigation">
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Menu</p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
              const showLiveDot = hasLiveGames && liveIndicatorItems.includes(item.href);
              const showAnnouncementBadge = item.href === "/portal" && announcementCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-red/10 text-red"
                      : "text-text-muted hover:text-navy hover:bg-off-white"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <item.icon className={cn("w-[18px] h-[18px]", active && "text-red")} />
                    {showLiveDot && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {showAnnouncementBadge && (
                    <span className="min-w-[18px] h-[18px] bg-red rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1">
                      {announcementCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Profile link */}
          <div className="mt-4 pt-3 border-t border-light-gray">
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Account</p>
            <Link
              href="/portal/profile"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                pathname === "/portal/profile"
                  ? "bg-red/10 text-red"
                  : "text-text-muted hover:text-navy hover:bg-off-white"
              )}
            >
              <UserCircle className={cn("w-[18px] h-[18px] flex-shrink-0", pathname === "/portal/profile" && "text-red")} aria-hidden="true" />
              Profile
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-light-gray space-y-0.5">
          {role === "admin" && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-navy hover:bg-off-white transition-all">
              <ChevronLeft className="w-[18px] h-[18px]" aria-hidden="true" />
              Admin Dashboard
            </Link>
          )}
          <Link href="/scores" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-navy hover:bg-off-white transition-all">
            <div className="relative">
              <ExternalLink className="w-[18px] h-[18px]" aria-hidden="true" />
              {hasLiveGames && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
            </div>
            Live Scores
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-danger hover:bg-danger/[0.06] transition-all w-full text-left"
          >
            <LogOut className="w-[18px] h-[18px]" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
