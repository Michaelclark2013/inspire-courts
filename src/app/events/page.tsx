import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Users,
  DollarSign,
  MapPin,
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
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  getUpcomingEvents,
  getPastEvents,
  getProperty,
  isNotionConfigured,
} from "@/lib/notion";

export const metadata: Metadata = {
  title: "Youth Basketball Tournaments in Gilbert, AZ | OFF SZN HOOPS",
  description:
    "Register for upcoming youth basketball tournaments at Inspire Courts AZ. 10U-17U divisions, boys and girls. Game film, live scoreboards, 3+ game guarantee.",
};

const REGISTER_URL = "https://inspirecourts.leagueapps.com/tournaments";

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

export default async function EventsPage() {
  // Fetch live data from Notion
  let upcomingEvents: any[] = [];
  let pastEvents: any[] = [];

  if (isNotionConfigured()) {
    [upcomingEvents, pastEvents] = await Promise.all([
      getUpcomingEvents(),
      getPastEvents(),
    ]);
  }

  // Map Notion data to display format
  const upcoming = upcomingEvents.map((e: any) => {
    const divisions = getProperty(e, "Divisions") || getProperty(e, "Age Groups") || "";
    const fee = getProperty(e, "Registration Fee") || getProperty(e, "Fee") || getProperty(e, "Entry Fee") || "";
    const date = getProperty(e, "Date") || getProperty(e, "Event Date") || "";
    const teams = getProperty(e, "Teams Registered") || getProperty(e, "Teams") || 0;
    const maxTeams = getProperty(e, "Max Teams") || getProperty(e, "Capacity") || "";
    const status = getProperty(e, "Status") || "";

    return {
      name: getProperty(e, "Name") || getProperty(e, "Event Name") || "Upcoming Event",
      date: date ? new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric", day: "numeric" }) : "TBD",
      divisions: Array.isArray(divisions) ? divisions : (divisions ? divisions.split(",").map((d: string) => d.trim()) : []),
      fee: fee ? (typeof fee === "number" ? `$${fee}` : fee) : "",
      teams: Number(teams) || 0,
      maxTeams: maxTeams ? Number(maxTeams) : null,
      status,
    };
  });

  const past = pastEvents.slice(0, 6).map((e: any) => {
    const date = getProperty(e, "Date") || getProperty(e, "Event Date") || "";
    const teams = getProperty(e, "Teams Registered") || getProperty(e, "Teams") || 0;
    return {
      name: getProperty(e, "Name") || getProperty(e, "Event Name") || "Past Event",
      date: date ? new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
      teams: Number(teams) || 0,
    };
  });

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              Compete. Get Ranked. Get Seen.
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              Tournaments
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              Youth basketball tournaments in Gilbert, AZ. 10U through 17U
              divisions, boys and girls. 3+ game guarantee, game film every game,
              live scoreboards on every court.
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

      {/* Upcoming Events */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Upcoming"
            title="Upcoming Events"
            description="Register your team for the next tournament. Spots fill fast."
          />

          {upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((event, i) => (
                <AnimateIn key={i} delay={i * 100}>
                  <div className="bg-white border border-light-gray rounded-xl p-6 flex flex-col h-full hover:shadow-lg transition-shadow shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        OFF SZN HOOPS
                      </span>
                      {event.status && (
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${event.status === "Registration Open" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}`}>
                          {event.status}
                        </span>
                      )}
                    </div>

                    <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
                      {event.name}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-text-muted text-sm">
                        <Calendar className="w-4 h-4 text-red flex-shrink-0" />
                        {event.date}
                      </div>
                      {event.fee && (
                        <div className="flex items-center gap-2 text-text-muted text-sm">
                          <DollarSign className="w-4 h-4 text-red flex-shrink-0" />
                          {event.fee} per team
                        </div>
                      )}
                      {event.maxTeams && (
                        <div className="flex items-center gap-2 text-text-muted text-sm">
                          <Users className="w-4 h-4 text-red flex-shrink-0" />
                          {event.teams} / {event.maxTeams} teams registered
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-text-muted text-sm">
                        <MapPin className="w-4 h-4 text-red flex-shrink-0" />
                        Inspire Courts AZ, Gilbert
                      </div>
                    </div>

                    {event.divisions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {event.divisions.map((div: string) => (
                          <span
                            key={div}
                            className="bg-off-white text-navy text-xs font-semibold px-2.5 py-1 rounded-full"
                          >
                            {div}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto">
                      <a
                        href={REGISTER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover text-white py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                      >
                        Register <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          ) : (
            /* Fallback when no events / no Notion key */
            <AnimateIn>
              <div className="max-w-2xl mx-auto text-center bg-off-white border border-light-gray rounded-xl p-10">
                <Trophy className="w-10 h-10 text-red mx-auto mb-4" />
                <h3 className="text-navy font-bold text-lg uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
                  Events Coming Soon
                </h3>
                <p className="text-text-muted text-sm mb-6 leading-relaxed">
                  New tournaments are announced regularly. Follow us on Instagram
                  or register on LeagueApps to be the first to know.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={REGISTER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                  >
                    Register on LeagueApps <ArrowRight className="w-4 h-4" />
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
          )}
        </div>
      </section>

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
            title="Schedules & Brackets"
            description="Find your game times, court assignments, and bracket placements."
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

          {/* QuickScores embed */}
          <AnimateIn>
            <div className="bg-white border border-light-gray rounded-2xl overflow-hidden shadow-sm">
              <iframe
                src="https://quickscores.com/inspirecourts"
                title="Inspire Courts Tournament Schedules — QuickScores"
                className="w-full border-0"
                style={{ minHeight: "700px" }}
                loading="lazy"
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
                    <h4 className="text-navy font-bold text-sm uppercase tracking-tight mb-1 font-[var(--font-chakra)]">
                      {item.label}
                    </h4>
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

      {/* Past Events */}
      {past.length > 0 && (
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Results"
              title="Past Events"
              description="Previous tournaments and results."
            />
            <div className="max-w-3xl mx-auto space-y-3">
              {past.map((event, i) => (
                <AnimateIn key={i} delay={i * 50}>
                  <div className="bg-white border border-light-gray rounded-xl p-5 flex items-center justify-between shadow-sm">
                    <div>
                      <h3 className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                        {event.name}
                      </h3>
                      <p className="text-text-muted text-xs mt-0.5">
                        {event.date}{event.teams ? ` · ${event.teams} teams` : ""}
                      </p>
                    </div>
                    <Link
                      href="/schedule"
                      className="text-red text-xs font-bold uppercase tracking-wide hover:text-red-hover transition-colors"
                    >
                      Results
                    </Link>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-16 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h3 className="text-white font-bold text-xl uppercase tracking-tight mb-4 font-[var(--font-chakra)]">
              Don&apos;t see your division?
            </h3>
            <p className="text-white/70 mb-6">
              Let us know what you&apos;re looking for. We&apos;re always adding
              new events and age groups.
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
                Register on LeagueApps <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
