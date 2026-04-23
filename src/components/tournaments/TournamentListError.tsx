import { Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TournamentListError() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 lg:py-16">
      <div className="text-center py-12">
        <div className="max-w-lg mx-auto bg-white border border-light-gray shadow-sm rounded-2xl p-8 lg:p-10">
          <div className="w-16 h-16 bg-red/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-8 h-8 text-red" aria-hidden="true" />
          </div>
          <h2 className="text-navy font-bold text-xl font-heading uppercase tracking-tight mb-3">
            Unable to Load Tournaments
          </h2>
          <p className="text-text-muted text-sm leading-relaxed mb-6">
            We couldn&apos;t load the tournament list right now. This is usually temporary.
            Try refreshing the page, or register directly on LeagueApps.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://inspirecourts.leagueapps.com/tournaments"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
            >
              Register on LeagueApps <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <Link
              href="/contact?type=Tournament+Registration"
              className="inline-flex items-center justify-center gap-2 border border-light-gray hover:border-red/30 text-navy/60 hover:text-navy px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
