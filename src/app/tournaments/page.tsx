"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Calendar, MapPin, Users, Loader2, DollarSign } from "lucide-react";

type TournamentPublic = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  format: string;
  status: string;
  divisions: string[];
  entryFee: number | null;
  registrationOpen: boolean;
  registrationDeadline: string | null;
  maxTeamsPerDivision: number | null;
  teamCount: number;
  registrationCount: number;
  description: string | null;
};

const FORMAT_LABELS: Record<string, string> = {
  single_elim: "Single Elimination",
  double_elim: "Double Elimination",
  round_robin: "Round Robin",
  pool_play: "Pool Play",
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then(setTournaments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-red/10 to-transparent py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/images/inspire-athletics-logo.png"
              alt="Inspire Courts"
              width={60}
              height={60}
              className="mx-auto"
            />
          </Link>
          <h1 className="text-3xl lg:text-5xl font-bold text-white font-heading uppercase tracking-tight mb-3">
            Tournaments
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Register your team, compete, and track live scores — all in one place.
          </p>
        </div>
      </div>

      {/* Tournament list */}
      <div className="max-w-5xl mx-auto px-4 pb-16 -mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tournaments...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No tournaments posted yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {tournaments.map((t) => {
              const isPast =
                t.registrationDeadline &&
                new Date(t.registrationDeadline + "T23:59:59") < new Date();
              const canRegister = t.registrationOpen && !isPast;

              return (
                <div
                  key={t.id}
                  className="bg-card border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
                >
                  <div className="p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Trophy className="w-5 h-5 text-red" />
                          <h2 className="text-xl font-bold text-white font-heading">
                            {t.name}
                          </h2>
                          {t.status === "active" && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                              Live
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-text-secondary text-sm mb-3">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(t.startDate + "T00:00:00").toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {t.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {t.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {t.teamCount} team{t.teamCount !== 1 ? "s" : ""} registered
                          </span>
                          <span className="text-white/30">
                            {FORMAT_LABELS[t.format] || t.format}
                          </span>
                        </div>

                        {t.divisions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {t.divisions.map((d) => (
                              <span
                                key={d}
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red/10 text-red"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        )}

                        {t.description && (
                          <p className="text-white/50 text-sm line-clamp-2">
                            {t.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        {t.entryFee != null && t.entryFee > 0 && (
                          <div className="flex items-center gap-1.5 text-white font-bold text-lg">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            {(t.entryFee / 100).toFixed(0)}
                            <span className="text-white/30 text-sm font-normal">
                              /team
                            </span>
                          </div>
                        )}

                        {t.registrationDeadline && (
                          <p className="text-white/30 text-xs">
                            Deadline:{" "}
                            {new Date(t.registrationDeadline + "T00:00:00").toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Link
                            href={`/tournaments/${t.id}`}
                            className="text-white/50 hover:text-white text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                          >
                            View Bracket
                          </Link>
                          {canRegister ? (
                            <Link
                              href={`/tournaments/${t.id}/register`}
                              className="bg-red hover:bg-red-hover text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors"
                            >
                              Register
                            </Link>
                          ) : isPast ? (
                            <span className="text-white/30 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border border-white/5 rounded-lg">
                              Closed
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
