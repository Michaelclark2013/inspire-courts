import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, ExternalLink } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import QuickScoresEmbed from "@/components/ui/QuickScoresEmbed";
import { getPageContent, getField } from "@/lib/content";

export const metadata: Metadata = {
  title: "Schedules & Brackets | Inspire Courts AZ",
  description:
    "View live tournament schedules, brackets, and results for Inspire Courts AZ events via QuickScores. Game schedules drop 48 hours before tip-off.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/schedule",
  },
};

export default function SchedulePage() {
  const page = getPageContent("schedule");

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
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
              {page ? getField(page, "Hero", "badge") : "Game Time"}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              {page ? getField(page, "Hero", "headline") : "Schedules & Brackets"}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              {page ? getField(page, "Hero", "description") : "Find your game times, court assignments, and bracket placements."}{" "}
              Powered by QuickScores.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Schedule Info Bar */}
      <section className="bg-off-white border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
              className="inline-flex items-center gap-1.5 text-red hover:text-red-hover text-xs font-bold uppercase tracking-wide transition-colors"
            >
              Open in QuickScores <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* QuickScores Embed */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <AnimateIn>
            <div className="bg-white border border-light-gray rounded-2xl overflow-hidden shadow-sm">
              <QuickScoresEmbed
                src="https://quickscores.com/inspirecourts"
                title="Inspire Courts Tournament Schedules — QuickScores"
                className="min-h-[500px] md:min-h-[800px]"
              />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Past Results */}
      <section className="py-20 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Archives"
            title="Past Event Results"
            description="Brackets and results from previous tournaments."
          />
          <p className="text-text-muted text-xs mb-6 text-center">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <div className="max-w-3xl mx-auto space-y-3">
            {[
              { name: "OFF SZN Session 1", date: "April 2026" },
              { name: "Red Rock Invitational", date: "March 2026" },
              { name: "Presidents Day Classic", date: "February 2026" },
              { name: "MLK Weekend Shootout", date: "January 2026" },
            ].map((event, i) => (
              <AnimateIn key={i} delay={i * 50}>
                <div className="bg-white border border-light-gray rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-navy font-semibold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                      {event.name}
                    </h3>
                    <p className="text-text-muted text-xs mt-0.5">
                      {event.date}
                    </p>
                  </div>
                  <span className="text-text-muted text-xs font-semibold uppercase">
                    Completed
                  </span>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-16 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h2 className="text-white font-bold text-lg uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
              Not seeing your schedule?
            </h2>
            <p className="text-white/70 mb-4">
              Text or email us and we&apos;ll get you sorted.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                <Mail className="w-4 h-4" /> Contact Us
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/40 hover:bg-white hover:text-navy text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                See Upcoming Events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
