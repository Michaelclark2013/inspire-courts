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
  LayoutDashboard,
  Rocket,
  FileSignature,
  Handshake,
  ArrowUpRight,
  Search,
  Star,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { canAccessWithOverrides } from "@/lib/permissions";
import type { AdminPage } from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";
import { triggerHaptic } from "@/lib/capacitor";

/**
 * Simplified admin tile wall.
 *
 * The dashboard used to dump 40 tiles in 7 always-open sections. This
 * rewrite trims the noise:
 *   1) A compact "Quick Actions" hero row with the 4 tiles the owner
 *      actually uses every game day (configurable later).
 *   2) A global search input at the top that fuzzy-matches across
 *      every tile so you can jump anywhere in one keystroke.
 *   3) Favorites — click the star on any tile to pin it to a "Your
 *      favorites" row that persists in localStorage.
 *   4) Collapsible sections. Events + Game Day stay open by default
 *      (most common). Everything else collapses behind a chevron so
 *      the page doesn't scroll forever.
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
  key: string;
  heading: string;
  blurb: string;
  tint: Tint;
  tiles: Tile[];
  defaultOpen?: boolean;
};

const SECTIONS: Section[] = [
  {
    key: "events",
    heading: "Events",
    blurb: "Tournaments, teams, and programs",
    tint: "red",
    defaultOpen: true,
    tiles: [
      { href: "/admin/tournaments/manage", label: "Tournaments", desc: "Brackets + registration", icon: Trophy, page: "tournaments" },
      { href: "/admin/teams", label: "Teams", desc: "Roster database", icon: Users, page: "teams" },
      { href: "/admin/players", label: "Players", desc: "Eligibility + check-ins", icon: UserCheck, page: "players" },
      { href: "/admin/programs", label: "Programs", desc: "Camps + clinics", icon: Calendar, page: "programs" },
      { href: "/admin/gym-schedule", label: "Gym Calendar", desc: "Owner's schedule", icon: Calendar, page: "overview" as AdminPage },
    ],
  },
  {
    key: "gameday",
    heading: "Game Day",
    blurb: "Scores, check-ins, waivers",
    tint: "emerald",
    defaultOpen: true,
    tiles: [
      { href: "/admin/scores/enter", label: "Enter Scores", desc: "Live scorekeeping", icon: PenLine, page: "score_entry" },
      { href: "/admin/scores", label: "Game Scores", desc: "Results history", icon: ClipboardList, page: "scores" },
      { href: "/admin/checkin", label: "Check-In", desc: "Team + player", icon: UserCheck, page: "checkin" },
      { href: "/admin/waivers", label: "Waivers", desc: "Signatures on file", icon: FileSignature, page: "tournaments" },
    ],
  },
  {
    key: "staff",
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
    key: "money",
    heading: "Members + Revenue",
    blurb: "Paying customers & growth",
    tint: "purple",
    tiles: [
      { href: "/admin/members", label: "Members", desc: "Active memberships", icon: Users, page: "members" },
      { href: "/admin/membership-plans", label: "Plans", desc: "Tiers + pricing", icon: ClipboardList, page: "members" },
      { href: "/admin/revenue", label: "Revenue", desc: "Cash + card + Square", icon: DollarSign, page: "revenue" },
      { href: "/admin/expenses", label: "Expenses", desc: "Running costs & P&L", icon: DollarSign, page: "revenue" },
      { href: "/admin/leads", label: "Leads", desc: "Prospects pipeline", icon: TrendingUp, page: "leads" },
      { href: "/admin/sponsors", label: "Sponsors", desc: "Partners & deals", icon: Handshake, page: "sponsors" },
    ],
  },
  {
    key: "facility",
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
    key: "admin",
    heading: "Admin",
    blurb: "Configuration & audit",
    tint: "navy",
    tiles: [
      { href: "/admin/approvals", label: "Approvals", desc: "Pending staff", icon: Shield, page: "approvals" },
      { href: "/admin/users", label: "User Accounts", desc: "Everyone with a login", icon: Shield, page: "users" },
      { href: "/admin/permissions", label: "Permissions", desc: "Per-user access", icon: Shield, page: "users" },
      { href: "/admin/security", label: "Security", desc: "Force re-login + events", icon: Shield, page: "users" },
      { href: "/admin/announcements", label: "Announcements", desc: "Push to portals", icon: Megaphone, page: "announcements" },
      { href: "/admin/content", label: "Content Editor", desc: "Public site copy", icon: FileEdit, page: "content" },
      { href: "/admin/files", label: "Files & Drive", desc: "Uploads + Google Drive", icon: FolderOpen, page: "files" },
      { href: "/admin/reports", label: "Reports", desc: "Exports + PDFs", icon: BarChart3, page: "analytics" },
      { href: "/admin/analytics", label: "GA Analytics", desc: "Traffic + conversions", icon: BarChart3, page: "analytics" },
      { href: "/admin/audit-log", label: "Audit Log", desc: "Who did what", icon: History, page: "audit_log" },
      { href: "/admin/launch-readiness", label: "Launch", desc: "Pre-flight checklist", icon: Rocket, page: "users" },
      { href: "/admin/launch-status", label: "Go-Live Status", desc: "Env + seed + rollup", icon: Rocket, page: "users" },
    ],
  },
  {
    key: "personal",
    heading: "Personal",
    blurb: "Your view",
    tint: "navy",
    tiles: [
      { href: "/admin/profile", label: "My Profile", desc: "Account & password", icon: IdCard, page: "overview" as AdminPage },
      { href: "/admin/my-schedule", label: "My Schedule", desc: "Your shifts", icon: Calendar, page: "my_schedule" },
      { href: "/admin/my-history", label: "My History", desc: "Past pay periods", icon: History, page: "my_history" },
      { href: "/admin/ops", label: "Ops Dashboard", desc: "Live operations", icon: LayoutDashboard, page: "overview" },
    ],
  },
];

// The 4-6 most frequent actions. Surfaced as a prominent Quick Actions
// row at the top so the owner never has to scroll for them.
const QUICK_ACTIONS: Tile[] = [
  { href: "/admin/scores/enter", label: "Enter Scores", desc: "Live scorekeeping", icon: PenLine, page: "score_entry" },
  { href: "/admin/checkin", label: "Check-In", desc: "Team + player", icon: UserCheck, page: "checkin" },
  { href: "/admin/tournaments/manage", label: "Tournaments", desc: "Brackets + registration", icon: Trophy, page: "tournaments" },
  { href: "/admin/announcements", label: "Post Announcement", desc: "Push to portals", icon: Megaphone, page: "announcements" },
];

const TINT: Record<Tint, { bar: string; iconBg: string; iconFg: string; badgeBg: string; badgeFg: string; hoverRing: string }> = {
  red: { bar: "bg-red", iconBg: "bg-red/10", iconFg: "text-red", badgeBg: "bg-red/10", badgeFg: "text-red", hoverRing: "hover:border-red/40 hover:shadow-red/10" },
  emerald: { bar: "bg-emerald-500", iconBg: "bg-emerald-50", iconFg: "text-emerald-600", badgeBg: "bg-emerald-50", badgeFg: "text-emerald-700", hoverRing: "hover:border-emerald-300 hover:shadow-emerald-100" },
  blue: { bar: "bg-blue-500", iconBg: "bg-blue-50", iconFg: "text-blue-600", badgeBg: "bg-blue-50", badgeFg: "text-blue-700", hoverRing: "hover:border-blue-300 hover:shadow-blue-100" },
  purple: { bar: "bg-purple-500", iconBg: "bg-purple-50", iconFg: "text-purple-600", badgeBg: "bg-purple-50", badgeFg: "text-purple-700", hoverRing: "hover:border-purple-300 hover:shadow-purple-100" },
  amber: { bar: "bg-amber-500", iconBg: "bg-amber-50", iconFg: "text-amber-600", badgeBg: "bg-amber-50", badgeFg: "text-amber-700", hoverRing: "hover:border-amber-300 hover:shadow-amber-100" },
  navy: { bar: "bg-navy", iconBg: "bg-navy/5", iconFg: "text-navy", badgeBg: "bg-navy/5", badgeFg: "text-navy", hoverRing: "hover:border-navy/40 hover:shadow-navy/10" },
};

const FAV_STORAGE_KEY = "icaz-admin-favs";

function loadFavs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAV_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}

function saveFavs(hrefs: string[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(hrefs)); } catch { /* ignore */ }
}

