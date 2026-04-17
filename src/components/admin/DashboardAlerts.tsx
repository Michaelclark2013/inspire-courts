"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [error, setError] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const router = useRouter();

  const fetchAlerts = useCallback(async () => {
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

      // Count pending registrations across all tournaments (parallel fetches)
      const pendingCounts = await Promise.all(
        tournaments.map(async (t: { id: number }) => {
          try {
            const regRes = await fetch(`/api/admin/tournaments/${t.id}/registrations`);
            if (regRes.ok) {
              const regs = await regRes.json();
              return regs.filter(
                (r: { paymentStatus: string }) => r.paymentStatus === "pending"
              ).length;
            }
          } catch {}
          return 0;
        })
      );
      const pendingRegistrations = pendingCounts.reduce((sum: number, n: number) => sum + n, 0);

      // Count upcoming games
      const gamesRes = await fetch("/api/scores/live");
      const games = gamesRes.ok ? await gamesRes.json() : [];
      const upcomingGames = games.filter(
        (g: { status: string }) => g.status === "scheduled"
      ).length;

      setError(false);
      setData({ pendingRegistrations, activeTournaments, upcomingGames, draftTournaments });
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      switch (e.key.toLowerCase()) {
        case "t":
          router.push("/admin/tournaments/manage");
          break;
        case "s":
          router.push("/admin/scores/enter");
          break;
        case "c":
          router.push("/admin/checkin");
          break;
        case "a":
          router.push("/admin/announcements");
          break;
        case "?":
          setShowShortcuts((v) => !v);
          break;
        case "escape":
          setShowShortcuts(false);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  if (error && !data) {
    return (
      <div className="bg-red/5 border border-red/20 rounded-xl p-5 mb-8 text-center">
        <p className="text-navy/60 text-sm mb-2">Unable to load alerts</p>
        <button onClick={() => { setError(false); fetchAlerts(); }} className="text-red text-xs font-bold uppercase tracking-wider hover:text-red-hover transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 mb-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-12 bg-white border border-border rounded-xl" />
          <div className="h-12 bg-white border border-border rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-white border border-border rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const alerts = [
    data.pendingRegistrations > 0 && {
      id: "pendingRegistrations",
      icon: AlertTriangle,
      color: "amber",
      text: `${data.pendingRegistrations} registration${data.pendingRegistrations !== 1 ? "s" : ""} awaiting payment`,
      href: "/admin/tournaments/manage",
    },
    data.draftTournaments > 0 && {
      id: "draftTournaments",
      icon: Trophy,
      color: "blue",
      text: `${data.draftTournaments} draft tournament${data.draftTournaments !== 1 ? "s" : ""} ready to publish`,
      href: "/admin/tournaments/manage",
    },
  ].filter(Boolean) as { id: string; icon: typeof AlertTriangle; color: string; text: string; href: string }[];

  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    red: "bg-red/10 border-red/20 text-red",
  };

  const SHORTCUTS = [
    { key: "T", desc: "Create / manage tournaments" },
    { key: "S", desc: "Enter scores" },
    { key: "C", desc: "Game day check-in" },
    { key: "A", desc: "Post announcement" },
    { key: "?", desc: "Toggle this shortcuts panel" },
    { key: "Esc", desc: "Close shortcuts panel" },
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/20" onClick={() => setShowShortcuts(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-navy font-bold text-sm uppercase tracking-wider">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-text-secondary hover:text-navy transition-colors" aria-label="Close shortcuts">✕</button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <kbd className="bg-bg border border-border rounded px-2 py-1 text-xs font-mono text-navy font-bold min-w-[2.5rem] text-center">{s.key}</kbd>
                  <span className="text-text-secondary text-sm">{s.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-text-secondary text-xs mt-4">Shortcuts only active when not focused on an input field.</p>
          </div>
        </>
      )}
      {/* Alert Cards */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const Icon = alert.icon;
            return (
              <Link
                key={i}
                href={alert.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50 ${colorMap[alert.color]}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm flex-1">{alert.text}</span>
                {alert.id === "pendingRegistrations" ? (
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center tabular-nums">
                    {data.pendingRegistrations}
                  </span>
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <Link
          href="/admin/tournaments/manage"
          className="flex items-center justify-center gap-3 bg-red hover:bg-red-hover text-white rounded-xl px-6 py-4 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50"
        >
          <Trophy className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Create New Tournament</span>
          <kbd className="hidden lg:inline-block text-[9px] text-navy/40 bg-white/10 px-1.5 py-0.5 rounded font-mono ml-2">T</kbd>
          <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            href="/admin/scores/enter"
            icon={ClipboardList}
            label="Enter Scores"
            color="text-emerald-400"
            shortcutHint="S"
          />
          <QuickAction
            href="/admin/checkin"
            icon={UserCheck}
            label="Check-In"
            color="text-cyan-400"
            shortcutHint="C"
          />
          <QuickAction
            href="/admin/announcements"
            icon={Megaphone}
            label="Announcement"
            color="text-amber-400"
            shortcutHint="A"
          />
          <QuickAction
            href="/admin/teams"
            icon={Users}
            label="Teams"
            color="text-blue-400"
          />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
  shortcutHint,
}: {
  href: string;
  icon: typeof Zap;
  label: string;
  color: string;
  shortcutHint?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex items-center gap-2.5 bg-white border border-border hover:border-navy/30 rounded-xl px-4 py-3 transition-all group hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50"
    >
      <Icon className={`w-4 h-4 ${color} group-hover:scale-110 transition-transform`} />
      <span className="text-navy text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
      {shortcutHint && (
        <kbd className="hidden lg:inline-block ml-auto text-[9px] text-navy/20 bg-off-white px-1.5 py-0.5 rounded font-mono">
          {shortcutHint}
        </kbd>
      )}
    </Link>
  );
}
