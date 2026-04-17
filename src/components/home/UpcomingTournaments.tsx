import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Trophy, Calendar, MapPin, DollarSign } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { inArray, asc } from "drizzle-orm";
import type { UpcomingTournament } from "@/types/home";

const EmailSignup = dynamic(() => import("@/components/ui/EmailSignup"));

const FORMAT_LABELS: Record<string, string> = {
  single_elim: "Single Elimination",
  double_elim: "Double Elimination",
  round_robin: "Round Robin",
  pool_play: "Pool Play",
};

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2";

async function fetchUpcoming(): Promise<UpcomingTournament[]> {
  try {
    return await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        startDate: tournaments.startDate,
        location: tournaments.location,
        format: tournaments.format,
        divisions: tournaments.divisions,
        entryFee: tournaments.entryFee,
        registrationOpen: tournaments.registrationOpen,
        registrationDeadline: tournaments.registrationDeadline,
      })
      .from(tournaments)
      .where(inArray(tournaments.status, ["published", "active"]))
      .orderBy(asc(tournaments.startDate))
      .limit(3);
  } catch {
    return [];
  }
}

export default async function UpcomingTournaments() {
  const upcoming = await fetchUpcoming();

  return (
    <section className="py-14 lg:py-20 bg-white" aria-labelledby="upcoming-tournaments-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Compete"
          title="Upcoming Tournaments"
          description="Register your team for the next OFF SZN HOOPS event."
          titleId="upcoming-tournaments-heading"
        />
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcoming.map((t, i) => {
              const divisions = t.divisions ? (JSON.parse(t.divisions) as string[]) : [];
              const isPast = t.registrationDeadline && new Date(t.registrationDeadline + "T23:59:59") < new Date();
              const canRegister = t.registrationOpen && !isPast;
              return (
                <AnimateIn key={t.id} delay={i * 80}>
                  <div className="bg-white border border-light-gray rounded-2xl p-6 flex flex-col h-full hover:border-red/40 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-4 h-4 text-red flex-shrink-0" aria-hidden="true" />
                      <h3 className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)] truncate">
                        {t.name}
                      </h3>
                    </div>
                    <div className="space-y-2 mb-4 flex-1">
                      <p className="flex items-center gap-2 text-text-muted text-xs">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                        {new Date(t.startDate + "T00:00:00").toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        <span className="text-text-muted/60" title="Mountain Standard Time (Arizona)">MST</span>
                      </p>
                      {t.location && (
                        <p className="flex items-center gap-2 text-text-muted text-xs">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                          {t.location}
                        </p>
                      )}
                      {t.entryFee != null && t.entryFee > 0 && (
                        <p className="flex items-center gap-2 text-text-muted text-xs">
                          <DollarSign className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                          ${(t.entryFee / 100).toFixed(0)}/team &middot; {FORMAT_LABELS[t.format] || t.format}
                        </p>
                      )}
                    </div>
                    {divisions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {divisions.slice(0, 4).map((d: string) => (
                          <span
                            key={d}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red/10 text-red"
                          >
                            {d}
                          </span>
                        ))}
                        {divisions.length > 4 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy/5 text-text-muted">
                            +{divisions.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    <Link
                      href={`/tournaments/${t.id}`}
                      aria-label={`${canRegister ? "Register for" : "View details for"} ${t.name}`}
                      className={`inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-colors font-[var(--font-chakra)] ${FOCUS_RING}`}
                    >
                      {canRegister ? "Register" : "View Details"}{" "}
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        ) : (
          <AnimateIn>
            <div className="bg-white border border-light-gray rounded-2xl p-8 lg:p-12 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-red/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-7 h-7 text-red" aria-hidden="true" />
                </div>
                <h3 className="text-navy font-bold text-base uppercase tracking-tight font-[var(--font-chakra)] mb-2">
                  New Tournaments Coming
                </h3>
                <p className="text-text-muted text-sm">
                  Get early access to registration before spots fill up.
                </p>
              </div>
              <EmailSignup variant="light" />
            </div>
          </AnimateIn>
        )}
        {upcoming.length > 0 && (
          <div className="text-center mt-8">
            <Link
              href="/tournaments"
              className={`group inline-flex items-center gap-2 text-red font-bold text-sm uppercase tracking-wide hover:text-navy transition-colors font-[var(--font-chakra)] rounded ${FOCUS_RING}`}
            >
              View All Tournaments{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function UpcomingTournamentsSkeleton() {
  return (
    <section className="py-14 lg:py-20 bg-white" aria-hidden="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="h-3 w-24 bg-light-gray rounded mx-auto mb-3 animate-pulse" />
          <div className="h-10 w-72 bg-light-gray rounded mx-auto mb-3 animate-pulse" />
          <div className="h-4 w-96 max-w-full bg-light-gray rounded mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white border border-light-gray rounded-2xl p-6 h-56 animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
