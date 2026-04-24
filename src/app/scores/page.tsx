import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScoresPageClient from "@/components/scores/ScoresPageClient";
import BackToTop from "@/components/ui/BackToTop";
import AnimateIn from "@/components/ui/AnimateIn";
import QuickContactBar from "@/components/ui/QuickContactBar";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Live Scores & Standings | Inspire Courts AZ",
  description: "Follow live game scores and league standings at Inspire Courts AZ in Gilbert, Arizona.",
  alternates: { canonical: `${SITE_URL}/scores` },
  openGraph: {
    title: "Live Scores & Standings | Inspire Courts AZ",
    description: "Real-time game scores and league standings from Inspire Courts AZ tournaments in Gilbert, Arizona.",
    url: `${SITE_URL}/scores`,
    images: [{ url: `${SITE_URL}/images/courts-bg.jpg`, width: 1200, height: 630, alt: "Inspire Courts AZ Live Scores" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Scores & Standings | Inspire Courts AZ",
    description: "Real-time game scores and league standings from Inspire Courts AZ tournaments.",
    images: [`${SITE_URL}/images/courts-bg.jpg`],
  },
};

export default function ScoresPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:py-28 lg:py-36 overflow-hidden">
        <Image
          src="/images/courts-bg.jpg"
          alt="Inspire Courts AZ live scores"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/90" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <p className="text-red text-xs font-bold uppercase tracking-[0.25em] mb-3">
              Inspire Courts AZ
            </p>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-heading mb-4">
              Live Scores &<br />
              Standings
            </h1>
            <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
              Real-time game scores and league standings. Updates automatically
              during live games.
            </p>
            <div className="flex items-center justify-center gap-2 text-emerald-400/70 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              Auto-refreshes during live games
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Scoreboard — kept dark for live game viewing */}
      <section className="bg-navy py-8 sm:py-12" aria-label="Live scoreboard">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="sr-only">Live Scoreboard</h2>
          <ScoresPageClient />
        </div>
      </section>

      {/* Registration CTA */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <AnimateIn>
            <div className="bg-white border border-light-gray rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-navy font-bold text-lg font-heading uppercase tracking-tight">
                  Want to Compete?
                </h3>
                <p className="text-text-muted text-sm">
                  Register your team for the next tournament.
                </p>
              </div>
              <Link
                href="/tournaments"
                className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors flex-shrink-0"
              >
                Browse Tournaments <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      <QuickContactBar subject="Scores" label="Need help?" />

      <BackToTop />
    </div>
  );
}
