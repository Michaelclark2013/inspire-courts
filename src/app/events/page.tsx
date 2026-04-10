import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Users, DollarSign, MapPin } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Youth Basketball Tournaments in Gilbert, AZ | OFF SZN HOOPS",
  description:
    "Register for upcoming youth basketball tournaments at Inspire Courts AZ. 10U-17U divisions, boys and girls. Game film, live scoreboards, 3+ game guarantee.",
};

const UPCOMING_EVENTS = [
  {
    id: "1",
    name: "OFF SZN Session 1",
    date: "May 2025",
    divisions: ["10U", "11U", "12U", "13U", "14U", "15U", "17U"],
    fee: "$400",
    spotsLeft: 8,
    maxTeams: 24,
    brand: "OFF SZN HOOPS",
    status: "Registration Open",
  },
  {
    id: "2",
    name: "Hoopalooza Heroes",
    date: "June 2025",
    divisions: ["10U", "12U", "14U", "17U"],
    fee: "$400",
    spotsLeft: 12,
    maxTeams: 20,
    brand: "OFF SZN HOOPS",
    status: "Registration Open",
  },
  {
    id: "3",
    name: "Memorial Day Heroes",
    date: "May 2025",
    divisions: ["11U", "12U", "13U", "14U", "15U", "17U"],
    fee: "$450",
    spotsLeft: 5,
    maxTeams: 24,
    brand: "OFF SZN HOOPS",
    status: "Registration Open",
  },
];

const PAST_EVENTS = [
  { name: "Red Rock Invitational", date: "April 2025", teams: 32 },
  { name: "OFF SZN Session 4", date: "March 2025", teams: 20 },
  { name: "Presidents Day Classic", date: "February 2025", teams: 24 },
  { name: "MLK Weekend Shootout", date: "January 2025", teams: 28 },
];

export default function EventsPage() {
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
              Events & Register
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Youth basketball tournaments in Gilbert, AZ. 10U through 17U
              divisions, boys and girls. 3+ game guarantee, game film, live
              scoreboards.
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {UPCOMING_EVENTS.map((event, i) => (
              <AnimateIn key={event.id} delay={i * 100}>
                <div className="bg-white border border-light-gray rounded-xl p-6 flex flex-col h-full hover:shadow-lg transition-shadow shadow-sm">
                  <span className="inline-block self-start bg-red/10 text-red text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                    {event.brand}
                  </span>

                  <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
                    {event.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Calendar className="w-4 h-4 text-red" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <DollarSign className="w-4 h-4 text-red" />
                      {event.fee} per team
                    </div>
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Users className="w-4 h-4 text-red" />
                      {event.spotsLeft} spots left of {event.maxTeams}
                    </div>
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <MapPin className="w-4 h-4 text-red" />
                      Inspire Courts AZ, Gilbert
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {event.divisions.map((div) => (
                      <span
                        key={div}
                        className="bg-off-white text-navy text-xs font-semibold px-2.5 py-1 rounded-full"
                      >
                        {div}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <Link
                      href="/contact?type=Tournament+Registration"
                      className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover text-white py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                    >
                      Register <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-20 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Results"
            title="Past Events"
            description="Previous tournaments and results."
          />
          <div className="max-w-3xl mx-auto space-y-3">
            {PAST_EVENTS.map((event, i) => (
              <AnimateIn key={i} delay={i * 50}>
                <div className="bg-white border border-light-gray rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                      {event.name}
                    </h3>
                    <p className="text-text-muted text-xs mt-0.5">
                      {event.date} &middot; {event.teams} teams
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
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimateIn>
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
