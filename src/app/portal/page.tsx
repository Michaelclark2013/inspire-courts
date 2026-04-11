"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Trophy,
  Users,
  Calendar,
  Radio,
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

export default function PortalDashboard() {
  const { data: session } = useSession();
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);

  useEffect(() => {
    fetch("/api/scores/live")
      .then((r) => r.json())
      .then(setLiveGames)
      .catch(() => {});
  }, []);

  const role = session?.user?.role;
  const name = session?.user?.name || "there";
  const liveNow = liveGames.filter((g) => g.status === "live");

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
          Welcome back, {name}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {role === "coach" ? "Coach Portal" : "Parent Portal"} — Inspire Courts AZ
        </p>
      </div>

      {/* Quick cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {role === "coach" && (
          <QuickCard
            href="/portal/roster"
            icon={<Users className="w-5 h-5" />}
            title="My Roster"
            desc="View and manage your team roster"
          />
        )}
        <QuickCard
          href="/portal/schedule"
          icon={<Calendar className="w-5 h-5" />}
          title="Schedule"
          desc="Upcoming games and events"
        />
        <QuickCard
          href="/portal/scores"
          icon={<Trophy className="w-5 h-5" />}
          title="Game Results"
          desc="View scores and standings"
        />
      </div>

      {/* Live games ticker */}
      {liveNow.length > 0 && (
        <div className="bg-card border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">
              Live Now
            </h2>
          </div>
          <div className="space-y-3">
            {liveNow.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between bg-navy/50 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white font-semibold">{game.homeTeam}</span>
                  <span className="text-white font-bold tabular-nums">{game.homeScore}</span>
                  <span className="text-white/30">—</span>
                  <span className="text-white font-bold tabular-nums">{game.awayScore}</span>
                  <span className="text-white font-semibold">{game.awayTeam}</span>
                </div>
                {game.quarter && (
                  <span className="text-emerald-400 text-xs font-bold">Q{game.quarter}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all group"
    >
      <div className="text-red mb-3 group-hover:scale-110 transition-transform inline-block">
        {icon}
      </div>
      <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-1">
        {title}
      </h3>
      <p className="text-text-secondary text-xs">{desc}</p>
    </Link>
  );
}
