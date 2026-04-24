"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, ArrowUpRight } from "lucide-react";

type Entry = { href: string; label: string; visitedAt: string };

const STORAGE_KEY = "icaz-admin-mru";
const LIMIT = 8;

// Human-friendly labels derived from the path. Mirrors permission-paths
// but simpler.
function labelFor(path: string): string {
  if (path === "/admin") return "Dashboard";
  const parts = path.replace(/^\/admin\//, "").split("/");
  return parts
    .map((p) => p.replace(/-/g, " "))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" › ");
}

// Tracks visited admin pages and renders the top N as a quick-access
// strip. Only records actual admin pages (not modals / hash updates).
export default function RecentlyVisited() {
  const pathname = usePathname();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Record the current path whenever it changes, but skip /admin
  // itself so opening the dashboard doesn't push out real pages.
  useEffect(() => {
    if (!pathname || !pathname.startsWith("/admin") || pathname === "/admin") return;
    try {
      const existing: Entry[] = (() => {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      })();
      const filtered = existing.filter((e) => e.href !== pathname);
      const next = [{ href: pathname, label: labelFor(pathname), visitedAt: new Date().toISOString() }, ...filtered].slice(0, LIMIT);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setEntries(next);
    } catch { /* ignore */ }
  }, [pathname]);

  if (entries.length === 0) return null;

  return (
    <section aria-label="Recently visited" className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Clock className="w-4 h-4 text-text-muted" aria-hidden="true" />
        <h2 className="text-navy font-bold text-xs uppercase tracking-widest">Recently Visited</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {entries.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="flex-shrink-0 bg-white border border-border rounded-full px-4 py-1.5 text-xs font-semibold text-navy hover:bg-off-white active:scale-[0.97] transition-all flex items-center gap-1.5"
          >
            {e.label}
            <ArrowUpRight className="w-3 h-3 text-text-muted" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
