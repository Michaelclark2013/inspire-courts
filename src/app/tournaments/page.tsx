import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  Video,
  Shield,
  Zap,
} from "lucide-react";
import QuickContactBar from "@/components/ui/QuickContactBar";
import BackToTop from "@/components/ui/BackToTop";
import TournamentHero from "@/components/tournaments/TournamentHero";
import TournamentCard from "@/components/tournaments/TournamentCard";
import TournamentListSkeleton from "@/components/tournaments/TournamentListSkeleton";
import TournamentListError from "@/components/tournaments/TournamentListError";
import { FACILITY_ADDRESS } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentTeams,
  tournamentRegistrations,
} from "@/lib/db/schema";
import { inArray, sql } from "drizzle-orm";
import type { TournamentPublic } from "@/types/tournament-public";
import { TOURNAMENT_FEATURES } from "@/types/tournament-public";

// ── SEO Metadata (Area 11) ──
export const metadata: Metadata = {
  title: "Basketball Tournaments in Gilbert, AZ | Inspire Courts AZ",
  description:
    "Register for youth basketball tournaments at Inspire Courts AZ in Gilbert, Arizona. 10U\u201317U boys & girls divisions, 3+ game guarantee, professional game film available.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/tournaments",
  },
  openGraph: {
    title: "Basketball Tournaments | Inspire Courts AZ",
    description:
      "Youth basketball tournaments for 10U\u201317U boys & girls in Gilbert, AZ. Every team gets 3+ games, live scoring, and game film available.",
    url: "https://inspirecourtsaz.com/tournaments",
    images: [
      {
        url: "https://inspirecourtsaz.com/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Inspire Courts AZ basketball tournaments",
      },
    ],
    siteName: "Inspire Courts AZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Basketball Tournaments | Inspire Courts AZ",
    description:
      "Youth basketball tournaments 10U\u201317U in Gilbert, AZ. Register now at Inspire Courts AZ.",
    images: ["https://inspirecourtsaz.com/images/hero-bg.jpg"],
  },
};

export const revalidate = 60; // ISR: revalidate every 60 seconds

// ── Static config hoisted outside component (Area 7) ──
const FEATURE_ICONS = {
  Trophy,
  Video,
  Shield,
  Zap,
} as const;

const HOW_IT_WORKS_STEPS = [
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
] as const;

// ── Data fetching ──
async function getTournaments(): Promise<TournamentPublic[]> {
  const allTournaments = await db
    .select()
    .from(tournaments)
    .where(inArray(tournaments.status, ["published", "active", "completed"]))
    .orderBy(tournaments.startDate);

  if (allTournaments.length === 0) return [];

  const ids = allTournaments.map((t) => t.id);

  const [teamCounts, regCounts] = await Promise.all([
    db
      .select({
        tournamentId: tournamentTeams.tournamentId,
        count: sql<number>`count(*)`,
      })
      .from(tournamentTeams)
      .where(inArray(tournamentTeams.tournamentId, ids))
      .groupBy(tournamentTeams.tournamentId),
    db
      .select({
        tournamentId: tournamentRegistrations.tournamentId,
        count: sql<number>`count(*)`,
      })
      .from(tournamentRegistrations)
      .where(inArray(tournamentRegistrations.tournamentId, ids))
      .groupBy(tournamentRegistrations.tournamentId),
  ]);

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
}

// ── JSON-LD structured data builder (Area 16) ──
function buildEventSchema(activeTournaments: TournamentPublic[]) {
  if (activeTournaments.length === 0) return null;
  return {
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
        ...(t.entryFee != null && t.entryFee > 0
          ? {
              offers: {
                "@type": "Offer",
                price: (t.entryFee / 100).toFixed(2),
                priceCurrency: "USD",
                availability: t.registrationOpen
                  ? "https://schema.org/InStock"
                  : "https://schema.org/SoldOut",
                url: "https://inspirecourts.leagueapps.com/tournaments",
              },
            }
          : {}),
        url: `https://inspirecourtsaz.com/tournaments/${t.id}`,
      },
    })),
  };
}

