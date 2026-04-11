"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Trophy,
  DollarSign,
  UserCheck,
  Handshake,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  ExternalLink,
  LogOut,
  Menu,
  X,
  FileEdit,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/content", label: "Content Editor", icon: FileEdit },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/teams", label: "Teams & Pipeline", icon: Users },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/staff", label: "Staff & Refs", icon: UserCheck },
  { href: "/admin/sponsors", label: "Sponsorships", icon: Handshake },
  { href: "/admin/schools", label: "Schools", icon: GraduationCap },
  { href: "/admin/scores", label: "Game Scores", icon: ClipboardList },
  { href: "/admin/contacts", label: "Leads", icon: MessageSquare },
  { href: "/admin/links", label: "Quick Links", icon: ExternalLink },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
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
            <img src="/images/inspire-athletics-logo.png" alt="Inspire Courts" className="w-9 h-9 object-contain" />
            <div>
              <span className="text-white font-bold text-sm uppercase tracking-tight block">
                Inspire Courts
              </span>
              <span className="text-text-secondary text-[10px] uppercase tracking-widest">
                Operations
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
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
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-secondary hover:text-white hover:bg-bg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Public Site
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
    </>
  );
}
