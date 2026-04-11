import Link from "next/link";
import { SOCIAL_LINKS } from "@/lib/constants";
import {
  ArrowRight,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Trophy,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  getUpcomingEvents,
  getPastEvents,
  getProperty,
} from "@/lib/notion";

const REGISTER_URL = SOCIAL_LINKS.leagueapps;

export default async function EventsList() {
  const [upcomingEvents, pastEvents] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

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
              {upcoming.map((event: typeof upcoming[0], i: number) => (
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
              {past.map((event: typeof past[0], i: number) => (
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
    </>
  );
}
