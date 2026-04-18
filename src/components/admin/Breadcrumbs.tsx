"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  admin: "Dashboard",
  tournaments: "Tournaments",
  manage: "Manage",
  scores: "Scores",
  enter: "Score Entry",
  staff: "Staff & Refs",
  players: "Players",
  users: "User Accounts",
  prospects: "Prospects",
  leads: "Pipeline",
  revenue: "Revenue",
  teams: "Teams",
  checkin: "Check-In",
  sponsors: "Sponsorships",
  approvals: "Approvals",
  announcements: "Announcements",
  schools: "Schools",
  content: "Content Editor",
  files: "Files & Drive",
  analytics: "Analytics",
  "my-schedule": "My Schedule",
  "my-history": "My Work History",
  contacts: "Contacts",
  links: "Links",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Only show on pages deeper than /admin (i.e. /admin/something)
  if (segments.length < 2) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    // If segment looks like a dynamic ID (number or UUID-like), show it abbreviated
    const isId = /^\d+$/.test(seg) || /^[a-f0-9-]{8,}$/i.test(seg);
    const label = isId ? `#${seg.slice(0, 8)}` : LABELS[seg] || seg.replace(/-/g, " ");
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-xs text-text-muted">
        <li>
          <Link
            href="/admin"
            className="hover:text-navy transition-colors inline-flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </li>
        {crumbs.slice(1).map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-text-muted/50" aria-hidden="true" />
            {crumb.isLast ? (
              <span className="font-semibold text-navy capitalize">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-navy transition-colors capitalize"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
