"use client";

import Image from "next/image";
import Link from "next/link";
import PlayerDashboard from "@/components/portal/PlayerDashboard";

// Player portal — authentication is enforced by middleware. Anonymous demo
// lookup was removed so parents/players always see their own live data.
export default function PlayerPortalPage() {
  return (
    <div className="min-h-screen bg-white">
      <header
        className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-light-gray px-4 flex items-center justify-between h-14"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/inspire-athletics-logo.png"
            alt="Inspire Courts"
            width={28}
            height={28}
            className="object-contain"
          />
          <span className="text-navy font-bold text-sm uppercase tracking-tight">
            Inspire
          </span>
        </Link>
        <span className="text-text-muted text-xs font-semibold uppercase tracking-widest">
          Player Portal
        </span>
        <Link
          href="/portal"
          className="text-red text-xs font-semibold hover:text-red-hover transition-colors"
        >
          Menu →
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <PlayerDashboard />
      </div>
    </div>
  );
}
