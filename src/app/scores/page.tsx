import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScoresPageClient from "@/components/scores/ScoresPageClient";
import BackToTop from "@/components/ui/BackToTop";

export const metadata: Metadata = {
  title: "Live Scores & Standings | Inspire Courts AZ",
  description:
    "Follow live game scores and league standings at Inspire Courts AZ in Gilbert, Arizona.",
  alternates: {
    canonical: "https://inspirecourts.com/scores",
  },
  openGraph: {
    title: "Live Scores & Standings | Inspire Courts AZ",
    description: "Real-time game scores and league standings from Inspire Courts AZ tournaments in Gilbert, Arizona.",
    url: "https://inspirecourts.com/scores",
    images: [{ url: "https://inspirecourts.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Courts AZ Live Scores" }],
  },
};

export default function ScoresPage() {
  return (
    <main className="min-h-screen bg-navy">
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark via-navy to-navy" />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-red text-xs font-bold uppercase tracking-[0.25em] mb-3">
            Inspire Courts AZ
          </p>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-heading mb-4">
            Live Scores &<br />
            Standings
          </h1>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Real-time game scores and league standings. Updates automatically
            during live games.
          </p>
        </div>
      </section>

      <ScoresPageClient />

      {/* Registration CTA */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-red/20 to-red/5 border border-red/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-lg font-heading uppercase tracking-tight">
                Want to Compete?
              </h3>
              <p className="text-white/60 text-sm">
                Register your team for the next tournament.
              </p>
            </div>
            <Link
              href="/tournaments"
              className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors flex-shrink-0"
            >
              Browse Tournaments <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <BackToTop />
    </main>
  );
}
