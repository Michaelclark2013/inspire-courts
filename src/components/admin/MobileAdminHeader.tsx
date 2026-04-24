"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Menu } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Mobile-only sticky page header for the admin panel.
 *
 * On desktop (lg+) the sidebar is always visible and acts as the nav
 * chrome, so this component renders nothing. On mobile we need:
 *   - A visible page title so users know where they are (tables don't
 *     always lead with a title)
 *   - A back button to the admin overview (or the parent segment)
 *   - A safe-area inset so notches don't clip the title
 *   - Scroll-shadow so it's obvious there's content below
 *
 * Title derivation: takes the last non-ID segment of the pathname and
 * title-cases it. `/admin/tournaments/42` → "Tournaments"; same-page
 * overrides can pass `titleOverride` via a prop if needed later.
 */
export default function MobileAdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Nothing to show on the admin landing page — the dashboard has its own hero.
  if (pathname === "/admin") return null;

  const title = titleFromPath(pathname);
  const showBack = pathname !== "/admin";

  return (
    <header
      className={`lg:hidden sticky top-0 z-40 bg-white transition-shadow ${
        scrolled ? "shadow-sm border-b border-border" : "border-b border-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center h-12 px-2 gap-1">
        {showBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="w-10 h-10 flex items-center justify-center text-navy hover:text-red transition-colors rounded-full"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <h1 className="flex-1 text-center text-sm font-bold uppercase tracking-wider text-navy truncate px-2">
          {title}
        </h1>
        <Link
          href="/admin"
          aria-label="Admin menu"
          className="w-10 h-10 flex items-center justify-center text-navy hover:text-red transition-colors rounded-full"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

function titleFromPath(path: string): string {
  // Strip trailing slash + leading /admin/
  const trimmed = path.replace(/^\/admin\/?/, "").replace(/\/$/, "");
  if (!trimmed) return "Admin";
  // Take the first segment, skipping numeric ids (e.g. /tournaments/42 → "Tournaments")
  const segments = trimmed.split("/").filter((s) => !/^\d+$/.test(s) && s.length > 0);
  const first = segments[0] || "Admin";
  // Dash-separated kebab-case → Title Case
  return first
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
