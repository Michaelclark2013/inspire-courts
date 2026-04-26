"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, User } from "lucide-react";

// Mobile-only condensed sticky header for /admin. Think of it as the
// "app bar" — a greeting + notification bell + profile avatar that
// always floats at the top so the user can reach navigation without
// scrolling up. Hidden on lg+ (the sidebar + DashboardHero own that
// experience on desktop).
export default function MobileDashboardHeader() {
  const { data: session } = useSession();
  const name = session?.user?.name?.split(" ")[0] ?? "there";
  const photo = (session?.user as { photoUrl?: string | null } | undefined)?.photoUrl;
  const initials = (session?.user?.name || "")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // App-style greeting that varies by hour.
  const h = new Date().getHours();
  const greeting = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";

  return (
    <header
      className={`lg:hidden sticky top-0 z-30 transition-all ${
        scrolled ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent border-b border-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 h-14">
        <div className="min-w-0">
          <p className="text-text-muted text-[10px] uppercase tracking-widest leading-tight">{greeting}</p>
          <p className="text-navy font-bold text-sm truncate">{name}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href="/admin/announcements"
            aria-label="Announcements"
            className="w-10 h-10 rounded-full flex items-center justify-center text-navy hover:bg-off-white transition-colors"
          >
            <Bell className="w-5 h-5" />
          </Link>
          <Link
            href="/admin/profile"
            aria-label="My profile"
            className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-border hover:border-navy/40 transition-colors"
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="w-full h-full object-cover" />
            ) : initials ? (
              <span className="text-navy text-xs font-bold">{initials}</span>
            ) : (
              <User className="w-4 h-4 text-navy" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
