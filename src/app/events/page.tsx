import { Suspense } from "react";
import { SOCIAL_LINKS } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  ExternalLink,
  Film,
  Monitor,
  BarChart3,
  Snowflake,
  UtensilsCrossed,
  Trophy,
  Ticket,
  UserCheck,
  ShieldCheck,
  Footprints,
  MapPin,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import QuickScoresEmbed from "@/components/ui/QuickScoresEmbed";
import BackToTop from "@/components/ui/BackToTop";
import { isNotionConfigured } from "@/lib/notion";
import EventsList from "./EventsList";

export const metadata: Metadata = {
  title: "Basketball Tournaments | Inspire Courts AZ — Gilbert, AZ",
  description:
    "Youth basketball tournaments in Gilbert, AZ at Inspire Courts AZ. 10U–17U boys & girls divisions. 3+ game guarantee, game film every game, live scoreboards. Register your team now.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/events",
  },
};

const REGISTER_URL = SOCIAL_LINKS.leagueapps;

const INCLUDED_FEATURES = [
  { icon: Trophy, label: "3+ Game Guarantee" },
  { icon: Film, label: "Game Film Every Game" },
  { icon: Monitor, label: "Live Scoreboards" },
  { icon: BarChart3, label: "Electronic Stats" },
  { icon: Snowflake, label: "Air Conditioned" },
  { icon: UtensilsCrossed, label: "Snack Bar Open" },
];

const GAME_DAY_INFO = [
  { icon: Ticket, label: "Admission", detail: "$15 at door — kids under 5 free. Cash & card." },
  { icon: UserCheck, label: "Check-In", detail: "Head coach checks in with valid photo ID. Roster required before first game." },
  { icon: UtensilsCrossed, label: "Food & Drinks", detail: "Snack bar open all day. No outside food, coolers, or beverages. Players: 1 water + 1 sports drink OK." },
  { icon: Footprints, label: "Court Shoes", detail: "Non-marking soles only. No dress shoes, sandals, or cleats." },
  { icon: ShieldCheck, label: "House Rules", detail: "Good sportsmanship. No hanging on rims. No profanity. Clean up after your team." },
  { icon: MapPin, label: "Location", detail: "1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233" },
];

