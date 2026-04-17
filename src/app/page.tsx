import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Zap,
  MapPin,
  Phone,
  CalendarDays,
  Users,
  GraduationCap,
} from "lucide-react";
import { FACILITY_EMAIL, FACILITY_PHONE } from "@/lib/constants";
import { getPageContent, getField } from "@/lib/content";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import VideoShowcase from "@/components/ui/VideoShowcase";
import BackToTop from "@/components/ui/BackToTop";
import QuickContactBar from "@/components/ui/QuickContactBar";
import EmailSignup from "@/components/ui/EmailSignup";
import StatsBar from "@/components/home/StatsBar";
import ProgramsGrid from "@/components/home/ProgramsGrid";
import UpcomingTournaments, {
  UpcomingTournamentsSkeleton,
} from "@/components/home/UpcomingTournaments";
import TournamentsErrorBoundary from "@/components/home/TournamentsErrorBoundary";

export const metadata: Metadata = {
  title:
    "Inspire Courts AZ | Indoor Basketball & Volleyball Facility in Gilbert, Arizona",
  description:
    "Arizona's premier indoor basketball & volleyball facility. 7 courts, game film available at tournaments. Home of OFF SZN HOOPS tournaments in Gilbert, AZ.",
  keywords: [
    "indoor basketball Gilbert AZ",
    "volleyball facility Arizona",
    "youth basketball tournaments",
    "OFF SZN HOOPS",
    "AAU basketball Arizona",
    "basketball prep school",
  ],
  alternates: {
    canonical: "https://inspirecourtsaz.com",
  },
  openGraph: {
    title: "Inspire Courts AZ | Indoor Basketball & Volleyball Facility",
    description:
      "Arizona's premier indoor basketball & volleyball facility. 7 courts, game film, tournaments. Gilbert, AZ.",
    url: "https://inspirecourtsaz.com",
    type: "website",
    images: [
      {
        url: "https://inspirecourtsaz.com/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Inspire Courts AZ indoor basketball facility in Gilbert, Arizona",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inspire Courts AZ | Indoor Basketball & Volleyball Facility",
    description:
      "Arizona's premier indoor basketball & volleyball facility in Gilbert, AZ.",
    images: ["https://inspirecourtsaz.com/images/hero-bg.jpg"],
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  "@id": "https://inspirecourtsaz.com",
  name: "Inspire Courts AZ",
  description:
    "Arizona's premier indoor basketball & volleyball facility. 7 regulation courts, game film available at tournaments. Home of OFF SZN HOOPS youth basketball tournaments.",
  url: "https://inspirecourtsaz.com",
  email: FACILITY_EMAIL,
  telephone: FACILITY_PHONE,
  address: {
    "@type": "PostalAddress",
    streetAddress: "1090 N Fiesta Blvd, Ste 101 & 102",
    addressLocality: "Gilbert",
    addressRegion: "AZ",
    postalCode: "85233",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 33.3825,
    longitude: -111.789,
  },
  sameAs: [
    "https://www.instagram.com/inspirecourts",
    "https://www.youtube.com/@AZFinestMixtape",
  ],
  sport: ["Basketball", "Volleyball", "Futsal", "Jiu-Jitsu"],
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Indoor Courts", value: true },
    { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
    { "@type": "LocationFeatureSpecification", name: "Game Film", value: true },
    { "@type": "LocationFeatureSpecification", name: "Snack Bar", value: true },
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Inspire Courts AZ",
  url: "https://inspirecourtsaz.com",
  logo: "https://inspirecourtsaz.com/images/inspire-athletics-logo.png",
  email: FACILITY_EMAIL,
  telephone: FACILITY_PHONE,
  sameAs: [
    "https://www.instagram.com/inspirecourts",
    "https://www.youtube.com/@AZFinestMixtape",
  ],
};

const SECONDARY_PROGRAMS = [
  {
    href: "/prep",
    icon: GraduationCap,
    title: "Inspire Prep",
    sub: "Prep School",
    desc: "Elite development meets academics. Daily training, national competition, college placement.",
  },
  {
    href: "/teams",
    icon: Users,
    title: "Team Inspire",
    sub: "Club Basketball",
    desc: "Competitive club ball on the MADE Hoops circuit. Where it all started.",
  },
  {
    href: "/open-gym",
    icon: CalendarDays,
    title: "Open Gym",
    sub: "Drop-In Runs",
    desc: "No team needed. Weekdays 10 AM – 3:30 PM on regulation hardwood.",
  },
  {
    href: "/training",
    icon: Zap,
    title: "Private Training",
    sub: "Skill Development",
    desc: "1-on-1 and small group sessions with experienced coaches.",
  },
] as const;

const FEATURED_VIDEOS = [
  { id: "hLGrKauJzLc", title: "Jalen Williams grew up at Inspire Courts", name: "Jalen Williams", subtitle: "NBA — OKC Thunder", aspect: "9/16" as const, start: 37 },
  { id: "zYIBPJeUjGU", title: "Marvin Bagley III at Inspire Courts", name: "Marvin Bagley III", subtitle: "NBA — 8th Grade at Inspire" },
  { id: "FmcgFmICrf4", title: "Koa Peat training at Inspire Courts", name: "Koa Peat", subtitle: "#1 Recruit · Training at Inspire" },
  { id: "S8HgOlyWnDg", title: "Cody Williams training at Inspire Courts", name: "Cody Williams", subtitle: "NBA · Training at Inspire" },
  { id: "ENl-hXQbEo8", title: "Thompson Twins playing for Team Inspire", name: "Thompson Twins", subtitle: "NBA · Team Inspire Alumni" },
  { id: "HkiDY_bwRVw", title: "Saben Lee training at Inspire Courts", name: "Saben Lee", subtitle: "NBA — Training at Inspire" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2";
const FOCUS_RING_ON_DARK =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy";

export default function Home() {
  const page = getPageContent("home");

  return (
    <>
      <Script
        id="ld-local-business"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Script
        id="ld-organization"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* HERO */}
      <section
        className="relative min-h-[85dvh] md:min-h-[100dvh] flex items-center justify-center overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAABv/EAB4QAAICAgIDAAAAAAAAAAAAAAECAAMEEQUSITFB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAYEQEAAwEAAAAAAAAAAAAAAAABAAIRMf/aAAwDAQACEQMRAD8AoY+RkXWV1rZaAzBQFPgbnuIiVsl2T//Z"
          className="object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-navy" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.15),transparent_60%)]" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1
            id="hero-heading"
            className="heading-hero font-bold uppercase tracking-tight text-white leading-[0.9] mb-8 font-[var(--font-chakra)] drop-shadow-[2px_4px_16px_rgba(0,0,0,0.5)]"
          >
            Arizona&apos;s Premier
            <br />
            <span className="bg-gradient-to-r from-white via-red to-red-hover bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(204,0,0,0.3)]">
              Basketball &amp; Volleyball
            </span>
            <br />
            Facility
          </h1>

          <AnimateIn delay={200}>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
              {page
                ? getField(page, "Hero", "subheadline")
                : "7 courts. 52,000 sq ft. Basketball & volleyball. Built for competitors."}
            </p>
          </AnimateIn>

          <AnimateIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://inspirecourts.leagueapps.com/tournaments"
                target="_blank"
                rel="noopener noreferrer"
                className={`group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 sm:px-12 sm:py-5 rounded-full font-bold text-base sm:text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_6px_28px_rgba(204,0,0,0.5)] font-[var(--font-chakra)] ${FOCUS_RING_ON_DARK}`}
              >
                {page ? getField(page, "Hero", "ctaPrimary") : "Register for Next Event"}{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </a>
              <Link
                href="/book"
                className={`group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white/90 hover:bg-white hover:text-navy px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] font-[var(--font-chakra)] ${FOCUS_RING_ON_DARK}`}
              >
                {page ? getField(page, "Hero", "ctaSecondary") : "Book a Court"}{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      <StatsBar />

      {/* JALEN WILLIAMS FEATURE */}
      <section id="about" className="py-14 lg:py-20 bg-off-white scroll-mt-20" aria-labelledby="jalen-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimateIn>
              <div>
                <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
                  Homegrown Talent
                </span>
                <h2
                  id="jalen-heading"
                  className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-navy mb-6 font-[var(--font-chakra)] leading-[0.95]"
                >
                  <span className="text-red">Jalen Williams</span> Grew Up Here
                </h2>
                <p className="text-text-muted text-lg leading-relaxed mb-6">
                  OKC Thunder guard Jalen Williams grew up training at Inspire Courts in Gilbert, AZ. From our gym to the NBA — this is where it starts.
                </p>
                <Link
                  href="/about"
                  className={`group inline-flex items-center gap-2 text-red font-bold text-sm uppercase tracking-wide hover:text-navy transition-colors font-[var(--font-chakra)] rounded ${FOCUS_RING}`}
                >
                  Read our story
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </div>
            </AnimateIn>
            <AnimateIn delay={150}>
              <div className="flex justify-center">
                <div
                  className="relative rounded-2xl overflow-hidden shadow-2xl border border-light-gray"
                  style={{ width: "100%", maxWidth: "340px", aspectRatio: "9/16" }}
                >
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/hLGrKauJzLc?rel=0&modestbranding=1&start=37"
                    title="Jalen Williams grew up at Inspire Courts"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      <div className="cv-auto">
        <ProgramsGrid />
      </div>

      {/* SECONDARY PROGRAMS */}
      <section id="programs" className="py-14 lg:py-20 bg-off-white scroll-mt-20" aria-labelledby="secondary-programs-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Programs"
            title="Train. Compete. Grow."
            description="From open runs to prep school — there's a place for every player at Inspire."
            titleId="secondary-programs-heading"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {SECONDARY_PROGRAMS.map((item, i) => (
              <AnimateIn key={item.title} delay={i * 80}>
                <Link
                  href={item.href}
                  className={`group bg-white border border-light-gray rounded-2xl p-5 lg:p-6 hover:border-red/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col ${FOCUS_RING}`}
                >
                  <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-red" aria-hidden="true" />
                  </div>
                  <h3 className="text-navy font-[var(--font-chakra)] font-bold text-sm uppercase tracking-tight mb-0.5">
                    {item.title}
                  </h3>
                  <p className="text-text-muted text-[10px] uppercase tracking-wider mb-3">{item.sub}</p>
                  <p className="text-text-muted text-xs leading-relaxed flex-1">{item.desc}</p>
                  <ArrowRight className="w-4 h-4 text-red mt-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING TOURNAMENTS (streamed, isolated errors) */}
      <div id="tournaments" className="scroll-mt-20" />
      <TournamentsErrorBoundary>
        <Suspense fallback={<UpcomingTournamentsSkeleton />}>
          <UpcomingTournaments />
        </Suspense>
      </TournamentsErrorBoundary>

      {/* DUAL BRAND CARDS */}
      <section className="py-12 lg:py-20 bg-white" aria-labelledby="mission-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Our Mission"
            title={
              page
                ? getField(page, "Mission Section", "headline") || "Two Brands. One Mission."
                : "Two Brands. One Mission."
            }
            description={
              page
                ? getField(page, "Mission Section", "description") ||
                  "Inspire Courts is the home base. OFF SZN HOOPS is the tournament series. Together, we're elevating youth sports in Arizona."
                : "Inspire Courts is the home base. OFF SZN HOOPS is the tournament series. Together, we're elevating youth sports in Arizona."
            }
            titleId="mission-heading"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            <AnimateIn>
              <div className="relative bg-navy rounded-3xl p-6 sm:p-10 lg:p-14 h-full flex flex-col text-white overflow-hidden group hover:shadow-2xl transition-shadow">
                <Image
                  src="/images/hero-bg-texture.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                  className="object-cover object-center opacity-[0.07]"
                />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-6 sm:mb-8">
                    <Image
                      src="/images/inspire-athletics-logo.png"
                      alt="Inspire Courts"
                      width={96}
                      height={96}
                      loading="lazy"
                      className="object-contain"
                    />
                  </div>
                  <span className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-2">
                    The Facility
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-semibold uppercase tracking-tight mb-5 font-[var(--font-chakra)] leading-[0.95]">
                    Inspire Courts
                  </h3>
                  <p className="text-white/75 leading-relaxed mb-6 sm:mb-8 flex-1 text-base">
                    The home base. 7 regulation indoor courts — basketball and volleyball — with a pro-level setup and game film available at tournaments. Available for leagues, practices, camps, clinics, and private events.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6 sm:mb-10">
                    {["7 Courts", "Game Film", "Rentals"].map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-white/15 border border-white/25 text-white px-4 py-1.5 rounded-full font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/facility"
                    className={`group/btn inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-4.5 rounded-full font-bold text-sm uppercase tracking-wide transition-all self-start font-[var(--font-chakra)] shadow-[0_4px_24px_rgba(204,0,0,0.4)] hover:scale-[1.03] ${FOCUS_RING_ON_DARK}`}
                  >
                    Explore the Facility{" "}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </AnimateIn>

            <AnimateIn delay={150}>
              <div className="relative bg-white border-2 border-light-gray rounded-3xl p-6 sm:p-10 lg:p-14 h-full flex flex-col overflow-hidden group hover:border-red/40 hover:shadow-2xl transition-all">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-navy rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 shadow-lg">
                    <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-red" aria-hidden="true" />
                  </div>
                  <span className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-2">
                    The Tournament Series
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-semibold uppercase tracking-tight text-navy mb-5 font-[var(--font-chakra)] leading-[0.95]">
                    OFF SZN HOOPS
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-6 sm:mb-8 flex-1 text-base">
                    Compete at the highest level. Year-round youth basketball tournaments with 10U through 17U divisions, boys and girls. Get ranked. Get seen. Get better.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6 sm:mb-10">
                    {["10U–17U", "Boys & Girls", "3+ Games", "Ranked"].map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-navy/5 border border-navy/15 text-navy px-4 py-1.5 rounded-full font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/tournaments"
                    className={`group/btn inline-flex items-center gap-2 bg-navy hover:bg-navy-dark text-white px-10 py-4.5 rounded-full font-bold text-sm uppercase tracking-wide transition-all self-start font-[var(--font-chakra)] shadow-lg hover:scale-[1.03] ${FOCUS_RING}`}
                  >
                    Browse Tournaments{" "}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* VIDEO SHOWCASE */}
      <section className="py-14 lg:py-20 bg-navy cv-auto" aria-labelledby="showcase-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="On the Map"
            title="Homegrown Talent"
            description="From NBA players to rising prep stars — Inspire Courts is where Arizona basketball happens."
            dark
            titleId="showcase-heading"
          />
          <VideoShowcase videos={FEATURED_VIDEOS} initialCount={4} theme="dark" />
        </div>
      </section>

      {/* LOCATION + CTA */}
      <section className="py-12 lg:py-20 bg-off-white cv-auto" aria-labelledby="location-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateIn>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-light-gray aspect-video lg:aspect-[4/3]">
                <iframe
                  src="https://maps.google.com/maps?q=33.3579,-111.7890&output=embed&z=16"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Inspire Courts AZ Location"
                  aria-label="Google Maps showing Inspire Courts AZ location in Gilbert, Arizona"
                />
              </div>
            </AnimateIn>

            <AnimateIn delay={200}>
              <div>
                <p className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-3">
                  Visit Us
                </p>
                <h2
                  id="location-heading"
                  className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-8 font-[var(--font-chakra)]"
                >
                  {page ? getField(page, "Location", "headline") : "Come See It Live"}
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-red" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-bold text-navy">
                        {page
                          ? getField(page, "Location", "address")
                          : "1090 N Fiesta Blvd, Ste 101 & 102"}
                      </p>
                      <p className="text-text-muted text-sm">
                        {page ? getField(page, "Location", "city") : "Gilbert, AZ 85233"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-red" aria-hidden="true" />
                    </div>
                    <div>
                      <a
                        href={`tel:${FACILITY_PHONE.replace(/\D/g, "")}`}
                        className={`font-bold text-navy hover:text-red hover:underline transition-colors rounded ${FOCUS_RING}`}
                      >
                        {FACILITY_PHONE}
                      </a>
                      <p className="text-text-muted text-sm">Call or text</p>
                    </div>
                  </div>
                </div>

                <p className="text-text-muted leading-relaxed mb-8">
                  Walk-ins welcome on non-tournament days. Follow us for schedules and highlights.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <a
                    href="https://www.google.com/maps/dir//1090+N+Fiesta+Blvd+Ste+101+%26+102+Gilbert+AZ+85233"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all font-[var(--font-chakra)] shadow-md ${FOCUS_RING}`}
                  >
                    Get Directions{" "}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </a>
                </div>
                <p className="text-text-muted text-sm">
                  Follow us:{" "}
                  <a
                    href="https://instagram.com/inspirecourts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-navy font-semibold hover:text-red transition-colors rounded ${FOCUS_RING}`}
                  >
                    @inspirecourts
                  </a>
                  {" · "}
                  <a
                    href="https://instagram.com/azfinestmixtape"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-navy font-semibold hover:text-red transition-colors rounded ${FOCUS_RING}`}
                  >
                    @azfinestmixtape
                  </a>
                </p>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* EMAIL SIGNUP */}
      <section
        className="relative py-12 lg:py-20 bg-navy overflow-hidden"
        aria-label="Email signup"
      >
        <Image
          src="/images/hero-bg-texture.jpg"
          alt=""
          fill
          sizes="100vw"
          loading="lazy"
          className="object-cover object-center opacity-[0.05]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(204,0,0,0.08),transparent_60%)]" aria-hidden="true" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <EmailSignup variant="dark" />
          </AnimateIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-12 bg-red" aria-labelledby="final-cta-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h2
                id="final-cta-heading"
                className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-white font-[var(--font-chakra)]"
              >
                Ready to Compete?
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Register your team for the next OFF SZN HOOPS tournament.
              </p>
            </div>
            <a
              href="https://inspirecourts.leagueapps.com/tournaments"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 bg-white hover:bg-off-white text-red px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors flex-shrink-0 font-[var(--font-chakra)] ${FOCUS_RING_ON_DARK.replace("focus-visible:ring-offset-navy", "focus-visible:ring-offset-red")}`}
            >
              Register Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <QuickContactBar subject="General" label="Questions?" />
      <BackToTop />
      <div className="h-32 lg:hidden" aria-hidden="true" />
    </>
  );
}
