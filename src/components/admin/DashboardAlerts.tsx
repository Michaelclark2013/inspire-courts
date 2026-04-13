"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Trophy,
  UserCheck,
  Megaphone,
  ArrowRight,
  ClipboardList,
  Zap,
  Users,
} from "lucide-react";

type AlertData = {
  pendingRegistrations: number;
  activeTournaments: number;
  upcomingGames: number;
  draftTournaments: number;
};

export default function DashboardAlerts() {
  const [data, setData] = useState<AlertData | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        // Fetch tournament data for alerts
        const tourRes = await fetch("/api/admin/tournaments");
        const tournaments = tourRes.ok ? await tourRes.json() : [];

        const activeTournaments = tournaments.filter(
          (t: { status: string }) => t.status === "active"
        ).length;
        const draftTournaments = tournaments.filter(
          (t: { status: string }) => t.status === "draft"
        ).length;

        // Count pending registrations across all tournaments
        let pendingRegistrations = 0;
        for (const t of tournaments) {
          try {
            const regRes = await fetch(`/api/admin/tournaments/${t.id}/registrations`);
            if (regRes.ok) {
              const regs = await regRes.json();
              pendingRegistrations += regs.filter(
                (r: { paymentStatus: string }) => r.paymentStatus === "pending"
              ).length;
            }
          } catch {}
        }

        // Count upcoming games
        const gamesRes = await fetch("/api/scores/live");
        const games = gamesRes.ok ? await gamesRes.json() : [];
        const upcomingGames = games.filter(
          (g: { status: string }) => g.status === "scheduled"
        ).length;

        setData({ pendingRegistrations, activeTournaments, upcomingGames, draftTournaments });
      } catch {}
    }

    fetchAlerts();
  }, []);

  if (!data) return null;

  const alerts = [
    data.pendingRegistrations > 0 && {
      icon: AlertTriangle,
      color: "amber",
      text: `${data.pendingRegistrations} registration${data.pendingRegistrations !== 1 ? "s" : ""} awaiting payment`,
      href: "/admin/tournaments/manage",
    },
    data.draftTournaments > 0 && {
      icon: Trophy,
      color: "blue",
      text: `${data.draftTournaments} draft tournament${data.draftTournaments !== 1 ? "s" : ""} ready to publish`,
      href: "/admin/tournaments/manage",
    },
  ].filter(Boolean) as { icon: typeof AlertTriangle; color: string; text: string; href: string }[];

  const colorMap: Record<string, string> = {
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    red: "bg-red/10 border-red/20 text-red",
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Alert Cards */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const Icon = alert.icon;
            return (
              <Link
                key={i}
                href={alert.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:bg-white/[0.02] ${colorMap[alert.color]}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm flex-1">{alert.text}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction
          href="/admin/tournaments/manage"
          icon={Trophy}
          label="New Tournament"
          color="text-red"
        />
        <QuickAction
          href="/admin/scores/enter"
          icon={ClipboardList}
          label="Enter Scores"
          color="text-emerald-400"
        />
        <QuickAction
          href="/admin/checkin"
          icon={UserCheck}
          label="Check-In"
          color="text-cyan-400"
        />
        <QuickAction
          href="/admin/announcements"
          icon={Megaphone}
          label="Announcement"
          color="text-amber-400"
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: typeof Zap;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex items-center gap-2.5 bg-card border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 transition-all group hover:scale-[1.02] active:scale-[0.98]"
    >
      <Icon className={`w-4 h-4 ${color} group-hover:scale-110 transition-transform`} />
      <span className="text-white text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
    </Link>
  );
}
