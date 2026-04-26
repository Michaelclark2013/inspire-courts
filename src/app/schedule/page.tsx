import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Mail, ExternalLink } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import QuickScoresEmbed from "@/components/ui/QuickScoresEmbed";
import BackToTop from "@/components/ui/BackToTop";
import QuickContactBar from "@/components/ui/QuickContactBar";
import { getPageContent, getField } from "@/lib/content";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Schedules & Brackets | Inspire Courts AZ",
  description:
    "View live tournament schedules, brackets, and results for Inspire Courts AZ events via QuickScores. Game schedules drop 48 hours before tip-off.",
  alternates: {
    canonical: `${SITE_URL}/schedule`,
  },
  openGraph: {
    title: "Schedules & Brackets | Inspire Courts AZ",
    description: "Live tournament schedules, brackets, and results for Inspire Courts AZ events. Game schedules drop 48 hours before tip-off.",
    url: `${SITE_URL}/schedule`,
    images: [{ url: `${SITE_URL}/images/courts-bg.jpg`, width: 1200, height: 630, alt: "Inspire Courts AZ tournament schedules" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Schedules & Brackets | Inspire Courts AZ",
    description: "Live schedules, brackets, and results. Schedules drop 48 hours before tip-off.",
    images: [`${SITE_URL}/images/courts-bg.jpg`],
  },
};

// Schedules update intra-day; revalidate every 5 minutes so manual edits
// in admin propagate quickly while still benefiting from edge cache.
export const revalidate = 300;

const scheduleBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Schedule", item: `${SITE_URL}/schedule` },
  ],
};

export default async function SchedulePage() {
  const page = await getPageContent("schedule");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scheduleBreadcrumbLd) }}
      />
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/courts-bg.jpg" alt="Inspire Courts AZ tournament schedules and brackets" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              {page ? getField(page, "Hero", "badge") : "Game Time"}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg text-balance">
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
              <Clock className="w-5 h-5 text-red" aria-hidden="true" />
              <p className="text-navy text-sm font-semibold">
                Schedules drop <span className="text-red">48 hours</span> before
                tip-off and are emailed to head coaches.
              </p>
            </div>
            <a
              href="https://quickscores.com/inspirecourts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-red hover:text-red-hover text-xs font-bold uppercase tracking-wide px-4 min-h-[44px] rounded-lg border border-red/20 hover:bg-red/5 transition-colors"
            >
              Open in QuickScores <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
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
                aria-label="QuickScores tournament schedule embed for Inspire Courts AZ"
              />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Past Results */}
      <section className="py-14 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Archives"
            title="Past Event Results"
            description="Brackets and results from previous tournaments."
          />
          <div className="max-w-3xl mx-auto space-y-3">
            {[
              { name: "OFF SZN Session 1", date: "April 2026" },
              { name: "Red Rock Invitational", date: "March 2026" },
              { name: "Presidents Day Classic", date: "February 2026" },
              { name: "MLK Weekend Shootout", date: "January 2026" },
            ].map((event, i) => (
              <AnimateIn key={i} delay={i * 50}>
                <Link
                  href="/tournaments"
                  className="group bg-white border border-light-gray rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:border-red/20 transition-all block"
                >
                  <div>
                    <h3 className="text-navy font-semibold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                      {event.name}
                    </h3>
                    <p className="text-text-muted text-xs mt-0.5">
                      {event.date}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-red text-xs font-semibold uppercase group-hover:underline flex-shrink-0"
                  >
                    View Results <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </span>
                </Link>
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
                <Mail className="w-4 h-4" aria-hidden="true" /> Contact Us
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/40 hover:bg-white hover:text-navy text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                See Upcoming Events <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      <QuickContactBar subject="Schedule" label="Need help finding your schedule?" />
      <BackToTop />
      <div className="h-20 lg:hidden" />
    </>
  );
}