function EventsListSkeleton() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-4 w-24 bg-light-gray rounded-full mx-auto mb-3 animate-pulse" />
          <div className="h-8 w-64 bg-light-gray rounded-full mx-auto mb-3 animate-pulse" />
          <div className="h-4 w-80 bg-light-gray rounded-full mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-light-gray rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-light-gray rounded-full w-32 mb-4" />
              <div className="h-7 bg-light-gray rounded w-full mb-3" />
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-light-gray rounded w-40" />
                <div className="h-4 bg-light-gray rounded w-32" />
              </div>
              <div className="flex gap-2 mb-6">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-6 w-12 bg-light-gray rounded-full" />
                ))}
              </div>
              <div className="h-12 bg-light-gray rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function EventsPage() {
  const notionEnabled = isNotionConfigured();

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              🏀 Compete. Get Ranked. Get Seen.
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)] drop-shadow-lg">
              Youth Basketball<br />Tournaments
            </h1>
            <p className="text-red font-bold text-sm uppercase tracking-[0.2em] mb-6 font-[var(--font-chakra)]">
              Gilbert, AZ · Boys &amp; Girls · 10U – 17U
            </p>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              Competitive basketball tournaments for youth players in the East
              Valley. Age-bracket divisions from 10U through 17U, boys and
              girls. Every team gets 3+ games, game film, live scoreboards, and
              electronic stats. Volleyball tournaments also available.
            </p>
            <a
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg shadow-red/30"
            >
              Register Now <ArrowRight className="w-4 h-4" />
            </a>
          </AnimateIn>
        </div>
      </section>

      {/* Events list — Suspense-wrapped so hero renders immediately */}
      {notionEnabled ? (
        <Suspense fallback={<EventsListSkeleton />}>
          <EventsList />
        </Suspense>
      ) : (
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Upcoming"
              title="Upcoming Basketball Tournaments"
              description="Register your team for the next tournament. Spots fill fast — don't wait."
            />
            <AnimateIn>
              <div className="max-w-2xl mx-auto text-center bg-off-white border border-light-gray rounded-xl p-10">
                <Trophy className="w-10 h-10 text-red mx-auto mb-4" />
                <h3 className="text-navy font-bold text-lg uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
                  Basketball Tournaments Coming Soon
                </h3>
                <p className="text-text-muted text-sm mb-6 leading-relaxed">
                  New basketball tournaments are announced regularly. Follow us
                  on Instagram or register on LeagueApps to be the first to know
                  when registration opens.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={REGISTER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                  >
                    Register Now <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="https://instagram.com/inspirecourtsaz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 border-2 border-navy/20 hover:border-navy/40 text-navy px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                  >
                    @inspirecourtsaz
                  </a>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>
      )}

      {/* What's Included */}
      <section className="py-12 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {INCLUDED_FEATURES.map((feature, i) => (
              <AnimateIn key={i} delay={i * 50}>
                <div className="text-center">
                  <feature.icon className="w-7 h-7 text-red mx-auto mb-2" />
                  <p className="text-white text-xs font-bold uppercase tracking-wider">
                    {feature.label}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Schedules & Brackets */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Game Time"
            title="Tournament Schedules & Brackets"
            description="Find your basketball game times, court assignments, and bracket placements."
          />

          {/* Info bar */}
          <div className="bg-off-white border border-light-gray rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-red" />
              <p className="text-navy text-sm font-semibold">
                Schedules drop <span className="text-red">48 hours</span> before
                tip-off and are emailed to head coaches.
              </p>
            </div>
            <a
              href="https://quickscores.com/inspirecourts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-red hover:text-red-hover text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap"
            >
              Open in QuickScores <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-text-muted text-xs text-right">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          {/* QuickScores embed with loading state and fallback */}
          <AnimateIn>
            <div className="bg-white border border-light-gray rounded-2xl overflow-hidden shadow-sm">
              <QuickScoresEmbed
                src="https://quickscores.com/inspirecourts"
                title="Inspire Courts Tournament Schedules — QuickScores"
                className="min-h-[500px] md:min-h-[700px]"
              />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Game Day Info */}
      <section className="py-20 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Be Ready"
            title="Game Day Info"
            description="Everything you need to know before you walk through the doors."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {GAME_DAY_INFO.map((item, i) => (
              <AnimateIn key={i} delay={i * 50}>
                <div className="bg-white border border-light-gray rounded-xl p-5 flex gap-4 shadow-sm h-full">
                  <div className="w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-red" />
                  </div>
                  <div>
                    <h3 className="text-navy font-medium text-sm uppercase tracking-tight mb-1 font-[var(--font-chakra)]">
                      {item.label}
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/gameday"
              className="inline-flex items-center gap-2 text-red hover:text-red-hover text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Full Game Day Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h3 className="text-white font-semibold text-xl uppercase tracking-tight mb-4 font-[var(--font-chakra)]">
              Don&apos;t see your basketball division?
            </h3>
            <p className="text-white/70 mb-6">
              Let us know what age group or division you&apos;re looking for.
              We&apos;re always adding new basketball tournaments and age groups.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={REGISTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/40 hover:bg-white hover:text-navy text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Register Now <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-12 bg-off-white border-t border-light-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-text-muted text-xs font-bold uppercase tracking-[0.2em] mb-5 text-center font-[var(--font-chakra)]">
            Related Pages
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/schedule", label: "Schedule" },
              { href: "/gameday", label: "Game Day Info" },
              { href: "/training", label: "Training" },
              { href: "/facility", label: "Facility" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-center gap-1.5 bg-white border border-light-gray hover:border-red/40 hover:text-red text-navy text-xs font-bold uppercase tracking-wide py-3 px-4 rounded-xl transition-colors font-[var(--font-chakra)]"
              >
                {link.label} <ArrowRight className="w-3 h-3 opacity-60" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BackToTop />
      <div className="h-16 lg:hidden" />
    </>
  );
}
