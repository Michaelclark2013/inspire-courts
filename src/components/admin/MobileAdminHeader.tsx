"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, Menu, Bell, Search as SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Unified mobile-only top bar for the entire /admin surface.
 *
 * On desktop (lg+) the sidebar is the nav chrome, so this renders
 * nothing. On mobile it's the single fixed element at the top:
 *   - /admin landing page → greeting + bell + avatar
 *   - every other admin page → back arrow + page title + menu
 *
 * Previously two separate components (MobileAdminHeader and
 * MobileDashboardHeader) rendered here and created a stacking /
 * overlap bug. This merges them into one.
 */
export default function MobileAdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDashboard = pathname === "/admin";
  const title = titleFromPath(pathname);
  const name = session?.user?.name?.split(" ")[0] ?? "there";
  const photo = (session?.user as { photoUrl?: string | null } | undefined)?.photoUrl;
  const initials = (session?.user?.name || "")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  // Greeting varies by hour — feels more app-native than "Admin Dashboard".
  const h = new Date().getHours();
  const greeting = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";

  return (
    <header
      className={`lg:hidden sticky z-40 bg-white transition-shadow ${
        scrolled ? "shadow-sm border-b border-border" : "border-b border-transparent"
      }`}
      style={{ top: "calc(var(--header-h) + env(safe-area-inset-top))" }}
    >
      <div className="flex items-center h-14 px-3 gap-2">
        {isDashboard ? (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-text-muted text-[10px] uppercase tracking-widest leading-tight">
                {greeting}
              </p>
              <p className="text-navy font-bold text-sm truncate">{name}</p>
            </div>
            <Link
              href="/admin/search"
              aria-label="Search"
              className="w-10 h-10 rounded-full flex items-center justify-center text-navy hover:bg-off-white"
            >
              <SearchIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/admin/announcements"
              aria-label="Announcements"
              className="w-10 h-10 rounded-full flex items-center justify-center text-navy hover:bg-off-white"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <Link
              href="/admin/profile"
              aria-label="My profile"
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-border hover:border-navy/40"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-navy text-xs font-bold">{initials || "U"}</span>
              )}
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="w-10 h-10 flex items-center justify-center text-navy hover:bg-off-white rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="flex-1 text-center text-sm font-bold uppercase tracking-wider text-navy truncate px-1">
              {title}
            </h1>
            <Link
              href="/admin"
              aria-label="Admin dashboard"
              className="w-10 h-10 flex items-center justify-center text-navy hover:bg-off-white rounded-full"
            >
              <Menu className="w-5 h-5" />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

// Friendly titles for nested admin routes. Keeps the mobile sub-header
// in sync with what humans expect to read (e.g. /admin/scores/enter →
// "Score Entry", not "Scores" — which used to duplicate the page's own
// h1 and read as visually overlapping content).
const TITLE_OVERRIDES: Record<string, string> = {
  "scores/enter": "Score Entry",
  "tournaments/manage": "Tournaments",
  "scheduler": "Scheduler",
  "checkin": "Check-In",
  "checkin/qr": "Kiosk QR",
  "my-schedule": "My Schedule",
  "my-history": "My History",
  "time-off": "Time Off",
  "audit-log": "Audit Log",
  "membership-plans": "Plans",
  "launch-readiness": "Launch Readiness",
};

function titleFromPath(path: string): string {
  const trimmed = path.replace(/^\/admin\/?/, "").replace(/\/$/, "");
  if (!trimmed) return "Admin";
  // Drop numeric/UUID-looking segments so /admin/tournaments/42 → "Tournaments"
  const segments = trimmed
    .split("/")
    .filter((s) => !/^\d+$/.test(s) && !/^[a-f0-9-]{8,}$/i.test(s) && s.length > 0);
  if (segments.length === 0) return "Admin";
  // Try increasingly-specific keys: e.g. ["scores","enter"] → "scores/enter",
  // then "scores".
  for (let i = segments.length; i > 0; i--) {
    const key = segments.slice(0, i).join("/");
    if (TITLE_OVERRIDES[key]) return TITLE_OVERRIDES[key];
  }
  // Fallback: last meaningful segment, title-cased.
  const last = segments[segments.length - 1];
  return last
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
