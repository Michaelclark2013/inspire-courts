"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
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
  Rocket,
  FileSignature,
  Handshake,
  ArrowUpRight,
  Search,
  Star,
  ChevronRight,
  X,
  Sparkles,
  Zap,
  Building2,
  Banknote,
  Settings,
  Cog,
  Receipt,
  Inbox,
} from "lucide-react";
import { canAccessWithOverrides } from "@/lib/permissions";
import type { AdminPage } from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";
import { triggerHaptic } from "@/lib/capacitor";

/**
 * Simplified admin navigation — category cards → drill-down sub-menus.
 *
 * Previously rendered 40+ tiles across 7 always-open sections. That's
 * overwhelming on any screen and downright unusable on mobile. This
 * version shows 6 big category cards by default; tapping one opens a
 * bottom-sheet (mobile) / centered dialog (desktop) with that
 * category's tiles. Search still cuts across everything — typing a
 * query bypasses categories and shows raw matches.
 */

type Tile = {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  page: AdminPage;
};

type Tint = "red" | "emerald" | "blue" | "purple" | "amber" | "navy";

type Category = {
  key: string;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tint: Tint;
  tiles: Tile[];
};

// 6 top-level categories — each opens a drill-down of its tiles.
const CATEGORIES: Category[] = [
  {
    key: "gameday",
    label: "Game Day",
    blurb: "Scores, check-in, live ops",
    icon: Zap,
    tint: "emerald",
    tiles: [
      { href: "/admin/scores/enter", label: "Enter Scores", desc: "Live scorekeeping", icon: PenLine, page: "score_entry" },
      { href: "/admin/scores", label: "Game Scores", desc: "Results history", icon: ClipboardList, page: "scores" },
      { href: "/admin/checkin", label: "Check-In", desc: "Team + player", icon: UserCheck, page: "checkin" },
      { href: "/admin/checkin/qr", label: "QR Codes", desc: "Print team QRs", icon: FileSignature, page: "checkin" },
      { href: "/admin/waivers", label: "Waivers", desc: "Signatures on file", icon: FileSignature, page: "tournaments" },
    ],
  },
  {
    key: "events",
    label: "Events",
    blurb: "Tournaments, teams, players",
    icon: Trophy,
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
    key: "staff",
    label: "Staff",
    blurb: "Shifts, clock, payroll",
    icon: Users,
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
      { href: "/admin/approvals", label: "Approvals", desc: "Pending staff", icon: Shield, page: "approvals" },
    ],
  },
  {
    key: "money",
    label: "Money",
    blurb: "Revenue, expenses, members",
    icon: Banknote,
    tint: "purple",
    tiles: [
      { href: "/admin/revenue", label: "Revenue", desc: "Cash + card + Square", icon: DollarSign, page: "revenue" },
      { href: "/admin/expenses", label: "Expenses", desc: "Running costs & P&L", icon: Receipt, page: "revenue" },
      { href: "/admin/members", label: "Members", desc: "Active memberships", icon: Users, page: "members" },
      { href: "/admin/membership-plans", label: "Plans", desc: "Tiers + pricing", icon: ClipboardList, page: "members" },
      { href: "/admin/leads", label: "Leads", desc: "Prospects pipeline", icon: TrendingUp, page: "leads" },
      { href: "/admin/sponsors", label: "Sponsors", desc: "Partners & deals", icon: Handshake, page: "sponsors" },
    ],
  },
  {
    key: "facility",
    label: "Facility",
    blurb: "Fleet, inventory, maintenance",
    icon: Building2,
    tint: "amber",
    tiles: [
      { href: "/admin/resources", label: "Fleet", desc: "Vehicles + rentals", icon: Truck, page: "resources" },
      { href: "/admin/rentals", label: "Rentals", desc: "Active contracts", icon: FileSignature, page: "resources" },
      { href: "/admin/equipment", label: "Equipment", desc: "Inventory", icon: Package, page: "equipment" },
      { href: "/admin/maintenance", label: "Maintenance", desc: "Work orders", icon: Wrench, page: "maintenance" },
      { href: "/admin/schools", label: "Schools", desc: "Partner contacts", icon: GraduationCap, page: "schools" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    blurb: "Users, permissions, content",
    icon: Cog,
    tint: "navy",
    tiles: [
      { href: "/admin/users", label: "User Accounts", desc: "Everyone with a login", icon: Shield, page: "users" },
      { href: "/admin/permissions", label: "Permissions", desc: "Per-user access", icon: Shield, page: "users" },
      { href: "/admin/security", label: "Security", desc: "Force re-login + events", icon: Shield, page: "users" },
      { href: "/admin/announcements", label: "Announcements", desc: "Push to portals", icon: Megaphone, page: "announcements" },
      { href: "/admin/broadcasts", label: "Team Broadcasts", desc: "Email a team", icon: Megaphone, page: "announcements" },
      { href: "/admin/content", label: "Content Editor", desc: "Public site copy", icon: FileEdit, page: "content" },
      { href: "/admin/files", label: "Files & Drive", desc: "Uploads + Drive", icon: FolderOpen, page: "files" },
      { href: "/admin/reports", label: "Reports", desc: "Exports + PDFs", icon: BarChart3, page: "analytics" },
      { href: "/admin/analytics", label: "GA Analytics", desc: "Traffic", icon: BarChart3, page: "analytics" },
      { href: "/admin/billing", label: "Billing", desc: "Subscriptions + dunning", icon: Banknote, page: "billing" },
      { href: "/admin/churn", label: "Churn Radar", desc: "At-risk members", icon: TrendingUp, page: "churn" },
      { href: "/admin/inquiries", label: "Inquiries", desc: "Lead pipeline · 30-min SLA", icon: Inbox, page: "inquiries" },
      { href: "/admin/inbox", label: "SMS Inbox", desc: "Two-way texts", icon: Megaphone, page: "inbox" },
      { href: "/admin/scheduler", label: "AI Scheduler", desc: "Auto-fill shifts", icon: Sparkles, page: "scheduler" },
      { href: "/admin/workouts", label: "Workouts", desc: "Library + leaderboards", icon: Trophy, page: "workouts" },
      { href: "/admin/integrations", label: "Integrations", desc: "API + webhooks", icon: Zap, page: "integrations" },
      { href: "/admin/audit-log", label: "Audit Log", desc: "Who did what", icon: History, page: "audit_log" },
      { href: "/admin/search", label: "Global Search", desc: "Find anything", icon: Search, page: "search" },
      { href: "/admin/launch-readiness", label: "Launch", desc: "Pre-flight", icon: Rocket, page: "users" },
      { href: "/admin/launch-status", label: "Go-Live Status", desc: "Env + seed", icon: Rocket, page: "users" },
    ],
  },
];

// Quick actions — the 4 most-used daily tasks. Surfaced above the
// category grid so the owner never has to drill into anything.
const QUICK_ACTIONS: Tile[] = [
  { href: "/admin/owner", label: "Owner Mode", desc: "The 5 numbers", icon: Sparkles, page: "owner" },
  { href: "/admin/scores/enter", label: "Enter Scores", desc: "Live scorekeeping", icon: PenLine, page: "score_entry" },
  { href: "/admin/checkin", label: "Check-In", desc: "Team + player", icon: UserCheck, page: "checkin" },
  { href: "/admin/tournaments/manage", label: "Tournaments", desc: "Brackets", icon: Trophy, page: "tournaments" },
];

const TINT: Record<Tint, { bar: string; iconBg: string; iconFg: string; ringHover: string }> = {
  red:     { bar: "bg-red",           iconBg: "bg-red/10",       iconFg: "text-red",           ringHover: "hover:border-red/40" },
  emerald: { bar: "bg-emerald-500",   iconBg: "bg-emerald-50",   iconFg: "text-emerald-600",   ringHover: "hover:border-emerald-300" },
  blue:    { bar: "bg-blue-500",      iconBg: "bg-blue-50",      iconFg: "text-blue-600",      ringHover: "hover:border-blue-300" },
  purple:  { bar: "bg-purple-500",    iconBg: "bg-purple-50",    iconFg: "text-purple-600",    ringHover: "hover:border-purple-300" },
  amber:   { bar: "bg-amber-500",     iconBg: "bg-amber-50",     iconFg: "text-amber-600",     ringHover: "hover:border-amber-300" },
  navy:    { bar: "bg-navy",          iconBg: "bg-navy/5",       iconFg: "text-navy",          ringHover: "hover:border-navy/40" },
};

const FAV_KEY = "icaz-admin-favs";

function loadFavs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}
function saveFavs(hrefs: string[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(FAV_KEY, JSON.stringify(hrefs)); } catch { /* ignore */ }
}

