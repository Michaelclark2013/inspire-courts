"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Trophy,
  ArrowRight,
  X,
} from "lucide-react";
import type { AdminAlertCounts } from "@/types/admin-dashboard";

const DISMISSED_KEY = "admin-dashboard-dismissed-alerts";

function useDismissed() {
  const [dismissed, setDismissed] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (raw) setDismissed(JSON.parse(raw));
    } catch {}
  }, []);
  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = { ...prev, [id]: Date.now() };
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  // Expire dismissals after 24 hours
  const active = (id: string) =>
    !dismissed[id] || Date.now() - dismissed[id] > 24 * 60 * 60 * 1000;
  return { active, dismiss };
}

function DashboardAlertsBar({ alerts }: { alerts: AdminAlertCounts }) {
  const { active, dismiss } = useDismissed();

  const items = [
    alerts.pendingRegistrations > 0 && {
      id: "pendingRegistrations",
      icon: AlertTriangle,
      text: `${alerts.pendingRegistrations} registration${
        alerts.pendingRegistrations !== 1 ? "s" : ""
      } awaiting payment`,
      href: "/admin/tournaments/manage",
      colorClass: "bg-amber-50 border-amber-200 text-amber-700",
      badge: alerts.pendingRegistrations,
    },
    alerts.draftTournaments > 0 && {
      id: "draftTournaments",
      icon: Trophy,
      text: `${alerts.draftTournaments} draft tournament${
        alerts.draftTournaments !== 1 ? "s" : ""
      } ready to publish`,
      href: "/admin/tournaments/manage",
      colorClass: "bg-blue-50 border-blue-200 text-blue-700",
      badge: null,
    },
  ].filter(Boolean) as Array<{
    id: string;
    icon: typeof AlertTriangle;
    text: string;
    href: string;
    colorClass: string;
    badge: number | null;
  }>;

  const visible = items.filter((i) => active(i.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2" role="region" aria-label="Dashboard alerts">
      {visible.map((a) => {
        const Icon = a.icon;
        return (
          <div
            key={a.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${a.colorClass}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <Link
              href={a.href}
              prefetch
              className="text-sm flex-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded"
            >
              {a.text}
            </Link>
            {a.badge !== null ? (
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center tabular-nums">
                {a.badge}
              </span>
            ) : (
              <ArrowRight className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
            )}
            <button
              type="button"
              onClick={() => dismiss(a.id)}
              aria-label={`Dismiss ${a.id} alert`}
              className="flex-shrink-0 p-1 rounded hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default memo(DashboardAlertsBar);
