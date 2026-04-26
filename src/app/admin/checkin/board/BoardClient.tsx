"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type BoardTeam = {
  teamName: string;
  division: string;
  checkedInCount: number;
  hasCheckedIn: boolean;
  isPaid: boolean;
};

type Props = {
  teams: BoardTeam[];
  checkedInTeamCount: number;
  totalTeams: number;
};

export default function BoardClient({ teams, checkedInTeamCount, totalTeams }: Props) {
  const router = useRouter();

  // 10s auto-refresh. Parents standing in the lobby want to see their
  // team's tile flip green within seconds of the coach checking in.
  // Pauses when tab is hidden so a board left open overnight doesn't
  // keep hammering the server.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, 10_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  const pct = totalTeams > 0 ? Math.round((checkedInTeamCount / totalTeams) * 100) : 0;

  return (
    <div className="min-h-screen bg-navy text-white p-6 sm:p-10">
      {/* Header */}
      <header className="flex items-end justify-between gap-6 flex-wrap mb-8">
        <div>
          <p className="text-white/50 text-xs sm:text-sm uppercase tracking-[0.3em] mb-2">
            Inspire Courts AZ
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold font-heading uppercase tracking-tight">
            Game Day Check-In
          </h1>
        </div>
        <div className="text-right">
          <p className="text-5xl sm:text-7xl font-bold font-heading text-emerald-400 tabular-nums">
            {checkedInTeamCount}
            <span className="text-white/50 text-3xl sm:text-5xl">/{totalTeams}</span>
          </p>
          <p className="text-white/60 text-sm uppercase tracking-widest mt-1">
            teams here · {pct}%
          </p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-10">
        <div
          className="h-full bg-emerald-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Team grid */}
      {teams.length === 0 ? (
        <div className="text-center py-20 text-white/50 text-lg">
          No teams scheduled yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {teams.map((t) => (
            <div
              key={t.teamName}
              className={`rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 transition-colors ${
                t.hasCheckedIn
                  ? "bg-emerald-500/15 border-emerald-400 text-white"
                  : "bg-white/5 border-white/15 text-white/80"
              }`}
            >
              <div className="flex items-center gap-3">
                {t.hasCheckedIn ? (
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white/30 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base sm:text-lg leading-tight truncate">
                    {t.teamName}
                  </p>
                  <p className="text-xs sm:text-sm text-white/50 uppercase tracking-wider truncate">
                    {t.division}
                    {!t.isPaid && <span className="ml-2 text-amber-300">· UNPAID</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer cue: how often this updates */}
      <p className="text-white/30 text-[11px] uppercase tracking-[0.3em] text-center mt-10">
        Auto-updates every 10 seconds · {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </p>
    </div>
  );
}
