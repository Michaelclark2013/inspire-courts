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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const role = session?.user?.role;
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [hasLiveGames, setHasLiveGames] = useState(false);

  // Fetch announcement count + live game status
  useEffect(() => {
    fetch("/api/portal/announcements")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAnnouncementCount(data.length);
      })
      .catch(() => {});

    fetch("/api/scores/live")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHasLiveGames(data.some((g: { status: string }) => g.status === "live"));
      })
      .catch(() => {});
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[58] bg-bg-secondary/95 backdrop-blur-sm border-b border-white/[0.06] px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setOpen(!open)}
          className="text-white p-1.5"
          aria-label="Toggle sidebar"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link href="/portal" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={28} height={28} className="object-contain" />
          <span className="text-white font-bold text-sm uppercase tracking-tight">Inspire</span>
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
          className="lg:hidden fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[56] h-full w-[260px] bg-bg-secondary flex flex-col transition-transform duration-300 ease-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo area */}
        <div className="px-5 py-5 flex items-center gap-3">
          <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={32} height={32} className="object-contain" />
          <div className="flex-1 min-w-0">
            <span className="text-white font-bold text-sm block leading-tight">Inspire Courts</span>
            <span className="text-text-secondary text-[10px] uppercase tracking-widest">{roleLabel} Portal</span>
          </div>
        </div>

        {/* User card */}
        <Link
          href="/portal/profile"
          onClick={() => setOpen(false)}
          className="mx-3 mb-2 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl flex items-center gap-3 transition-colors"
        >
          <div className="w-9 h-9 bg-red/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-red text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{session?.user?.name || "User"}</p>
            <p className="text-text-secondary text-[11px] truncate">{session?.user?.email}</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Menu</p>
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-red/10 text-red"
                      : "text-text-secondary hover:text-white hover:bg-white/[0.04]"
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
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Account</p>
            <Link
              href="/portal/profile"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                pathname === "/portal/profile"
                  ? "bg-red/10 text-red"
                  : "text-text-secondary hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <UserCircle className={cn("w-[18px] h-[18px] flex-shrink-0", pathname === "/portal/profile" && "text-red")} />
              Profile
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/[0.04] space-y-0.5">
          {role === "admin" && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-white hover:bg-white/[0.04] transition-all">
              <ChevronLeft className="w-[18px] h-[18px]" />
              Admin Dashboard
            </Link>
          )}
          <Link href="/scores" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-white hover:bg-white/[0.04] transition-all">
            <div className="relative">
              <ExternalLink className="w-[18px] h-[18px]" />
              {hasLiveGames && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
            </div>
            Live Scores
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-danger hover:bg-danger/[0.06] transition-all w-full text-left"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
