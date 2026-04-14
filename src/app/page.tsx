import type { Metadata } from "next";
import { FACILITY_EMAIL, FACILITY_PHONE } from "@/lib/constants";
import { getPageContent, getField, getList } from "@/lib/content";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Video,
  UtensilsCrossed,
  Trophy,
  MapPin,
  Zap,
  Thermometer,
  Phone,
  Star,
  LayoutGrid,
  Snowflake,
  CalendarDays,
  Tv,
} from "lucide-react";
import dynamic from "next/dynamic";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import VideoShowcase from "@/components/ui/VideoShowcase";
import BackToTop from "@/components/ui/BackToTop";
import QuickContactBar from "@/components/ui/QuickContactBar";
const EmailSignup = dynamic(() => import("@/components/ui/EmailSignup"));

export const metadata: Metadata = {
  title: "Inspire Courts AZ | Indoor Basketball & Volleyball Facility in Gilbert, Arizona",
  description:
    "Arizona's premier indoor basketball & volleyball facility. 7 courts, game film available at tournaments. Home of OFF SZN HOOPS tournaments in Gilbert, AZ.",
  alternates: {
    canonical: "https://inspirecourtsaz.com",
  },
  openGraph: {
    title: "Inspire Courts AZ | Indoor Basketball & Volleyball Facility",
    description: "Arizona's premier indoor basketball & volleyball facility. 7 courts, game film, tournaments. Gilbert, AZ.",
    url: "https://inspirecourtsaz.com",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Courts AZ indoor basketball facility in Gilbert, Arizona" }],
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
    latitude: 33.3528,
    longitude: -111.7897,
  },
  sameAs: [
    "https://www.instagram.com/inspirecourts",
    "https://www.youtube.com/@AZFinestMixtape",
  ],
  sport: ["Basketball", "Volleyball"],
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Indoor Courts", value: true },
    { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
    { "@type": "LocationFeatureSpecification", name: "Game Film", value: true },
    { "@type": "LocationFeatureSpecification", name: "Snack Bar", value: true },
  ],
};

const FEATURE_ICONS = [Trophy, Video, UtensilsCrossed, Thermometer];

const FALLBACK_FEATURES = [
  { title: "7 Indoor Courts", desc: "Regulation hardwood floors, professional dimensions, adjustable hoops for all age groups." },
  { title: "Game Film", desc: "Professional game film available as a paid add-on at tournaments. Review footage and improve." },
  { title: "Snack Bar", desc: "Drinks, snacks, and game-day fuel available all day. No outside food or beverages permitted." },
  { title: "Climate Controlled", desc: "Fully air-conditioned, 52,000 sq ft facility. No Arizona heat — play in comfort year-round." },
];

const TESTIMONIALS = [
  {
    quote:
      "Best tournament facility in Arizona. We bring our teams here every season — the courts, the game film, and the staff make it a first-class experience.",
    name: "Coach D. Rivera",
    role: "AAU Head Coach",
  },
  {
    quote:
      "We rented three courts for our corporate team-building day and it could not have gone smoother. The facility is immaculate and the booking process was easy.",
    name: "Sarah M.",
    role: "Corporate Event Organizer",
  },
  {
    quote:
      "Our club runs weekly practices at Inspire Courts. The air conditioning alone makes it worth it — our kids actually want to practice here.",
    name: "Marcus T.",
    role: "Youth Basketball Club Director",
  },
];

