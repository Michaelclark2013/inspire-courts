"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Pencil, LayoutDashboard, LogOut, X, Settings } from "lucide-react";
import Link from "next/link";

const PATH_TO_CMS_PAGE: Record<string, string> = {
  "/": "home",
  "/about": "about",
  "/events": "events",
  "/facility": "facility",
  "/training": "training",
  "/contact": "contact",
  "/schedule": "schedule",
  "/gameday": "gameday",
  "/teams": "teams",
  "/media": "media",
  "/prep": "prep",
  "/gallery": "gallery",
};

export default function EditToolbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // Don't show for non-admins, on admin pages, or if dismissed
  if (!session?.user || pathname?.startsWith("/admin") || pathname === "/login" || dismissed) {
    return null;
  }

  const cmsPage = PATH_TO_CMS_PAGE[pathname || ""] || "";
  const editUrl = cmsPage
    ? `/admin/content?page=${cmsPage}`
    : "/admin/content";

  return (
    <div className="fixed bottom-4 left-4 z-[90] flex items-center gap-2 bg-navy/95 backdrop-blur border border-white/10 rounded-full px-2 py-1.5 shadow-xl">
      <Link
        href={editUrl}
        className="flex items-center gap-1.5 bg-red hover:bg-red-hover text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-full transition-colors"
      >
        <Pencil className="w-3 h-3" aria-hidden="true" />
        Edit Page
      </Link>
      <Link
        href="/admin"
        className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-semibold px-2 py-2 rounded-full transition-colors"
        title="Dashboard"
        aria-label="Dashboard"
      >
        <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-1.5 text-white/70 hover:text-red text-xs font-semibold px-2 py-2 rounded-full transition-colors"
        title="Sign Out"
        aria-label="Sign Out"
      >
        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-white/40 hover:text-white/70 px-1 py-2 transition-colors"
        title="Dismiss"
        aria-label="Dismiss toolbar"
      >
        <X className="w-3 h-3" aria-hidden="true" />
      </button>
    </div>
  );
}
