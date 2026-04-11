import type { Metadata } from "next";
import LiveScoreboard from "@/components/scores/LiveScoreboard";
import StandingsTable from "@/components/scores/StandingsTable";
import BackToTop from "@/components/ui/BackToTop";

export const metadata: Metadata = {
  title: "Live Scores & Standings | Inspire Courts AZ",
  description:
    "Follow live game scores and league standings at Inspire Courts AZ in Gilbert, Arizona.",
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
            Real-time game scores and league standings. Updates every 30 seconds
            during live games.
          </p>
        </div>
      </section>

      {/* Scoreboard */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <LiveScoreboard />
        </div>
      </section>

      {/* Standings */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-navy-light/40 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">
                League Standings
              </h2>
            </div>
            <StandingsTable />
          </div>
        </div>
      </section>

      <BackToTop />
    </main>
  );
}
