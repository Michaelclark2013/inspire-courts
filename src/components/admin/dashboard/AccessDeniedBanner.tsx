"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldX, X } from "lucide-react";

// Read-only helper — mirrors the PAGE_LABELS map in lib/permissions.ts
// just enough to give friendly names to common redirected pages.
const PAGE_NAMES: Record<string, string> = {
  revenue: "Revenue",
  payroll: "Payroll",
  roster: "Staff Roster",
  shifts: "Shifts",
  users: "User Accounts",
  audit_log: "Audit Log",
  analytics: "Analytics",
  tournaments: "Tournaments",
  teams: "Teams",
  players: "Players",
  scores: "Scores",
  score_entry: "Score Entry",
  checkin: "Check-in",
  announcements: "Announcements",
  content: "Content Editor",
  files: "Files",
  resources: "Fleet",
  equipment: "Equipment",
  maintenance: "Maintenance",
  members: "Members",
  leads: "Leads",
  sponsors: "Sponsors",
  approvals: "Approvals",
  certifications: "Certifications",
  time_off: "Time Off",
  programs: "Programs",
};

// Shows a banner when the user was redirected from an admin page they
// don't have access to. Consumed via ?denied=<page> on /admin.
export default function AccessDeniedBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const denied = params?.get("denied");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(Boolean(denied));
  }, [denied]);

  function dismiss() {
    setVisible(false);
    // Strip the query param without a full reload.
    const url = new URL(window.location.href);
    url.searchParams.delete("denied");
    router.replace(url.pathname + url.search);
  }

  if (!visible || !denied) return null;

  const pretty = PAGE_NAMES[denied] || denied.replace(/_/g, " ");

  return (
    <div className="mb-6 bg-red/5 border border-red/20 rounded-2xl px-5 py-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0">
        <ShieldX className="w-4 h-4 text-red" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-navy font-bold text-sm">Access denied</p>
        <p className="text-text-muted text-xs mt-0.5">
          You don't have permission for <span className="text-navy font-semibold">{pretty}</span>.
          Ask the main admin to grant access in Permissions.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-text-muted hover:text-navy p-1 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