export default function AdminButtonGrid() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "") as UserRole | "";
  const overrides = (session?.user as { permissionOverrides?: Array<{ page: AdminPage; granted: boolean }> } | undefined)?.permissionOverrides;

  const [query, setQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.key, !!s.defaultOpen]))
  );
  const [favHrefs, setFavHrefs] = useState<string[]>([]);

  useEffect(() => { setFavHrefs(loadFavs()); }, []);

  function toggleFav(href: string) {
    setFavHrefs((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      saveFavs(next);
      return next;
    });
  }

  if (!role) return null;

  // Build master tile list, permission-filtered.
  const allVisible = useMemo(() =>
    SECTIONS.flatMap((s) =>
      s.tiles.filter((t) => canAccessWithOverrides(role, t.page, overrides)).map((t) => ({ tile: t, section: s }))
    ),
  [role, overrides]);

  const qTrim = query.trim().toLowerCase();
  const searchResults = qTrim
    ? allVisible.filter(({ tile }) =>
        tile.label.toLowerCase().includes(qTrim) ||
        tile.desc.toLowerCase().includes(qTrim) ||
        tile.href.toLowerCase().includes(qTrim)
      )
    : null;

  const favoriteTiles = favHrefs
    .map((href) => allVisible.find((v) => v.tile.href === href))
    .filter((v): v is { tile: Tile; section: Section } => !!v);

  const visibleQuickActions = QUICK_ACTIONS.filter((t) => canAccessWithOverrides(role, t.page, overrides));

  const visibleSections = SECTIONS.map((s) => ({
    ...s,
    tiles: s.tiles.filter((t) => canAccessWithOverrides(role, t.page, overrides)),
  })).filter((s) => s.tiles.length > 0);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find anything — tournaments, payroll, check-in…"
          className="w-full bg-white border border-border rounded-2xl pl-10 pr-4 py-3 text-navy text-sm focus:outline-none focus:border-red/60 shadow-sm"
        />
      </div>

      {/* Search results overlay */}
      {searchResults !== null && (
        <div>
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-3 font-bold">
            {searchResults.length} match{searchResults.length === 1 ? "" : "es"} for "{query}"
          </p>
          {searchResults.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-6 text-center text-text-muted text-sm">
              Nothing matches that search.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {searchResults.map(({ tile, section }) => (
                <TileCard key={tile.href} tile={tile} tint={section.tint} favored={favHrefs.includes(tile.href)} onToggleFav={() => toggleFav(tile.href)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* When searching, hide everything else for focus. */}
      {searchResults === null && (
        <>
          {/* Quick actions hero row */}
          {visibleQuickActions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Sparkles className="w-4 h-4 text-red" aria-hidden="true" />
                <h2 className="text-navy font-bold text-xs uppercase tracking-widest">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {visibleQuickActions.map((tile) => (
                  <Link
                    key={tile.href}
                    href={tile.href}
                    onClick={() => { void triggerHaptic("light"); }}
                    className="group bg-gradient-to-br from-navy to-navy/90 text-white rounded-2xl p-4 min-h-[96px] transition-all hover:shadow-lg active:scale-[0.97]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                        <tile.icon className="w-4 h-4 text-white" aria-hidden={true} />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" aria-hidden="true" />
                    </div>
                    <p className="text-white font-bold text-sm leading-tight">{tile.label}</p>
                    <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{tile.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Favorites */}
          {favoriteTiles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                <h2 className="text-navy font-bold text-xs uppercase tracking-widest">Your Favorites</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {favoriteTiles.map(({ tile, section }) => (
                  <TileCard key={tile.href} tile={tile} tint={section.tint} favored onToggleFav={() => toggleFav(tile.href)} />
                ))}
              </div>
            </div>
          )}

          {/* Collapsible sections */}
          <div className="space-y-3">
            {visibleSections.map((section) => {
              const tint = TINT[section.tint];
              const open = openSections[section.key] ?? false;
              return (
                <div key={section.heading} className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSections((prev) => ({ ...prev, [section.key]: !open }))}
                    aria-expanded={open}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-off-white transition-colors text-left"
                  >
                    <span aria-hidden="true" className={`w-1 h-8 rounded-full ${tint.bar} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-navy font-bold text-base">{section.heading}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tint.badgeBg} ${tint.badgeFg}`}>
                          {section.tiles.length}
                        </span>
                      </div>
                      <p className="text-text-muted text-xs">{section.blurb}</p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 pt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {section.tiles.map((tile) => (
                        <TileCard
                          key={tile.href}
                          tile={tile}
                          tint={section.tint}
                          favored={favHrefs.includes(tile.href)}
                          onToggleFav={() => toggleFav(tile.href)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TileCard({
  tile,
  tint,
  favored,
  onToggleFav,
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