export default function Home() {
  const page = getPageContent("home");
  const features = page ? getList(page, "Facility Features") : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* ── HERO ── */}
      <section className="relative min-h-[85dvh] md:min-h-[100dvh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-bg.jpg"
          alt="Indoor basketball courts at Inspire Courts in Gilbert, Arizona"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-navy" />
        {/* Subtle red glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.15),transparent_60%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="heading-hero font-bold uppercase tracking-tight text-white leading-[0.9] mb-8 font-[var(--font-chakra)] drop-shadow-[2px_4px_16px_rgba(0,0,0,0.5)]">
            Arizona&apos;s Premier
            <br />
            <span className="text-red drop-shadow-[0_0_30px_rgba(204,0,0,0.3)]">
              Basketball &amp; Volleyball
            </span>
            <br />
            Facility
          </h1>

          <AnimateIn delay={200}>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
              {page ? getField(page, "Hero", "subheadline") : "7 courts. 52,000 sq ft. Basketball & volleyball. Built for competitors."}
            </p>
          </AnimateIn>

          <AnimateIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://inspirecourts.leagueapps.com/tournaments"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
              >
                {page ? getField(page, "Hero", "ctaPrimary") : "Register for Next Event"}{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                href="/facility"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] font-[var(--font-chakra)]"
              >
                {page ? getField(page, "Hero", "ctaSecondary") : "Book the Facility"}{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </AnimateIn>

        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-navy border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { icon: Trophy, label: "7 Courts" },
              { icon: LayoutGrid, label: "52,000 Sq Ft" },
              { icon: Tv, label: "Game Film" },
              { icon: Snowflake, label: "Air-Conditioned" },
              { icon: CalendarDays, label: "Year-Round" },
            ].map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                className={`flex items-center justify-center gap-2.5 py-5 px-4 text-white/80 ${
                  i < 4 ? "border-r border-white/10" : ""
                } ${i >= 3 ? "hidden sm:flex" : ""} ${i >= 2 ? "border-t border-white/10 sm:border-t-0" : ""}`}
              >
                <Icon className="w-4 h-4 text-red flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold font-[var(--font-chakra)] uppercase tracking-wide whitespace-nowrap">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK NAV ── */}
      <section className="py-10 lg:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { href: "/training", title: "Private Training", desc: "1-on-1 and small group sessions", icon: "Target" },
              { href: "/teams", title: "Team Inspire", desc: "Club basketball on MADE Hoops", icon: "Users" },
              { href: "/prep", title: "Inspire Prep", desc: "Basketball prep school program", icon: "GraduationCap" },
              { href: "https://inspirecourts.leagueapps.com/tournaments", title: "Tournaments", desc: "Register for OFF SZN HOOPS", icon: "Trophy", external: true },
            ].map((item, i) => (
              <AnimateIn key={item.title} delay={i * 80}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col bg-off-white border border-light-gray rounded-2xl p-5 lg:p-6 hover:border-red/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full"
                  >
                    <h3 className="text-navy font-[var(--font-chakra)] font-bold text-sm lg:text-base uppercase tracking-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-text-muted text-xs lg:text-sm leading-relaxed flex-1">
                      {item.desc}
                    </p>
                    <ArrowRight className="w-4 h-4 text-red mt-3 group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="group flex flex-col bg-off-white border border-light-gray rounded-2xl p-5 lg:p-6 hover:border-red/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full"
                  >
                    <h3 className="text-navy font-[var(--font-chakra)] font-bold text-sm lg:text-base uppercase tracking-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-text-muted text-xs lg:text-sm leading-relaxed flex-1">
                      {item.desc}
                    </p>
                    <ArrowRight className="w-4 h-4 text-red mt-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── JALEN WILLIAMS FEATURE ── */}
      <section className="py-14 lg:py-20 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimateIn>
              <div>
                <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
                  Homegrown Talent
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-navy mb-6 font-[var(--font-chakra)] leading-[0.95]">
                  <span className="text-red">Jalen Williams</span> Grew Up Here
                </h2>
                <p className="text-text-muted text-lg leading-relaxed mb-6">
                  OKC Thunder guard Jalen Williams grew up training at Inspire Courts in Gilbert, AZ. From our gym to the NBA — this is where it starts.
                </p>
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2 text-red font-bold text-sm uppercase tracking-wide hover:text-navy transition-colors font-[var(--font-chakra)]"
                >
                  Our Story
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </AnimateIn>
            <AnimateIn delay={150}>
              <div className="flex justify-center">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-light-gray" style={{ width: "100%", maxWidth: "340px", aspectRatio: "9/16" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/hLGrKauJzLc?rel=0&modestbranding=1"
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

      {/* ── FACILITY FEATURES ── */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={page ? getField(page, "Facility Features", "eyebrow") : "The Facility"}
            title={page ? getField(page, "Facility Features", "headline") : "Built for Competitors"}
            description={page ? getField(page, "Facility Features", "description") : "Professional-grade courts, technology, and amenities designed for serious athletes."}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {FEATURE_ICONS.map((Icon, i) => {
              const item = features[i];
              const title = item?.title || FALLBACK_FEATURES[i].title;
              const desc = item?.description || FALLBACK_FEATURES[i].desc;
              return (
                <AnimateIn key={title} delay={i * 80}>
                  <div className="group relative bg-white border border-light-gray rounded-2xl p-6 sm:p-8 lg:p-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden h-full">
                    {/* Red accent stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-navy to-navy-dark rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                      <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-navy font-[var(--font-chakra)] font-semibold text-lg lg:text-xl uppercase tracking-tight mb-3">
                      {title}
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 lg:py-20 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="What People Say"
            title="Trusted by Teams Across Arizona"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <AnimateIn key={name}>
                <div className="bg-white border border-light-gray rounded-xl p-7 flex flex-col gap-4 h-full">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-red text-red" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-text-muted leading-relaxed text-sm flex-1">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-navy font-bold text-sm font-[var(--font-chakra)] uppercase tracking-wide">
                      {name}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">{role}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── DUAL BRAND CARDS ── */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Our Mission"
            title={page ? getField(page, "Mission Section", "headline") || "Two Brands. One Mission." : "Two Brands. One Mission."}
            description={page ? getField(page, "Mission Section", "description") || "Inspire Courts is the home base. OFF SZN HOOPS is the tournament series. Together, we're elevating youth sports in Arizona." : "Inspire Courts is the home base. OFF SZN HOOPS is the tournament series. Together, we're elevating youth sports in Arizona."}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* Inspire Courts card */}
            <AnimateIn>
              <div className="relative bg-navy rounded-3xl p-6 sm:p-10 lg:p-14 h-full flex flex-col text-white overflow-hidden group hover:shadow-2xl transition-shadow">
                {/* Background pattern */}
                <Image src="/images/hero-bg-texture.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-center opacity-[0.07]" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-6 sm:mb-8">
                    <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={96} height={96} className="object-contain" />
                  </div>
                  <span className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-2">
                    The Facility
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-semibold uppercase tracking-tight mb-5 font-[var(--font-chakra)] leading-[0.95]">
                    Inspire Courts
                  </h3>
                  <p className="text-white/75 leading-relaxed mb-6 sm:mb-8 flex-1 text-base">
                    The home base. 7 regulation indoor courts — basketball and
                    volleyball — with a pro-level setup and game film available
                    at tournaments. Available for leagues, practices, camps,
                    clinics, and private events.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6 sm:mb-10">
                    {["7 Courts", "Game Film", "Rentals"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-white/15 border border-white/25 text-white px-4 py-1.5 rounded-full font-semibold"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                  <Link
                    href="/facility"
                    className="group/btn inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-4.5 rounded-full font-bold text-sm uppercase tracking-wide transition-all self-start font-[var(--font-chakra)] shadow-[0_4px_24px_rgba(204,0,0,0.4)] hover:scale-[1.03]"
                  >
                    Explore the Facility{" "}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </AnimateIn>

            {/* OFF SZN card */}
            <AnimateIn delay={150}>
              <div className="relative bg-white border-2 border-light-gray rounded-3xl p-6 sm:p-10 lg:p-14 h-full flex flex-col overflow-hidden group hover:border-red/40 hover:shadow-2xl transition-all">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-navy rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 shadow-lg">
                    <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-red" />
                  </div>
                  <span className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-2">
                    The Tournament Series
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-semibold uppercase tracking-tight text-navy mb-5 font-[var(--font-chakra)] leading-[0.95]">
                    OFF SZN HOOPS
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-6 sm:mb-8 flex-1 text-base">
                    Compete at the highest level. Year-round youth basketball
                    tournaments with 10U through 17U divisions, boys and girls.
                    Get ranked. Get seen. Get better.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6 sm:mb-10">
                    {["10U–17U", "Boys & Girls", "3+ Games", "Ranked"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-navy/5 border border-navy/15 text-navy px-4 py-1.5 rounded-full font-semibold"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                  <Link
                    href="/tournaments"
                    className="group/btn inline-flex items-center gap-2 bg-navy hover:bg-navy-dark text-white px-10 py-4.5 rounded-full font-bold text-sm uppercase tracking-wide transition-all self-start font-[var(--font-chakra)] shadow-lg hover:scale-[1.03]"
                  >
                    Browse Tournaments{" "}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── VIDEO SHOWCASE ── */}
      <section className="py-14 lg:py-20 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="On the Map"
            title="Homegrown Talent"
            description="From NBA players to rising prep stars — Inspire Courts is where Arizona basketball happens."
            dark
          />
          <VideoShowcase
            videos={[
              { id: "hLGrKauJzLc", title: "Jalen Williams grew up at Inspire Courts", name: "Jalen Williams", subtitle: "NBA — OKC Thunder", aspect: "9/16" },
              { id: "zYIBPJeUjGU", title: "Marvin Bagley III at Inspire Courts", name: "Marvin Bagley III", subtitle: "NBA — 8th Grade at Inspire" },
              { id: "FmcgFmICrf4", title: "Koa Peat training at Inspire Courts", name: "Koa Peat", subtitle: "#1 Recruit · Training at Inspire" },
              { id: "S8HgOlyWnDg", title: "Cody Williams training at Inspire Courts", name: "Cody Williams", subtitle: "NBA · Training at Inspire" },
              { id: "ENl-hXQbEo8", title: "Thompson Twins playing for Team Inspire", name: "Thompson Twins", subtitle: "NBA · Team Inspire Alumni" },
              { id: "HkiDY_bwRVw", title: "Saben Lee training at Inspire Courts", name: "Saben Lee", subtitle: "NBA — Training at Inspire" },
            ]}
            initialCount={4}
            theme="dark"
          />
        </div>
      </section>

      {/* ── LOCATION + CTA ── */}
      <section className="py-12 lg:py-20 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateIn>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-light-gray aspect-video lg:aspect-[4/3]">
                <iframe
                  src="https://maps.google.com/maps?q=1090+N+Fiesta+Blvd+Ste+101+%26+102+Gilbert+AZ+85233&output=embed&z=16"
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
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-8 font-[var(--font-chakra)]">
                  {page ? getField(page, "Location", "headline") : "Come See It Live"}
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-red" />
                    </div>
                    <div>
                      <p className="font-bold text-navy">
                        {page ? getField(page, "Location", "address") : "1090 N Fiesta Blvd, Ste 101 & 102"}
                      </p>
                      <p className="text-text-muted text-sm">
                        {page ? getField(page, "Location", "city") : "Gilbert, AZ 85233"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-red" />
                    </div>
                    <div>
                      <a href={`tel:${FACILITY_PHONE.replace(/\D/g, "")}`} className="font-bold text-navy hover:text-red transition-colors">{FACILITY_PHONE}</a>
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
                    className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all font-[var(--font-chakra)] shadow-md"
                  >
                    Get Directions{" "}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
                <p className="text-text-muted text-sm">
                  Follow us:{" "}
                  <a href="https://instagram.com/inspirecourts" target="_blank" rel="noopener noreferrer" className="text-navy font-semibold hover:text-red transition-colors">@inspirecourts</a>
                  {" · "}
                  <a href="https://instagram.com/azfinestmixtape" target="_blank" rel="noopener noreferrer" className="text-navy font-semibold hover:text-red transition-colors">@azfinestmixtape</a>
                </p>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── EMAIL SIGNUP ── */}
      <section className="relative py-12 lg:py-20 bg-navy overflow-hidden">
        <Image src="/images/hero-bg-texture.jpg" alt="" fill sizes="100vw" className="object-cover object-center opacity-[0.05]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(204,0,0,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <EmailSignup variant="dark" />
          </AnimateIn>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-12 bg-red">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-white font-[var(--font-chakra)]">
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
              className="inline-flex items-center gap-2 bg-white hover:bg-off-white text-red px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors flex-shrink-0 font-[var(--font-chakra)]"
            >
              Register Now <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <QuickContactBar subject="General" label="Questions?" />
      <BackToTop />
      <div className="h-28 lg:hidden" />
    </>
  );
}
