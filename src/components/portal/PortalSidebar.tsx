"use client";

import { useState } from "react";
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
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const COACH_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/roster", label: "My Roster", icon: Users },
  { href: "/portal/checkin", label: "Team Check-In", icon: UserCheck },
  { href: "/portal/waiver", label: "Waiver Form", icon: FileCheck },
  { href: "/portal/schedule", label: "Schedule", icon: Calendar },
  { href: "/portal/scores", label: "Scores", icon: Trophy },
  { href: "/portal/profile", label: "Profile", icon: UserCircle },
];

const PARENT_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/waiver", label: "Waiver Form", icon: FileCheck },
  { href: "/portal/schedule", label: "Schedule", icon: Calendar },
  { href: "/portal/scores", label: "Scores", icon: Trophy },
  { href: "/portal/profile", label: "Profile", icon: UserCircle },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/roster", label: "Roster View", icon: Users },
  { href: "/portal/checkin", label: "Team Check-In", icon: UserCheck },
  { href: "/portal/waiver", label: "Waiver Form", icon: FileCheck },
  { href: "/portal/schedule", label: "Schedule", icon: Calendar },
  { href: "/portal/scores", label: "Scores", icon: Trophy },
];

export default function PortalSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const role = session?.user?.role;

  const navItems = role === "parent" ? PARENT_NAV : role === "admin" ? ADMIN_NAV : COACH_NAV;
  const portalLabel = role === "coach" ? "Coach Portal" : role === "parent" ? "Parent Portal" : "Portal Preview";

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
          <Link href="/portal" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={36} height={36} className="object-contain" />
            <div>
              <span className="text-white font-bold text-sm uppercase tracking-tight block">Inspire Courts</span>
              <span className="text-text-secondary text-[10px] uppercase tracking-widest">{portalLabel}</span>
            </div>
          </Link>
        </div>

        {/* User info */}
        <div className="px-5 py-3 border-b border-border">
          <p className="text-white text-sm font-medium truncate">{session?.user?.name || "User"}</p>
          <p className="text-text-secondary text-xs truncate">{session?.user?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors",
                    active ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-white hover:bg-bg"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          {role === "admin" && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-secondary hover:text-white hover:bg-bg transition-colors">
              <ExternalLink className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}
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
