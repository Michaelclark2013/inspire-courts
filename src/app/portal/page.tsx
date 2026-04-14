"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import {
  Trophy,
  Users,
  Calendar,
  Radio,
  FileCheck,
  UserCheck,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  Megaphone,
  AlertTriangle,
  RefreshCw,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { usePortalView } from "@/components/portal/PortalViewContext";

type LiveGame = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  quarter: string | null;
  division: string | null;
};

type RegistrationStep = {
  label: string;
  description: string;
  href: string;
  done: boolean;
  icon: typeof FileCheck;
};

export default function PortalDashboard() {
  const { data: session } = useSession();
  const { viewAsRole } = usePortalView();
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [rosterCount, setRosterCount] = useState<number | null>(null);
  const [waiverSubmitted, setWaiverSubmitted] = useState(false);
  const [portalAnnouncements, setPortalAnnouncements] = useState<
    { id: number; title: string; body: string; audience: string; createdAt: string }[]
  >([]);
  const [myRegistrations, setMyRegistrations] = useState<
    { id: number; tournamentId: number; tournamentName: string; tournamentDate: string; teamName: string; division: string | null; paymentStatus: string; status: string }[]
  >([]);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const actualRole = session?.user?.role;
  const role = (actualRole === "admin" && viewAsRole) ? viewAsRole : actualRole;
  const name = session?.user?.name?.split(" ")[0] || "there";
  const liveNow = liveGames.filter((g) => g.status === "live");

  const fetchData = useCallback(async () => {
    try {
      const [gamesRes, announcementsRes, registrationsRes] = await Promise.allSettled([
        fetch("/api/scores/live").then((r) => r.json()),
        fetch("/api/portal/announcements").then((r) => r.json()),
        fetch("/api/portal/registrations").then((r) => r.json()),
      ]);

      if (gamesRes.status === "fulfilled") setLiveGames(gamesRes.value);
      if (announcementsRes.status === "fulfilled") setPortalAnnouncements(announcementsRes.value);
      if (registrationsRes.status === "fulfilled" && Array.isArray(registrationsRes.value)) setMyRegistrations(registrationsRes.value);

      setLastUpdated(new Date());
      setSecondsAgo(0);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  // Visibility-aware polling: pauses when tab is hidden, resumes on focus.
  // 30s interval — saves 50-70% of requests from background tabs.
  useVisibilityPolling(fetchData, 30_000);

  // Seconds-ago ticker
  useEffect(() => {
    const tick = setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  // Fetch roster count for coaches
  useEffect(() => {
    if (role === "coach") {
      fetch("/api/portal/roster")
        .then((r) => r.json())
        .then((data) => {
          if (data.players) setRosterCount(data.players.length);
        })
        .catch(() => {});
    }
  }, [role]);

  // Coach registration steps
  const registrationSteps: RegistrationStep[] = role === "coach" ? [
    {
      label: "Submit Waiver",
      description: "Required for all players before game day",
      href: "/portal/waiver",
      done: waiverSubmitted,
      icon: FileCheck,
    },
    {
      label: "Upload Roster",
      description: "Add all players to your team",
      href: "/portal/roster",
      done: (rosterCount ?? 0) >= 1,
      icon: Users,
    },
    {
      label: "Team Check-In",
      description: "Check in your players on game day",
      href: "/portal/checkin",
      done: false,
      icon: UserCheck,
    },
    {
      label: "Confirm Payment",
      description: "Contact admin to confirm tournament entry",
      href: "/portal/profile",
      done: false,
      icon: CreditCard,
    },
  ] : [];

  const completedSteps = registrationSteps.filter((s) => s.done).length;
  const totalSteps = registrationSteps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const greeting = new Date().getHours() < 12
    ? "Good morning"
    : new Date().getHours() < 17
    ? "Good afternoon"
    : "Good evening";

  // Error state
  if (error && liveGames.length === 0 && myRegistrations.length === 0) {
    return (
      <div className="p-5 lg:p-8 max-w-5xl">
        <div className="mb-6">
          <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
            {role === "coach" ? "Coach Portal" : role === "parent" ? "Parent Portal" : "Portal"}
          </p>
          <h1 className="text-navy text-xl lg:text-2xl font-bold font-heading">
            {greeting}, {name}
          </h1>
        </div>
        <div className="bg-red/10 border border-red/20 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red mx-auto mb-3" />
          <h3 className="text-navy font-semibold mb-1">Failed to Load Dashboard</h3>
          <p className="text-text-muted text-sm mb-4">
            Could not connect to the server. Check your connection and try again.
          </p>
          <button
            onClick={() => { setError(false); fetchData(); }}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8 max-w-5xl">
      {/* View-As Banner */}
      {actualRole === "admin" && viewAsRole && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-600 text-xs font-semibold">
          <Eye className="w-3.5 h-3.5" />
          Viewing as {viewAsRole === "coach" ? "Coach" : "Parent"} — This is what a {viewAsRole} sees on their dashboard.
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
            {role === "coach" ? "Coach Portal" : role === "parent" ? "Parent Portal" : "Portal"}
          </p>
          <h1 className="text-navy text-xl lg:text-2xl font-bold font-heading">
            {greeting}, {name}
          </h1>
        </div>
        {lastUpdated && (
          <button
            onClick={fetchData}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              secondsAgo > 60
                ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                : "text-text-muted bg-off-white hover:bg-navy/[0.04]"
            }`}
            title="Click to refresh"
          >
            <RefreshCw className="w-3 h-3" />
            {secondsAgo < 5 ? "Just now" : `${secondsAgo}s ago`}
          </button>
        )}
      </div>

      {/* Announcements */}
      {portalAnnouncements.length > 0 && (
        <div className="mb-6 space-y-2">
          {portalAnnouncements.slice(0, 3).map((a) => (
            <div
              key={a.id}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <Megaphone className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-0.5">
                    {a.title}
                  </p>
                  <p className="text-navy/70 text-sm">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Games Banner */}
      {liveNow.length > 0 && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">
              Live Now
            </span>
          </div>
          <div className="space-y-2">
            {liveNow.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between bg-white border border-light-gray rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 text-sm min-w-0">
                  <span className="text-navy font-semibold truncate">{game.homeTeam}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-navy font-bold text-lg tabular-nums">{game.homeScore}</span>
                    <span className="text-light-gray text-xs">vs</span>
                    <span className="text-navy font-bold text-lg tabular-nums">{game.awayScore}</span>
                  </div>
                  <span className="text-navy font-semibold truncate">{game.awayTeam}</span>
                </div>
                {game.quarter && (
                  <span className="bg-emerald-500/20 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                    Q{game.quarter}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach Registration Progress */}
      {role === "coach" && (
        <div className="mb-6 bg-white shadow-sm border border-light-gray rounded-2xl p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-red" />
              </div>
              <div>
                <h2 className="text-navy font-bold text-sm">Event Registration</h2>
                <p className="text-text-muted text-xs">
                  {completedSteps === totalSteps
                    ? "All set! You're fully registered."
                    : `${completedSteps} of ${totalSteps} steps complete`}
                </p>
              </div>
            </div>
            <span className="text-navy font-bold text-lg tabular-nums">{progressPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-light-gray rounded-full mb-5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100
                  ? "linear-gradient(90deg, #22C55E, #16A34A)"
                  : "linear-gradient(90deg, #CC0000, #E31B23)",
              }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {registrationSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <Link
                  key={i}
                  href={step.href}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                    step.done
                      ? "bg-emerald-50 hover:bg-emerald-100"
                      : "bg-off-white hover:bg-navy/[0.04]"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-light-gray flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${step.done ? "text-emerald-600" : "text-navy"}`}>
                      {step.label}
                    </p>
                    <p className="text-text-muted text-xs truncate">{step.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-light-gray group-hover:text-navy/40 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* My Registrations */}
      {myRegistrations.length === 0 && (
        <div className="mb-6 bg-white shadow-sm border border-light-gray rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-off-white flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-light-gray" />
          </div>
          <h3 className="text-navy font-semibold text-sm mb-1">No Tournaments Yet</h3>
          <p className="text-text-muted text-xs mb-4 max-w-xs mx-auto">
            Register for an upcoming tournament to see your events here.
          </p>
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-1.5 text-red text-xs font-semibold hover:text-red-hover transition-colors"
          >
            Browse Tournaments <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
      {myRegistrations.length > 0 && (
        <div className="mb-6 bg-white shadow-sm border border-light-gray rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-red" />
              </div>
              <h2 className="text-navy font-bold text-sm">My Tournaments</h2>
            </div>
            <Link href="/tournaments" className="text-red text-xs font-semibold hover:text-red-hover transition-colors flex items-center gap-1">
              Browse <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-light-gray">
            {myRegistrations.map((reg) => (
              <Link
                key={reg.id}
                href={`/tournaments/${reg.tournamentId}`}
                className="px-5 py-3 flex items-center justify-between hover:bg-off-white transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-navy text-sm font-semibold truncate">{reg.tournamentName}</p>
                  <p className="text-text-muted text-xs">{reg.teamName}{reg.division ? ` · ${reg.division}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    reg.paymentStatus === "paid" || reg.paymentStatus === "waived"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {reg.paymentStatus}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    reg.status === "approved"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : reg.status === "rejected"
                      ? "bg-red/20 text-red"
                      : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {reg.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {role === "coach" && (
          <ActionCard
            href="/portal/roster"
            icon={Users}
            title="My Roster"
            desc={rosterCount !== null ? `${rosterCount} player${rosterCount !== 1 ? "s" : ""}` : "Manage your team"}
            color="cyan"
          />
        )}
        <ActionCard
          href="/portal/schedule"
          icon={Calendar}
          title="Schedule"
          desc="Games & events"
          color="blue"
        />
        <ActionCard
          href="/portal/scores"
          icon={Trophy}
          title="Scores"
          desc="Results & standings"
          color="amber"
        />
        {(role === "coach" || role === "parent") && (
          <ActionCard
            href="/portal/waiver"
            icon={FileCheck}
            title="Waivers"
            desc="Submit player waivers"
            color="emerald"
          />
        )}
      </div>

      {/* Recent Games */}
      {liveGames.filter((g) => g.status === "final").length > 0 && (
        <div className="bg-white shadow-sm border border-light-gray rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <h2 className="text-navy font-bold text-sm">Recent Results</h2>
            <Link href="/portal/scores" className="text-red text-xs font-semibold hover:text-red-hover transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-light-gray">
            {liveGames
              .filter((g) => g.status === "final")
              .slice(0, 5)
              .map((game) => (
                <div key={game.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 text-sm">
                    <span className={`font-semibold truncate ${game.homeScore > game.awayScore ? "text-navy" : "text-text-muted"}`}>
                      {game.homeTeam}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 tabular-nums">
                      <span className={`font-bold ${game.homeScore > game.awayScore ? "text-navy" : "text-text-muted"}`}>
                        {game.homeScore}
                      </span>
                      <span className="text-light-gray">-</span>
                      <span className={`font-bold ${game.awayScore > game.homeScore ? "text-navy" : "text-text-muted"}`}>
                        {game.awayScore}
                      </span>
                    </div>
                    <span className={`font-semibold truncate ${game.awayScore > game.homeScore ? "text-navy" : "text-text-muted"}`}>
                      {game.awayTeam}
                    </span>
                  </div>
                  {game.division && (
                    <span className="text-text-muted text-[10px] font-semibold uppercase">{game.division}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

const COLOR_MAP = {
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200 hover:border-cyan-300", icon: "text-cyan-600", count: "text-cyan-600" },
  blue: { bg: "bg-blue-50", border: "border-blue-200 hover:border-blue-300", icon: "text-blue-600", count: "text-blue-600" },
  amber: { bg: "bg-amber-50", border: "border-amber-200 hover:border-amber-300", icon: "text-amber-600", count: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200 hover:border-emerald-300", icon: "text-emerald-600", count: "text-emerald-600" },
  red: { bg: "bg-red/[0.08]", border: "border-red/20 hover:border-red/30", icon: "text-red", count: "text-red" },
};

function ActionCard({
  href,
  icon: Icon,
  title,
  desc,
  color,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  desc: string;
  color: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <Link
      href={href}
      className={`${c.bg} border ${c.border} rounded-2xl p-4 transition-all group`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-navy font-semibold text-sm">{title}</h3>
          <p className="text-text-muted text-xs">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-light-gray group-hover:text-navy/30 transition-colors" />
      </div>
    </Link>
  );
}
