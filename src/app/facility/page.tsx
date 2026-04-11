import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Tv, Video, Snowflake, UtensilsCrossed, Trophy } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import QuickContactBar from "@/components/ui/QuickContactBar";
import BackToTop from "@/components/ui/BackToTop";

export const metadata: Metadata = {
  title: "Indoor Basketball Court Rental in Gilbert, AZ | Inspire Courts AZ",
  description:
    "Professional indoor basketball court rental in Gilbert, AZ. 7 courts, live scoreboards, game film, climate-controlled. Book for leagues, practices, and events.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/facility",
  },
};

const FEATURES = [
  {
    icon: Trophy,
    title: "Courts",
    headline: "7 Regulation Indoor Courts",
    desc: "Professional-grade hardwood flooring, regulation dimensions, and adjustable hoops for all age groups. Built for real competition.",
  },
  {
    icon: Tv,
    title: "Technology",
    headline: "Digital Scoreboards & Game Film",
    desc: "Live digital scoreboards visible from every angle. Game film captured for every game — your team gets footage to review and improve.",
  },
  {
    icon: UtensilsCrossed,
    title: "Concessions",
    headline: "Snack Bar & Game-Day Fuel",
    desc: "Drinks, snacks, and meals available all day during events. No outside food or beverages permitted.",
  },
  {
    icon: Snowflake,
    title: "Climate",
    headline: "Fully Air-Conditioned",
    desc: "No Arizona heat, no excuses. Our facility is fully climate-controlled year-round. Play in comfort no matter the season.",
  },
];

export default function FacilityPage() {
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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              The Complex
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              The Facility
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              A premium indoor basketball facility built from the ground up for
              serious competition. Every detail is intentional.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Features - alternating layout */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Facility Features</h2>
          <div className="space-y-16">
            {FEATURES.map((feature, i) => (
              <AnimateIn key={feature.title} delay={i * 80}>
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center`}
                >
                  {/* Image placeholder */}
                  <div
                    className={`bg-off-white border border-light-gray rounded-xl aspect-[16/10] flex items-center justify-center ${
                      i % 2 === 1 ? "lg:order-2" : ""
                    }`}
                  >
                    <feature.icon className="w-16 h-16 text-red" />
                  </div>

                  {/* Content */}
                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                    <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
                      {feature.title}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-semibold uppercase tracking-tight text-navy mb-4 font-[var(--font-chakra)]">
                      {feature.headline}
                    </h3>
                    <p className="text-text-muted leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Parallax break */}
      <section
        className="relative py-28 bg-scroll md:bg-fixed bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)]">
            No Rec Gyms. No Excuses.
          </h2>
          <p className="text-white/70 text-lg">
            This is what youth basketball should look like.
          </p>
        </div>
      </section>

      {/* Rental CTA */}
      <section id="rentals" className="py-20 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-navy rounded-xl p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
                  Rentals
                </p>
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)]">
                  Book the Facility
                </h2>
                <p className="text-white/70 leading-relaxed mb-6">
                  Host your league, practice, or private event at Inspire
                  Courts. Available for leagues, team practices, private
                  tournaments, camps, clinics, and corporate events.
                </p>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                >
                  Book the Facility <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  "Leagues & rec programs",
                  "Team practices & workouts",
                  "Private tournaments",
                  "Youth camps & clinics",
                  "Corporate events",
                  "Film sessions & combines",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-white/70"
                  >
                    <div className="w-2 h-2 bg-red rounded-full flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-6 text-center font-[var(--font-chakra)]">
            You Might Also Like
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/book"
              className="group flex items-center justify-between bg-off-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Book the Facility
                </p>
                <p className="text-text-muted text-xs mt-0.5">Request a reservation online</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/events"
              className="group flex items-center justify-between bg-off-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Tournaments
                </p>
                <p className="text-text-muted text-xs mt-0.5">Register for OFF SZN HOOPS events</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/training"
              className="group flex items-center justify-between bg-off-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Private Training
                </p>
                <p className="text-text-muted text-xs mt-0.5">Train here with a pro coach</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <QuickContactBar subject="Facility Rental" label="Book the court?" formHref="/book" />
      <BackToTop />
      <div className="h-28 lg:hidden" />
    </>
  );
}