export default function AdminButtonGrid() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "") as UserRole | "";
  // expiresAt is required so canAccessWithOverrides can ignore expired
  // overrides — without it, time-limited grants/revokes don't fall off
  // the tile grid even after their expiry passes.
  const overrides = (session?.user as { permissionOverrides?: Array<{ page: AdminPage; granted: boolean; expiresAt?: string | null }> } | undefined)?.permissionOverrides;

  const [query, setQuery] = useState("");
  const [favHrefs, setFavHrefs] = useState<string[]>([]);

  useEffect(() => { setFavHrefs(loadFavs()); }, []);

  // Build permission-filtered view.
  const visibleCategories = useMemo(
    () => CATEGORIES.map((c) => ({
      ...c,
      tiles: c.tiles.filter((t) => canAccessWithOverrides(role as UserRole, t.page, overrides)),
    })).filter((c) => c.tiles.length > 0),
    [role, overrides]
  );

  const allVisibleTiles = useMemo(
    () => visibleCategories.flatMap((c) => c.tiles.map((t) => ({ tile: t, cat: c }))),
    [visibleCategories]
  );

  function toggleFav(href: string) {
    setFavHrefs((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      saveFavs(next);
      return next;
    });
  }

  if (!role) return null;

  const qTrim = query.trim().toLowerCase();
  const searchHits = qTrim
    ? allVisibleTiles.filter(({ tile }) =>
        tile.label.toLowerCase().includes(qTrim) ||
        tile.desc.toLowerCase().includes(qTrim) ||
        tile.href.toLowerCase().includes(qTrim)
      )
    : null;

  const favoriteTiles = favHrefs
    .map((href) => allVisibleTiles.find((v) => v.tile.href === href))
    .filter((v): v is { tile: Tile; cat: Category } => !!v);

  const visibleQuickActions = QUICK_ACTIONS.filter((t) => canAccessWithOverrides(role as UserRole, t.page, overrides));

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find anything…"
          className="w-full bg-white border border-border rounded-2xl pl-10 pr-4 py-3 text-navy text-sm focus:outline-none focus:border-red/60 shadow-sm"
        />
      </div>

      {/* Search results — when searching, everything else collapses */}
      {searchHits !== null ? (
        <div>
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-3 font-bold">
            {searchHits.length} match{searchHits.length === 1 ? "" : "es"} for &quot;{query}&quot;
          </p>
          {searchHits.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-6 text-center text-text-muted text-sm">
              Nothing matches.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {searchHits.map(({ tile, cat }) => (
                <TileCard key={tile.href} tile={tile} tint={cat.tint} favored={favHrefs.includes(tile.href)} onToggleFav={() => toggleFav(tile.href)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Quick actions */}
          {visibleQuickActions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Sparkles className="w-4 h-4 text-red" />
                <h2 className="text-navy font-bold text-xs uppercase tracking-widest">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {visibleQuickActions.map((tile) => (
                  <Link
                    key={tile.href}
                    href={tile.href}
                    onClick={() => { void triggerHaptic("light"); }}
                    className="group bg-gradient-to-br from-navy to-navy/90 text-white rounded-2xl p-3 min-h-[88px] transition-all hover:shadow-lg active:scale-[0.97]"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <tile.icon className="w-4 h-4 text-white" aria-hidden={true} />
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-white/50 group-hover:text-white" />
                    </div>
                    <p className="text-white font-bold text-[13px] leading-tight">{tile.label}</p>
                    <p className="text-white/60 text-[10px] mt-0.5 line-clamp-1">{tile.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Favorites */}
          {favoriteTiles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h2 className="text-navy font-bold text-xs uppercase tracking-widest">Favorites</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {favoriteTiles.map(({ tile, cat }) => (
                  <TileCard key={tile.href} tile={tile} tint={cat.tint} favored onToggleFav={() => toggleFav(tile.href)} />
                ))}
              </div>
            </div>
          )}

          {/* All tools — flat grid grouped by section header. The
              previous drill-down design hid 40+ tiles behind 6 cards;
              user feedback: "show all menu options at once." Now every
              accessible tile is one tap away on the overview. */}
          {visibleCategories.map((c) => {
            const tint = TINT[c.tint];
            return (
              <div key={c.key}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-7 h-7 rounded-lg ${tint.iconBg} flex items-center justify-center`}>
                    <c.icon className={`w-4 h-4 ${tint.iconFg}`} aria-hidden={true} />
                  </div>
                  <h2 className="text-navy font-bold text-xs uppercase tracking-widest">{c.label}</h2>
                  <span className="text-text-muted text-[10px] uppercase tracking-widest font-bold ml-auto">
                    {c.tiles.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {c.tiles.map((tile) => (
                    <TileCard
                      key={tile.href}
                      tile={tile}
                      tint={c.tint}
                      favored={favHrefs.includes(tile.href)}
                      onToggleFav={() => toggleFav(tile.href)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

        </>
      )}
    </div>
  );
}

function TileCard({
  tile, tint, favored, onToggleFav,
}: {
  tile: Tile;
  tint: Tint;
  favored: boolean;
  onToggleFav: () => void;
}) {
  const t = TINT[tint];
  return (
    <div className="group relative bg-white border border-border rounded-2xl transition-all shadow-sm hover:shadow-md hover:border-navy/20 active:scale-[0.97]">
      <Link href={tile.href} className="block p-4 min-h-[88px]">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${t.iconBg} flex items-center justify-center`}>
            <tile.icon className={`w-5 h-5 ${t.iconFg}`} aria-hidden={true} />
          </div>
          <ArrowUpRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
        </div>
        <p className="text-navy font-bold text-sm leading-tight">{tile.label}</p>
        <p className="text-text-muted text-xs mt-1 leading-snug line-clamp-1">{tile.desc}</p>
      </Link>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        aria-label={favored ? "Remove from favorites" : "Add to favorites"}
        className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-off-white transition-colors"
      >
        <Star
          className={`w-3.5 h-3.5 ${favored ? "text-amber-500 fill-amber-500" : "text-text-muted/40"}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
