"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";

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
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [rosterCount, setRosterCount] = useState<number | null>(null);
  const [waiverSubmitted, setWaiverSubmitted] = useState(false);
  const [portalAnnouncements, setPortalAnnouncements] = useState<
    { id: number; title: string; body: string; audience: string; createdAt: string }[]
  >([]);
  const [myRegistrations, setMyRegistrations] = useState<
    { id: number; tournamentId: number; tournamentName: string; tournamentDate: string; teamName: string; division: string | null; paymentStatus: string; status: string }[]
  >([]);

  const role = session?.user?.role;
  const name = session?.user?.name?.split(" ")[0] || "there";
  const liveNow = liveGames.filter((g) => g.status === "live");

  useEffect(() => {
    fetch("/api/scores/live")
      .then((r) => r.json())
      .then(setLiveGames)
      .catch(() => {});

    // Fetch announcements
    fetch("/api/portal/announcements")
      .then((r) => r.json())
      .then(setPortalAnnouncements)
      .catch(() => {});

    // Fetch registrations
    fetch("/api/portal/registrations")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMyRegistrations(data); })
      .catch(() => {});

    // Check roster count for coaches
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

  return (
    <div className="p-5 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-text-secondary text-xs uppercase tracking-widest mb-1">
          {role === "coach" ? "Coach Portal" : role === "parent" ? "Parent Portal" : "Portal"}
        </p>
        <h1 className="text-white text-xl lg:text-2xl font-bold font-heading">
          {greeting}, {name}
        </h1>
      </div>

      {/* Announcements */}
      {portalAnnouncements.length > 0 && (
        <div className="mb-6 space-y-2">
          {portalAnnouncements.slice(0, 3).map((a) => (
            <div
              key={a.id}
              className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <Megaphone className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                    {a.title}
                  </p>
                  <p className="text-white/70 text-sm">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Games Banner */}
      {liveNow.length > 0 && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Live Now
            </span>
          </div>
          <div className="space-y-2">
            {liveNow.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between bg-navy/40 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 text-sm min-w-0">
                  <span className="text-white font-semibold truncate">{game.homeTeam}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-white font-bold text-lg tabular-nums">{game.homeScore}</span>
                    <span className="text-white/20 text-xs">vs</span>
                    <span className="text-white font-bold text-lg tabular-nums">{game.awayScore}</span>
                  </div>
                  <span className="text-white font-semibold truncate">{game.awayTeam}</span>
                </div>
                {game.quarter && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
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
        <div className="mb-6 bg-gradient-to-br from-bg-secondary to-bg-secondary/60 border border-white/[0.06] rounded-2xl p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-red" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm">Event Registration</h2>
                <p className="text-text-secondary text-xs">
                  {completedSteps === totalSteps
                    ? "All set! You're fully registered."
                    : `${completedSteps} of ${totalSteps} steps complete`}
                </p>
              </div>
            </div>
            <span className="text-white font-bold text-lg tabular-nums">{progressPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/[0.06] rounded-full mb-5 overflow-hidden">
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
                      ? "bg-emerald-500/[0.06] hover:bg-emerald-500/10"
                      : "bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/20 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${step.done ? "text-emerald-400" : "text-white"}`}>
                      {step.label}
                    </p>
                    <p className="text-text-secondary text-xs truncate">{step.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* My Registrations */}
      {myRegistrations.length === 0 && (
        <div className="mb-6 bg-gradient-to-br from-bg-secondary to-bg-secondary/60 border border-white/[0.06] rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-white/20" />
          </div>
          <h3 className="text-white font-semibold text-sm mb-1">No Tournaments Yet</h3>
          <p className="text-text-secondary text-xs mb-4 max-w-xs mx-auto">
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
        <div className="mb-6 bg-gradient-to-br from-bg-secondary to-bg-secondary/60 border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-red" />
              </div>
              <h2 className="text-white font-bold text-sm">My Tournaments</h2>
            </div>
            <Link href="/tournaments" className="text-red text-xs font-semibold hover:text-red-hover transition-colors flex items-center gap-1">
              Browse <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {myRegistrations.map((reg) => (
              <Link
                key={reg.id}
                href={`/tournaments/${reg.tournamentId}`}
                className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{reg.tournamentName}</p>
                  <p className="text-text-secondary text-xs">{reg.teamName}{reg.division ? ` · ${reg.division}` : ""}</p>
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
        <div className="bg-bg-secondary/60 border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <h2 className="text-white font-bold text-sm">Recent Results</h2>
            <Link href="/portal/scores" className="text-red text-xs font-semibold hover:text-red-hover transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {liveGames
              .filter((g) => g.status === "final")
              .slice(0, 5)
              .map((game) => (
                <div key={game.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 text-sm">
                    <span className={`font-semibold truncate ${game.homeScore > game.awayScore ? "text-white" : "text-white/50"}`}>
                      {game.homeTeam}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 tabular-nums">
                      <span className={`font-bold ${game.homeScore > game.awayScore ? "text-white" : "text-white/50"}`}>
                        {game.homeScore}
                      </span>
                      <span className="text-white/15">-</span>
                      <span className={`font-bold ${game.awayScore > game.homeScore ? "text-white" : "text-white/50"}`}>
                        {game.awayScore}
                      </span>
                    </div>
                    <span className={`font-semibold truncate ${game.awayScore > game.homeScore ? "text-white" : "text-white/50"}`}>
                      {game.awayTeam}
                    </span>
                  </div>
                  {game.division && (
                    <span className="text-text-secondary text-[10px] font-semibold uppercase">{game.division}</span>
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
  cyan: { bg: "bg-cyan-500/[0.08]", border: "border-cyan-500/20 hover:border-cyan-500/30", icon: "text-cyan-400", count: "text-cyan-400" },
  blue: { bg: "bg-blue-500/[0.08]", border: "border-blue-500/20 hover:border-blue-500/30", icon: "text-blue-400", count: "text-blue-400" },
  amber: { bg: "bg-amber-500/[0.08]", border: "border-amber-500/20 hover:border-amber-500/30", icon: "text-amber-400", count: "text-amber-400" },
  emerald: { bg: "bg-emerald-500/[0.08]", border: "border-emerald-500/20 hover:border-emerald-500/30", icon: "text-emerald-400", count: "text-emerald-400" },
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
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-text-secondary text-xs">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
      </div>
    </Link>
  );
}