// ── Async tournament list with error boundary fallback (Areas 4, 5) ──
async function TournamentList() {
  let allTournaments: TournamentPublic[];
  try {
    allTournaments = await getTournaments();
  } catch (err) {
    console.error("[tournaments] Failed to fetch:", err);
    return <TournamentListError />;
  }

  const activeTournaments = allTournaments.filter(
    (t) => t.status === "active" || t.status === "published"
  );
  const completedTournaments = allTournaments.filter(
    (t) => t.status === "completed"
  );

  const eventSchema = buildEventSchema(activeTournaments);

  if (activeTournaments.length === 0 && completedTournaments.length === 0) {
    return (
      <>
        {/* Empty state (Area 15) */}
        <section
          id="tournaments"
          className="max-w-5xl mx-auto px-4 py-12 lg:py-16 scroll-mt-20"
          aria-label="Tournament listings"
        >
          <div className="text-center py-12">
            <div className="max-w-lg mx-auto bg-white border border-light-gray shadow-sm rounded-2xl p-8 lg:p-10">
              <div className="w-16 h-16 bg-red/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Trophy className="w-8 h-8 text-red" aria-hidden="true" />
              </div>
              <h2 className="text-navy font-bold text-xl font-heading uppercase tracking-tight mb-3">
                Tournaments Coming Soon
              </h2>
              <p className="text-text-muted text-sm leading-relaxed mb-6">
                New OFF SZN HOOPS tournaments are announced regularly. Follow us
                on Instagram or contact us to be the first to know when
                registration opens.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contact?type=Tournament+Registration"
                  className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
                >
                  Contact Us <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://instagram.com/inspirecourts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-light-gray hover:border-red/30 text-navy/60 hover:text-navy px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
                >
                  @inspirecourts
                </a>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {eventSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
        />
      )}
      <section
        id="tournaments"
        className="max-w-5xl mx-auto px-4 py-12 lg:py-16 scroll-mt-20"
        aria-label="Tournament listings"
      >
        <div className="space-y-12">
          {/* Active / Upcoming */}
          {activeTournaments.length > 0 && (
            <div>
              <h2 className="text-navy font-bold text-lg font-heading uppercase tracking-wider mb-5 flex items-center gap-2">
                <Calendar
                  className="w-5 h-5 text-red"
                  aria-hidden="true"
                />
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
                  <TournamentCard key={t.id} tournament={t} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ── Page component (Area 17: server component, no "use client") ──
export default async function TournamentsPage() {
  // Pre-check for hero: quick count to decide CTA text (avoids double fetch)
  let hasActive = false;
  try {
    const quick = await db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(inArray(tournaments.status, ["published", "active"]))
      .limit(1);
    hasActive = quick.length > 0;
  } catch {
    // Hero will show LeagueApps fallback link
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero renders instantly — no DB dependency (Area 4) */}
      <TournamentHero hasActiveTournaments={hasActive} />

      {/* Features bar (Area 7: static hoisted config) */}
      <section
        className="border-b border-light-gray bg-off-white"
        aria-label="Tournament features"
      >
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOURNAMENT_FEATURES.map((f) => {
              const Icon = FEATURE_ICONS[f.iconName];
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

      {/* Tournament list wrapped in Suspense (Area 4) */}
      <Suspense fallback={<TournamentListSkeleton />}>
        <TournamentList />
      </Suspense>

      {/* How It Works — static content */}
      <section
        className="border-t border-light-gray bg-off-white"
        aria-label="How tournament registration works"
      >
        <div className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
          <h2 className="text-navy font-bold text-lg font-heading uppercase tracking-wider mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS_STEPS.map((s) => (
              <div key={s.step} className="text-center">
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

      {/* Bottom CTA */}
      <section className="border-t border-light-gray" aria-label="Contact for tournament questions">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-navy font-bold text-2xl font-heading uppercase tracking-tight mb-3">
            Questions?
          </h2>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Need help registering or have questions about an upcoming tournament?
            We&apos;re here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact?type=Tournament+Registration"
              className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 border border-light-gray hover:border-red/30 text-navy/60 hover:text-navy px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
            >
              FAQ
            </Link>
          </div>
        </div>
      </section>

      <QuickContactBar subject="Tournament Registration" label="Questions?" />
      <BackToTop />
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </div>
  );
}
