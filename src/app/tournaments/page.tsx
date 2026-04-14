import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
  Zap,
  Video,
  Shield,
  Clock,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import QuickContactBar from "@/components/ui/QuickContactBar";
import BackToTop from "@/components/ui/BackToTop";
import { FACILITY_ADDRESS } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentTeams,
  tournamentRegistrations,
} from "@/lib/db/schema";
import { inArray, eq, sql } from "drizzle-orm";

export const revalidate = 60; // ISR: revalidate every 60 seconds

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

const FEATURES = [
  {
    icon: Trophy,
    title: "3+ Game Guarantee",
    desc: "Every team plays at least 3 games. Most play 4-5.",
  },
  {
    icon: Video,
    title: "Game Film",
    desc: "Professional game film available as a paid add-on at every tournament.",
  },
  {
    icon: Shield,
    title: "10U – 17U Divisions",
    desc: "Boys and girls divisions. Compete against teams at your level.",
  },
  {
    icon: Zap,
    title: "Electronic Scoreboards",
    desc: "Live scores updated in real-time. Follow along from anywhere.",
  },
];

async function getTournaments(): Promise<TournamentPublic[]> {
  try {
    const allTournaments = await db
      .select()
      .from(tournaments)
      .where(inArray(tournaments.status, ["published", "active", "completed"]))
      .orderBy(tournaments.startDate);

    if (allTournaments.length === 0) return [];

    const ids = allTournaments.map((t) => t.id);

    // Batch: get all team counts in one query
    const teamCounts = await db
      .select({
        tournamentId: tournamentTeams.tournamentId,
        count: sql<number>`count(*)`,
      })
      .from(tournamentTeams)
      .where(inArray(tournamentTeams.tournamentId, ids))
      .groupBy(tournamentTeams.tournamentId);

    // Batch: get all registration counts in one query
    const regCounts = await db
      .select({
        tournamentId: tournamentRegistrations.tournamentId,
        count: sql<number>`count(*)`,
      })
      .from(tournamentRegistrations)
      .where(inArray(tournamentRegistrations.tournamentId, ids))
      .groupBy(tournamentRegistrations.tournamentId);

    const teamMap = new Map(teamCounts.map((r) => [r.tournamentId, r.count]));
    const regMap = new Map(regCounts.map((r) => [r.tournamentId, r.count]));

    return allTournaments.map((t) => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate,
      endDate: t.endDate,
      location: t.location,
      format: t.format,
      status: t.status,
      divisions: t.divisions ? JSON.parse(t.divisions) : [],
      entryFee: t.entryFee,
      registrationOpen: t.registrationOpen ?? false,
      registrationDeadline: t.registrationDeadline,
      maxTeamsPerDivision: t.maxTeamsPerDivision,
      description: t.description,
      teamCount: teamMap.get(t.id) ?? 0,
      registrationCount: regMap.get(t.id) ?? 0,
    }));
  } catch (err) {
    console.error("[tournaments] Failed to fetch:", err);
    return [];
  }
}

