"use client";

import Image from "next/image";
import Link from "next/link";
import CoachDashboard from "@/components/portal/CoachDashboard";

// Coach portal — authentication is enforced by middleware. Anonymous demo
// lookup was removed so coaches always see their own live data.
export default function CoachPortalPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-light-gray px-4 h-14 flex items-center justify-between">
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
          Coach Portal
        </span>
        <Link
          href="/portal"
          className="text-red text-xs font-semibold hover:text-red-hover transition-colors"
        >
          Menu →
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <CoachDashboard />
      </div>
    </div>
  );
}
