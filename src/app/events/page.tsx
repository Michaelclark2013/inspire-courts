import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Trophy,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import BackToTop from "@/components/ui/BackToTop";
import { isNotionConfigured } from "@/lib/notion";
import EventsList from "./EventsList";

export const metadata: Metadata = {
  title: "Basketball Tournaments | Inspire Courts AZ — Gilbert, AZ",
  description:
    "Youth basketball tournaments in Gilbert, AZ at Inspire Courts AZ. 10U–17U boys & girls divisions. 3+ game guarantee, game film available. Register your team now.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/events",
  },
  openGraph: {
    title: "Youth Basketball Tournaments | Inspire Courts AZ",
    description: "10U–17U boys & girls divisions. 3+ game guarantee, game film available. Register your team at Arizona's premier indoor facility.",
    url: "https://inspirecourtsaz.com/events",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Courts AZ youth basketball tournaments" }],
  },
};

const REGISTER_URL = "/tournaments";

/* ─── Loading Skeleton ─── */
function EventsListSkeleton() {
  return (
    <div aria-hidden="true">
      {/* Fake tab bar */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-light-gray shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 -mb-px">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 px-5 py-4">
                <div className="w-4 h-4 bg-light-gray rounded animate-pulse" />
                <div className={`h-4 bg-light-gray rounded animate-pulse ${i === 1 ? "w-24" : i === 2 ? "w-32" : "w-28"}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fake filter bar */}
      <div className="py-8 bg-off-white border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 h-12 bg-white border border-light-gray rounded-xl animate-pulse" />
            <div className="h-12 w-40 bg-white border border-light-gray rounded-xl animate-pulse" />
            <div className="h-12 w-36 bg-white border border-light-gray rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Fake cards */}
      <div className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-light-gray rounded-2xl overflow-hidden animate-pulse">
                <div className="bg-navy/10 h-14" />
                <div className="p-6">
                  <div className="h-6 bg-light-gray rounded w-3/4 mb-4" />
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-light-gray rounded-lg" />
                      <div className="h-4 bg-light-gray rounded w-32" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-light-gray rounded-lg" />
                      <div className="h-4 bg-light-gray rounded w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-7 w-12 bg-light-gray rounded-full" />
                    ))}
                  </div>
                  <div className="h-12 bg-light-gray rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Fallback when Notion is not configured ─── */
function NoNotionFallback() {
  return (
    <section className="py-14 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-red text-xs font-bold uppercase tracking-[0.2em] mb-2 font-[var(--font-chakra)]">
            Upcoming
          </span>
          <h2 className="text-navy text-3xl lg:text-4xl font-bold uppercase tracking-tight font-[var(--font-chakra)]">
            Upcoming Basketball Tournaments
          </h2>
        </div>
        <AnimateIn>
          <div className="max-w-2xl mx-auto text-center bg-off-white border border-light-gray rounded-xl p-10">
            <Trophy className="w-10 h-10 text-red mx-auto mb-4" />
            <h3 className="text-navy font-bold text-lg uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
              Basketball Tournaments Coming Soon
            </h3>
            <p className="text-text-muted text-sm mb-6 leading-relaxed">
              New basketball tournaments are announced regularly. Follow us on
              Instagram or check our tournaments page to be the first to know when
              registration opens.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://inspirecourts.leagueapps.com/tournaments"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Register Now <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/inspirecourts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-navy/20 hover:border-navy/40 text-navy px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                @inspirecourts
              </a>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

/* ─── Page ─── */
export default function EventsPage() {
  const notionEnabled = isNotionConfigured();

  return (
    <>
      {/* Hero — compact & punchy */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/courts-bg.jpg"
          alt="Inspire Courts AZ youth basketball tournament"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/85 to-navy/95" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <AnimateIn>
              <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-5 font-[var(--font-chakra)]">
                OFF SZN HOOPS
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)] drop-shadow-lg">
                Youth Basketball<br className="hidden sm:block" /> Tournaments
              </h1>

              <p className="text-red font-bold text-sm uppercase tracking-[0.2em] mb-5 font-[var(--font-chakra)]">
                Gilbert, AZ · Boys &amp; Girls · 10U – 17U
              </p>

              <p className="text-white/70 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                52,000 sq ft, 7 hardwood courts, game film every game, electronic
                scoreboards. Register your team and compete at Arizona&apos;s premier facility.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://inspirecourts.leagueapps.com/tournaments"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg shadow-red/30"
                >
                  Register Your Team <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/contact?type=Tournament+Registration"
                  className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/30 hover:bg-white hover:text-navy text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                >
                  Questions? Contact Us
                </Link>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* 2026 Tournament Schedule */}
      <section className="py-10 lg:py-14 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-6">
              <span className="inline-block text-red text-xs font-bold uppercase tracking-[0.2em] mb-2 font-[var(--font-chakra)]">
                Season Schedule
              </span>
              <h2 className="text-white text-2xl lg:text-3xl font-bold uppercase tracking-tight font-[var(--font-chakra)]">
                2026 Tournament Schedule
              </h2>
            </div>
            <div className="mx-auto max-w-md w-full">
              <Image
                src="/images/2026-tournament-schedule.png"
                alt="2026 Inspire Courts Tournament Schedule"
                width={1080}
                height={1080}
                className="w-full h-auto rounded-2xl shadow-2xl shadow-black/40"
                priority
              />
            </div>
            <div className="text-center mt-6">
              <a
                href="https://inspirecourts.leagueapps.com/tournaments"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Register Now <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Events Hub — tabs, filters, schedule, game day */}
      {notionEnabled ? (
        <Suspense fallback={<EventsListSkeleton />}>
          <EventsList />
        </Suspense>
      ) : (
        <NoNotionFallback />
      )}

      <BackToTop />
      <div className="h-20 lg:hidden" />
    </>
  );
}