export default async function TournamentsPage() {
  const allTournaments = await getTournaments();

  const activeTournaments = allTournaments.filter(
    (t) => t.status === "active" || t.status === "published"
  );
  const completedTournaments = allTournaments.filter(
    (t) => t.status === "completed"
  );

  // JSON-LD Event schema for SEO
  const eventSchema = activeTournaments.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: activeTournaments.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SportsEvent",
        name: t.name,
        startDate: t.startDate,
        ...(t.endDate ? { endDate: t.endDate } : {}),
        location: {
          "@type": "Place",
          name: t.location || "Inspire Courts AZ",
          address: {
            "@type": "PostalAddress",
            streetAddress: `${FACILITY_ADDRESS.street}, ${FACILITY_ADDRESS.suite}`,
            addressLocality: FACILITY_ADDRESS.city,
            addressRegion: FACILITY_ADDRESS.state,
            postalCode: FACILITY_ADDRESS.zip,
            addressCountry: "US",
          },
        },
        organizer: {
          "@type": "Organization",
          name: "OFF SZN HOOPS",
          url: "https://inspirecourtsaz.com",
        },
        ...(t.entryFee != null && t.entryFee > 0 ? {
          offers: {
            "@type": "Offer",
            price: (t.entryFee / 100).toFixed(2),
            priceCurrency: "USD",
            availability: t.registrationOpen
              ? "https://schema.org/InStock"
              : "https://schema.org/SoldOut",
            url: "https://inspirecourts.leagueapps.com/tournaments",
          },
        } : {}),
        url: `https://inspirecourtsaz.com/tournaments/${t.id}`,
      },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-white">
      {eventSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
        />
      )}
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/courts-bg.jpg"
          alt="Inspire Courts AZ youth basketball tournament registration"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-bg-primary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.15),transparent_60%)]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 lg:py-28 text-center">
          <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-5 font-heading">
            OFF SZN HOOPS
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-heading uppercase tracking-tight mb-4 drop-shadow-lg">
            Tournament
            <br className="hidden sm:block" />
            <span className="text-red"> Registration</span>
          </h1>

          <p className="text-white/70 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Register your team, compete at Arizona&apos;s premier facility, and
            track live scores &mdash; all in one place. 52,000 sq ft, 7
            hardwood courts, game film every game.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {activeTournaments.length > 0 ? (
              <a
                href="#tournaments"
                className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg shadow-red/30 font-heading"
              >
                View Tournaments <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <a
                href="https://inspirecourts.leagueapps.com/tournaments"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg shadow-red/30 font-heading"
              >
                Register on LeagueApps <ArrowRight className="w-4 h-4" />
              </a>
            )}
            <Link
              href="/scores"
              className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/30 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors font-heading"
            >
              Live Scores
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES BAR ── */}
      <section className="border-b border-light-gray bg-off-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-red" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-navy font-bold text-sm mb-0.5">
                      {f.title}
                    </h3>
                    <p className="text-text-muted text-xs leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TOURNAMENT LIST ── */}
      <section id="tournaments" className="max-w-5xl mx-auto px-4 py-12 lg:py-16 scroll-mt-20">
        {activeTournaments.length === 0 && completedTournaments.length === 0 ? (
          /* ── Empty state ── */
          <div className="text-center py-12">
            <div className="max-w-lg mx-auto bg-white border border-light-gray shadow-sm rounded-2xl p-8 lg:p-10">
              <div className="w-16 h-16 bg-red/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Trophy className="w-8 h-8 text-red" />
              </div>
              <h2 className="text-navy font-bold text-xl font-heading uppercase tracking-tight mb-3">
                Tournaments Coming Soon
              </h2>
              <p className="text-text-muted text-sm leading-relaxed mb-6">
                New OFF SZN HOOPS tournaments are announced regularly.
                Follow us on Instagram or contact us to be the first to know
                when registration opens.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contact?type=Tournament+Registration"
                  className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                >
                  Contact Us <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://instagram.com/inspirecourts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-light-gray hover:border-red/30 text-navy/60 hover:text-navy px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                >
                  @inspirecourts
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active / Upcoming */}
            {activeTournaments.length > 0 && (
              <div>
                <h2 className="text-navy font-bold text-lg font-heading uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red" aria-hidden="true" />
                  {activeTournaments.some((t) => t.status === "active")
                    ? "Active & Upcoming"
                    : "Upcoming Tournaments"}
                </h2>
                <div className="grid gap-5">
                  {activeTournaments.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedTournaments.length > 0 && (
              <div>
                <h2 className="text-text-muted font-bold text-sm font-heading uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  Past Tournaments
                </h2>
                <div className="grid gap-4">
                  {completedTournaments.map((t) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-light-gray bg-off-white">
        <div className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
          <h2 className="text-navy font-bold text-lg font-heading uppercase tracking-wider mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Register",
                desc: "Pick your tournament, select your division, fill out the form, and pay the entry fee online.",
              },
              {
                step: "2",
                title: "Show Up & Compete",
                desc: "Check in on game day. Schedules sent 48 hours before. Minimum 3 games guaranteed.",
              },
              {
                step: "3",
                title: "Track Results",
                desc: "Live scores, brackets, and standings updated in real-time during the tournament.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="text-center"
              >
                <div className="w-10 h-10 bg-red text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm font-heading">
                  {s.step}
                </div>
                <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1.5">
                  {s.title}
                </h3>
                <p className="text-text-muted text-xs leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="border-t border-light-gray">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-navy font-bold text-2xl font-heading uppercase tracking-tight mb-3">
            Questions?
          </h2>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Need help registering or have questions about an upcoming
            tournament? We&apos;re here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact?type=Tournament+Registration"
              className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 border border-light-gray hover:border-red/30 text-navy/60 hover:text-navy px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </section>

      <QuickContactBar subject="Tournament Registration" label="Questions?" />
      <BackToTop />
      <div className="h-20 lg:hidden" />
    </div>
  );
}

function TournamentCard({
  tournament: t,
  compact,
}: {
  tournament: TournamentPublic;
  compact?: boolean;
}) {
  const isPast =
    t.registrationDeadline &&
    new Date(t.registrationDeadline + "T23:59:59") < new Date();
  const canRegister = t.registrationOpen && !isPast;

  if (compact) {
    return (
      <Link
        href={`/tournaments/${t.id}`}
        className="flex items-center justify-between gap-4 bg-white border border-light-gray rounded-xl px-5 py-4 hover:border-red/30 hover:shadow-sm transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Trophy className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden="true" />
          <span className="text-navy/60 text-sm font-semibold truncate group-hover:text-navy transition-colors">
            {t.name}
          </span>
          <span className="text-text-muted text-xs flex-shrink-0">
            {new Date(t.startDate + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <span className="text-text-muted text-xs font-semibold uppercase tracking-wider flex-shrink-0">
          View Results <ArrowRight className="w-3 h-3 inline" />
        </span>
      </Link>
    );
  }

  return (
    <div className="bg-white border border-light-gray shadow-sm rounded-2xl overflow-hidden hover:border-red/30 hover:shadow-md transition-colors">
      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-red flex-shrink-0" aria-hidden="true" />
              <h3 className="text-xl font-bold text-navy font-heading truncate">
                {t.name}
              </h3>
              {t.status === "active" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                  Live
                </span>
              )}
              {canRegister && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red/20 text-red">
                  Registration Open
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-text-muted text-sm mb-3">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {new Date(t.startDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </span>
              {t.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {t.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                {t.teamCount} team{t.teamCount !== 1 ? "s" : ""}
              </span>
              <span className="text-text-muted">
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
              <p className="text-text-muted text-sm line-clamp-2">
                {t.description}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 flex-shrink-0">
            {t.entryFee != null && t.entryFee > 0 && (
              <div className="flex items-center gap-1.5 text-navy font-bold text-lg">
                <DollarSign className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                {(t.entryFee / 100).toFixed(0)}
                <span className="text-text-muted text-sm font-normal">
                  /team
                </span>
              </div>
            )}

            {t.registrationDeadline && (
              <p className="text-text-muted text-xs">
                Deadline:{" "}
                {new Date(
                  t.registrationDeadline + "T00:00:00"
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}

            <div className="flex gap-2">
              <Link
                href={`/tournaments/${t.id}`}
                className="text-navy/60 hover:text-navy text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border border-light-gray rounded-lg hover:border-red/30 transition-colors"
              >
                {t.status === "active" ? "Live Bracket" : "Details"}
              </Link>
              {canRegister && (
                <a
                  href="https://inspirecourts.leagueapps.com/tournaments"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red hover:bg-red-hover text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors"
                >
                  Register
                </a>
              )}
              {isPast && (
                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border border-light-gray rounded-lg">
                  Closed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
