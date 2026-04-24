import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function TournamentHero({
  hasActiveTournaments,
}: {
  hasActiveTournaments: boolean;
}) {
  return (
    <section className="relative overflow-hidden" aria-label="Tournament registration hero">
      <Image
        src="/images/courts-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-bg-primary" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.15),transparent_60%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-28 pb-16 sm:py-20 lg:py-28 text-center">
        <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-5 font-heading">
          OFF SZN HOOPS
        </span>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-heading uppercase tracking-tight mb-4 drop-shadow-lg">
          Tournament
          <br />
          <span className="text-red">Registration</span>
        </h1>

        <p className="text-white/70 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed mb-8 px-2">
          Register your team, compete at Arizona&apos;s premier facility, and
          track live scores &mdash; all in one place. 52,000 sq ft, 7
          hardwood courts, game film every game.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
          {hasActiveTournaments ? (
            <a
              href="#tournaments"
              className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 sm:px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg shadow-red/30 font-heading focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-navy min-h-[48px]"
            >
              View Tournaments <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          ) : (
            <a
              href="https://inspirecourts.leagueapps.com/tournaments"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 sm:px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg shadow-red/30 font-heading focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-navy min-h-[48px]"
            >
              Register on LeagueApps <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          )}
          <Link
            href="/scores"
            className="inline-flex items-center justify-center gap-2 bg-white/10 border-2 border-white/30 hover:bg-white/20 text-white px-6 sm:px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors font-heading focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-navy min-h-[48px]"
          >
            Live Scores
          </Link>
        </div>
      </div>
    </section>
  );
}
