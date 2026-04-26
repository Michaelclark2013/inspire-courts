"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Trophy,
  Users,
  UserCheck,
  DollarSign,
  ClipboardList,
  Megaphone,
  FileText,
  Settings,
  Link2,
  GraduationCap,
  Briefcase,
  School,
  CalendarDays,
  BarChart3,
  Image,
  Star,
  ScrollText,
  Rocket,
  Activity,
  Wrench,
  Package,
  BadgeCheck,
  Clock,
  CalendarClock,
  Plane,
  Truck,
  Receipt,
  Wallet,
  Shield,
  Tv,
  History,
  IdCard,
  FileSignature,
  PiggyBank,
} from "lucide-react";
import { triggerHaptic } from "@/lib/capacitor";

interface CommandItem {
  label: string;
  href: string;
  icon: React.ElementType;
  keywords?: string[];
}

const COMMANDS: CommandItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { label: "Tournaments", href: "/admin/tournaments", icon: Trophy, keywords: ["events", "brackets"] },
  { label: "Manage Tournaments", href: "/admin/tournaments/manage", icon: Trophy, keywords: ["create", "edit"] },
  { label: "Teams", href: "/admin/teams", icon: Users, keywords: ["roster", "players"] },
  { label: "Team Logos", href: "/admin/teams/logos", icon: Image, keywords: ["upload", "images"] },
  { label: "Check-In", href: "/admin/checkin", icon: UserCheck, keywords: ["attendance", "gameday"] },
  { label: "Score Entry", href: "/admin/scores/enter", icon: ClipboardList, keywords: ["game", "live"] },
  { label: "Scores Overview", href: "/admin/scores", icon: BarChart3, keywords: ["results", "standings"] },
  { label: "Revenue", href: "/admin/revenue", icon: DollarSign, keywords: ["money", "payments", "square"] },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone, keywords: ["news", "alerts"] },
  { label: "Content Manager", href: "/admin/content", icon: FileText, keywords: ["cms", "pages", "edit"] },
  { label: "Users", href: "/admin/users", icon: Settings, keywords: ["accounts", "roles", "admin"] },
  { label: "Players", href: "/admin/players", icon: Users, keywords: ["athletes", "roster"] },
  { label: "Leads", href: "/admin/leads", icon: Star, keywords: ["prospects", "sales"] },
  { label: "Prospects", href: "/admin/prospects", icon: Briefcase, keywords: ["pipeline"] },
  { label: "Schools", href: "/admin/schools", icon: School, keywords: ["organizations"] },
  { label: "Contacts", href: "/admin/contacts", icon: Users, keywords: ["people", "directory"] },
  { label: "Staff", href: "/admin/staff", icon: GraduationCap, keywords: ["employees", "coaches"] },
  { label: "Sponsors", href: "/admin/sponsors", icon: Star, keywords: ["partners"] },
  { label: "Links", href: "/admin/links", icon: Link2, keywords: ["urls", "shortlinks"] },
  { label: "My Schedule", href: "/admin/my-schedule", icon: CalendarDays, keywords: ["calendar"] },
  { label: "Approvals", href: "/admin/approvals", icon: UserCheck, keywords: ["pending", "review"] },
  { label: "Files", href: "/admin/files", icon: FileText, keywords: ["documents", "uploads"] },
  { label: "Owner Mode", href: "/admin/owner", icon: Star, keywords: ["dashboard", "executive", "five numbers", "mrr"] },
  { label: "Billing", href: "/admin/billing", icon: DollarSign, keywords: ["subscriptions", "dunning", "past due", "mrr"] },
  { label: "Churn Radar", href: "/admin/churn", icon: Activity, keywords: ["at risk", "win back", "retention", "ai"] },
  { label: "SMS Inbox", href: "/admin/inbox", icon: Megaphone, keywords: ["text", "messages", "twilio", "two way"] },
  { label: "Inquiries", href: "/admin/inquiries", icon: Briefcase, keywords: ["leads", "pipeline", "sla", "contact form"] },
  { label: "AI Scheduler", href: "/admin/scheduler", icon: CalendarDays, keywords: ["shifts", "fill", "auto-assign"] },
  { label: "Workouts", href: "/admin/workouts", icon: Trophy, keywords: ["wod", "leaderboards", "library"] },
  { label: "Integrations", href: "/admin/integrations", icon: Link2, keywords: ["api keys", "webhooks", "zapier"] },
  { label: "Roster", href: "/admin/roster", icon: GraduationCap, keywords: ["staff list", "pay rates", "ytd"] },
  { label: "Global Search", href: "/admin/search", icon: Search, keywords: ["find", "lookup", "everywhere"] },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText, keywords: ["history", "changes", "diff"] },
  { label: "Launch Status", href: "/admin/launch-status", icon: Rocket, keywords: ["env", "go-live", "ready"] },
  { label: "System Health", href: "/admin/ops", icon: Activity, keywords: ["health", "infra", "uptime"] },
  // Bulk-added so every admin page is reachable via Cmd+K, not just
  // the highlights. Power-user nav matters more than a curated list.
  { label: "Members", href: "/admin/members", icon: IdCard, keywords: ["roster", "memberships", "subscribers"] },
  { label: "Membership Plans", href: "/admin/membership-plans", icon: Wallet, keywords: ["pricing", "tiers", "plans"] },
  { label: "Programs", href: "/admin/programs", icon: GraduationCap, keywords: ["camps", "clinics", "classes"] },
  { label: "Equipment", href: "/admin/equipment", icon: Package, keywords: ["inventory", "stock", "reorder"] },
  { label: "Maintenance", href: "/admin/maintenance", icon: Wrench, keywords: ["tickets", "facility", "repair"] },
  { label: "Resources / Rentals", href: "/admin/resources", icon: Truck, keywords: ["fleet", "rental", "vehicles"] },
  { label: "Rentals", href: "/admin/rentals", icon: Truck, keywords: ["bookings", "rental", "vehicle"] },
  { label: "Expenses", href: "/admin/expenses", icon: Receipt, keywords: ["spending", "vendors", "tax"] },
  { label: "Payroll", href: "/admin/payroll", icon: PiggyBank, keywords: ["pay", "wages", "1099", "ytd"] },
  { label: "Time Clock", href: "/admin/timeclock", icon: Clock, keywords: ["hours", "shifts", "clocked in"] },
  { label: "Time Off", href: "/admin/time-off", icon: Plane, keywords: ["pto", "vacation", "leave"] },
  { label: "Shifts", href: "/admin/shifts", icon: CalendarClock, keywords: ["scheduling", "coverage", "staffing"] },
  { label: "Availability", href: "/admin/availability", icon: CalendarClock, keywords: ["staff", "weekly", "windows"] },
  { label: "Staffing", href: "/admin/staffing", icon: Users, keywords: ["coverage", "minimums", "courts open"] },
  { label: "Certifications", href: "/admin/certifications", icon: BadgeCheck, keywords: ["cpr", "expirations", "compliance"] },
  { label: "Waivers", href: "/admin/waivers", icon: FileSignature, keywords: ["liability", "signed", "forms"] },
  { label: "Broadcasts", href: "/admin/broadcasts", icon: Megaphone, keywords: ["email blast", "team broadcast"] },
  { label: "Permissions", href: "/admin/permissions", icon: Shield, keywords: ["access", "roles", "overrides"] },
  { label: "Security", href: "/admin/security", icon: Shield, keywords: ["audit", "login", "2fa"] },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, keywords: ["ga", "traffic", "events"] },
  { label: "Reports", href: "/admin/reports", icon: FileText, keywords: ["export", "summary", "month"] },
  { label: "Gym Schedule", href: "/admin/gym-schedule", icon: CalendarDays, keywords: ["calendar", "courts", "availability"] },
  { label: "Profile", href: "/admin/profile", icon: UserCheck, keywords: ["my profile", "account", "settings"] },
  { label: "My History", href: "/admin/my-history", icon: History, keywords: ["my work", "activity", "personal"] },
  { label: "Lobby Board", href: "/admin/checkin/board", icon: Tv, keywords: ["projector", "tv", "kiosk", "checkin"] },
  { label: "Launch Readiness", href: "/admin/launch-readiness", icon: Rocket, keywords: ["pre-launch", "go-live", "checklist"] },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.href.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.includes(q)),
    );
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      triggerHaptic("light");
      router.push(href);
    },
    [router],
  );

  // Keyboard navigation with haptic feedback
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => {
        const next = Math.min(s + 1, filtered.length - 1);
        if (next !== s) triggerHaptic("light");
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => {
        const next = Math.max(s - 1, 0);
        if (next !== s) triggerHaptic("light");
        return next;
      });
    } else if (e.key === "Enter" && filtered[selected]) {
      navigate(filtered[selected].href);
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div
        className="fixed z-[71] top-[20%] left-1/2 -translate-x-1/2 w-[90vw] max-w-[520px] bg-white rounded-2xl shadow-2xl border border-light-gray overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-light-gray">
          <Search className="w-5 h-5 text-text-muted flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search admin pages..."
            className="flex-1 bg-transparent text-navy text-sm placeholder:text-text-muted outline-none"
            aria-label="Search admin pages"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-off-white border border-border rounded text-[10px] text-text-muted font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} role="listbox" aria-label="Search results" className="max-h-[360px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">
              No pages found for &ldquo;{query}&rdquo;
            </p>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.href}
                  type="button"
                  role="option"
                  aria-selected={i === selected}
                  onClick={() => navigate(cmd.href)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                    i === selected
                      ? "bg-red/5 text-red"
                      : "text-navy hover:bg-off-white"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 opacity-60" />
                  <span className="text-sm font-medium">{cmd.label}</span>
                  <span className="ml-auto text-[10px] text-text-muted font-mono opacity-100 md:opacity-0 md:group-hover:opacity-100 hidden sm:inline truncate max-w-[40%]">
                    {cmd.href}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-light-gray px-5 py-2.5 flex items-center gap-4 text-[10px] text-text-muted">
          <span>
            <kbd className="bg-off-white border border-border rounded px-1 font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="bg-off-white border border-border rounded px-1 font-mono">↵</kbd> open
          </span>
          <span>
            <kbd className="bg-off-white border border-border rounded px-1 font-mono">esc</kbd> close
          </span>
        </div>
      </div>
    </>
  );
}
