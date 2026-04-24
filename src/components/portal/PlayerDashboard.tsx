"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Trophy,
  Calendar,
  MapPin,
  ChevronRight,
  Clock,
  FileSignature,
  ShoppingBag,
} from "lucide-react";

/**
 * Player-facing hub. Gets tournament + next game + recent results + a
 * merch placeholder from /api/portal/player/dashboard. Designed for
 * phone-first use — parents open this on the sideline to see who's up
 * next and what court they're on.
 */

type DashData = {
  user: { name: string; email: string; emailVerified: boolean };
  players: Array<{
    id: number;
    name: string;
    jerseyNumber: string | null;
    division: string | null;
  }>;
  team: { id: number; name: string; division: string | null } | null;
  currentTournament: {
    id: number;
    name: string;
    startDate: string;
    location: string | null;
  } | null;
  nextGame: {
    id: number;
    opponent: string;
    scheduledTime: string;
    court: string | null;
    homeOrAway: "home" | "away";
  } | null;
  recentResults: Array<{
    id: number;
    opponent: string;
    myScore: number;
    oppScore: number;
    result: "W" | "L" | "T";
    date: string;
  }>;
  waiverSigned: boolean;
};

function fmtTime(iso: string): string {
  if (!iso) return "TBD";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      timeZone: "America/Phoenix",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PlayerDashboard() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/portal/player/dashboard", {
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        if (res.ok) setData(await res.json());
        else setError(true);
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") setError(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-secondary text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Loading your dashboard…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="bg-red/10 border border-red/20 rounded-xl p-4 text-sm text-navy">
        Couldn&apos;t load your dashboard. Refresh to try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="bg-navy text-white rounded-2xl p-5 sm:p-6">
        <p className="text-white/60 text-xs uppercase tracking-widest font-bold">
          Player Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">
          Hey, {data.user.name.split(" ")[0]}
        </h1>
        {data.team ? (
          <p className="text-white/70 text-sm mt-1">
            {data.team.name}
            {data.team.division ? ` · ${data.team.division}` : ""}
          </p>
        ) : (
          <p className="text-white/70 text-sm mt-1">
            No team linked yet — ask your coach to add you to a roster.
          </p>
        )}

        {data.currentTournament && (
          <div className="mt-5 bg-white/10 rounded-xl p-3">
            <p className="text-white/60 text-[11px] uppercase tracking-widest font-bold mb-0.5">
              Current Tournament
            </p>
            <Link
              href={`/tournaments/${data.currentTournament.id}`}
              className="inline-flex items-center gap-1 font-bold text-base hover:underline"
            >
              {data.currentTournament.name}
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <p className="text-white/70 text-xs mt-0.5">
              <Calendar className="w-3 h-3 inline mr-1" aria-hidden="true" />
              {data.currentTournament.startDate}
              {data.currentTournament.location
                ? ` · ${data.currentTournament.location}`
                : ""}
            </p>
          </div>
        )}
      </section>

      {/* Next game */}
      {data.nextGame ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
            Next Game
          </h2>
          <div className="bg-white border-2 border-red rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                {data.nextGame.homeOrAway === "home" ? "Home" : "Away"}
              </p>
              <span className="inline-flex items-center gap-1 text-red text-xs font-bold">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {fmtTime(data.nextGame.scheduledTime)}
              </span>
            </div>
            <p className="text-navy text-2xl font-bold mb-1">
              vs. {data.nextGame.opponent}
            </p>
            {data.nextGame.court && (
              <p className="text-text-secondary text-sm">
                <MapPin className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                {data.nextGame.court}
              </p>
            )}
          </div>
        </section>
      ) : data.team ? (
        <section className="bg-white border border-border rounded-xl p-5 text-center">
          <Trophy className="w-8 h-8 text-text-secondary mx-auto mb-2" aria-hidden="true" />
          <p className="text-navy font-semibold">No games scheduled yet</p>
          <p className="text-text-secondary text-xs mt-1">
            Check back when your coach registers for an upcoming tournament.
          </p>
        </section>
      ) : null}

      {/* Recent results */}
      {data.recentResults.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
            Recent Results
          </h2>
          <ul className="space-y-2">
            {data.recentResults.map((r) => {
              const tint =
                r.result === "W"
                  ? "border-emerald-200 bg-emerald-50"
                  : r.result === "L"
                  ? "border-red/20 bg-red/5"
                  : "border-border bg-white";
              return (
                <li
                  key={r.id}
                  className={`${tint} border rounded-xl p-3 flex items-center justify-between`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-navy truncate">vs. {r.opponent}</p>
                    <p className="text-[11px] text-text-secondary">{r.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-navy tabular-nums text-lg">
                      {r.myScore} <span className="text-text-secondary text-sm">–</span> {r.oppScore}
                    </p>
                    <p
                      className={`text-[11px] font-bold ${
                        r.result === "W"
                          ? "text-emerald-700"
                          : r.result === "L"
                          ? "text-red"
                          : "text-text-secondary"
                      }`}
                    >
                      {r.result === "W" ? "Win" : r.result === "L" ? "Loss" : "Tie"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
          Quick links
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ActionCard
            href="/waiver"
            icon={FileSignature}
            label={data.waiverSigned ? "Waiver ✓" : "Sign Waiver"}
            hint={data.waiverSigned ? "Done" : "Required"}
            highlight={!data.waiverSigned}
          />
          <ActionCard
            href="/scores"
            icon={Trophy}
            label="Live Scores"
            hint="All tournaments"
          />
          <ActionCard
            href="/schedule"
            icon={Calendar}
            label="Schedule"
            hint="Upcoming"
          />
          <ActionCard
            href="/portal/profile"
            icon={ChevronRight}
            label="Profile"
            hint="Edit"
          />
        </div>
      </section>

      {/* Merch — placeholder section */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
            Team Store
          </h2>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
            Soon
          </span>
        </div>
        <div className="bg-white border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-red/10 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-7 h-7 text-red" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-navy font-semibold text-sm">
              Inspire Courts merch is coming.
            </p>
            <p className="text-text-secondary text-xs mt-0.5">
              Team jerseys, warm-ups, shooter shirts, and facility gear — shop
              opens soon. Stay tuned.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  label,
  hint,
  highlight = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-white border rounded-xl p-3 flex flex-col items-center gap-1 text-center transition-colors ${
        highlight
          ? "border-red/40 hover:border-red"
          : "border-border hover:border-navy/30"
      }`}
    >
      <Icon
        className={`w-5 h-5 ${highlight ? "text-red" : "text-navy"}`}
        aria-hidden={true}
      />
      <span className="text-xs font-semibold text-navy">{label}</span>
      <span className="text-[10px] text-text-secondary">{hint}</span>
    </Link>
  );
}
