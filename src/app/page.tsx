import type { Metadata } from "next";
import { FACILITY_EMAIL, SOCIAL_LINKS } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Tv,
  Video,
  BarChart3,
  UtensilsCrossed,
  Trophy,
  MapPin,
  Calendar,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  Wifi,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import EmailSignup from "@/components/ui/EmailSignup";

export const metadata: Metadata = {
  title: "Inspire Courts AZ | Indoor Basketball Facility & Tournaments in Gilbert, Arizona",
  description:
    "Arizona's premier indoor basketball facility. 7 courts, live digital scoreboards, game film every game. Home of OFF SZN HOOPS tournaments in Gilbert, AZ.",
  alternates: {
    canonical: "https://inspirecourtsaz.com",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  "@id": "https://inspirecourtsaz.com",
  name: "Inspire Courts AZ",
  description:
    "Arizona's premier indoor basketball facility. 7 regulation courts, live digital scoreboards, game film every game. Home of OFF SZN HOOPS youth basketball tournaments.",
  url: "https://inspirecourtsaz.com",
  email: FACILITY_EMAIL,
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
    "https://www.instagram.com/inspirecourtsaz",
    "https://www.youtube.com/@AZFinestMixtape",
  ],
  sport: "Basketball",
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Indoor Courts", value: true },
    { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
    { "@type": "LocationFeatureSpecification", name: "Digital Scoreboards", value: true },
    { "@type": "LocationFeatureSpecification", name: "Game Film", value: true },
    { "@type": "LocationFeatureSpecification", name: "Snack Bar", value: true },
  ],
};

const FACILITY_FEATURES = [
  {
    icon: Trophy,
    title: "7 Indoor Courts",
    desc: "Regulation hardwood floors, professional dimensions, adjustable hoops for all age groups.",
  },
  {
    icon: Tv,
    title: "Live Scoreboards",
    desc: "Digital scoreboards visible from every seat. Real-time scores, period tracking, shot clocks.",
  },
  {
    icon: Video,
    title: "Game Film",
    desc: "Every game filmed, every play captured. Teams get footage to review and improve.",
  },
  {
    icon: BarChart3,
    title: "Stats & Analytics",
    desc: "Real-time stats tracking for every game. Points, rebounds, assists — all on record.",
  },
  {
    icon: UtensilsCrossed,
    title: "Snack Bar",
    desc: "Drinks, snacks, and game-day fuel available all day. No outside food or beverages permitted.",
  },
  {
    icon: Wifi,
    title: "Climate Controlled",
    desc: "Fully air-conditioned year-round. No Arizona heat, no excuses. Play in comfort every game.",
  },
];

const WHY_INSPIRE = [
  {
    icon: Shield,
    title: "Pro-Level Setup",
    desc: "College-quality courts, scoreboards, and game film — not a rec gym.",
  },
  {
    icon: Zap,
    title: "Year-Round Action",
    desc: "Tournaments, leagues, and open runs every month. Never an off season.",
  },
  {
    icon: Users,
    title: "Real Competition",
    desc: "500+ teams hosted. The best youth players in Arizona compete here.",
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* ── HERO ── */}
      <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-navy" />
        {/* Subtle red glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.15),transparent_60%)]" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <AnimateIn>
            <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-8 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
              Est. Gilbert, AZ
            </span>
          </AnimateIn>

          <AnimateIn delay={100}>
            <h1 className="heading-hero font-bold uppercase tracking-tight text-white leading-[0.9] mb-8 font-[var(--font-chakra)] drop-shadow-[2px_4px_16px_rgba(0,0,0,0.5)]">
              Arizona&apos;s Premier
              <br />
              <span className="text-red drop-shadow-[0_0_30px_rgba(204,0,0,0.3)]">
                Indoor Basketball
              </span>
              <br />
              Facility
            </h1>
          </AnimateIn>

          <AnimateIn delay={200}>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              7 courts. 52,000 sq ft. Arizona&apos;s premier basketball facility.
            </p>
          </AnimateIn>

          <AnimateIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={SOCIAL_LINKS.leagueapps}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
              >
                Register for Next Event{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                href="/facility"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] font-[var(--font-chakra)]"
              >
                Book the Facility{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </AnimateIn>

          {/* Scroll indicator */}
          <AnimateIn delay={500}>
            <div className="mt-16 animate-bounce">
              <div className="w-6 h-10 border-2 border-white/40 rounded-full mx-auto flex justify-center">
                <div className="w-1.5 h-3 bg-white/60 rounded-full mt-2" />
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── EVENT CALLOUT BAR ── */}
      <section className="bg-red py-5 shadow-[0_4px_20px_rgba(204,0,0,0.3)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wide">
                OFF SZN HOOPS — Tournaments Running Year-Round
              </span>
            </div>
            <a
              href={SOCIAL_LINKS.leagueapps}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 bg-white text-red px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide hover:bg-off-white transition-colors font-[var(--font-chakra)]"
            >
              Register Now{" "}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ── WHY INSPIRE COURTS (3 value props) ── */}
      <section className="py-16 bg-navy">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Why Inspire Courts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y divide-white/10 md:divide-y-0 md:divide-x md:divide-white/10">
            {WHY_INSPIRE.map((item, i) => (
              <AnimateIn key={item.title} delay={i * 100}>
                <div className="flex items-start gap-4 px-4 sm:px-8 py-6 md:py-0">
                  <div className="w-12 h-12 bg-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-red" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-tight font-[var(--font-chakra)] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FACILITY FEATURES ── */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The Facility"
            title="Built for Competitors"
            description="Professional-grade courts, technology, and amenities designed for serious athletes."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {FACILITY_FEATURES.map((feature, i) => (
              <AnimateIn key={feature.title} delay={i * 80}>
                <div className="group relative bg-white border border-light-gray rounded-2xl p-8 lg:p-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden h-full">
                  {/* Red accent stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 bg-gradient-to-br from-navy to-navy-dark rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-navy font-[var(--font-chakra)] font-semibold text-lg lg:text-xl uppercase tracking-tight mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARALLAX MISSION ── */}
      <section
        className="relative py-32 lg:py-44 bg-scroll md:bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-navy/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(204,0,0,0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <span className="inline-block bg-red/20 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 font-[var(--font-chakra)] border border-red/30">
              Our Mission
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] leading-[0.95]">
              Two Brands.
              <br />
              One Mission.
            </h2>
            <p className="text-white/75 text-lg lg:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
              Inspire Courts is the home base. OFF SZN HOOPS is the tournament
              series. Together, we&apos;re elevating youth basketball in Arizona.
            </p>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
            >
              Our Story{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── DUAL BRAND CARDS ── */}
      <section className="py-20 lg:py-32 bg-off-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The Brands"
            title="Two Brands. One Mission."
            description="Inspire Courts is the home base. OFF SZN HOOPS is the tournament series. Together, we're elevating youth basketball in Arizona."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* Inspire Courts card */}
            <AnimateIn>
              <div className="relative bg-navy rounded-3xl p-10 lg:p-14 h-full flex flex-col text-white overflow-hidden group hover:shadow-2xl transition-shadow">
                {/* Background pattern */}
                <div
                  className="absolute inset-0 opacity-[0.07] bg-cover bg-center"
                  style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
                />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-8">
                    <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={96} height={96} className="object-contain" />
                  </div>
                  <span className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-2">
                    The Facility
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-semibold uppercase tracking-tight mb-5 font-[var(--font-chakra)] leading-[0.95]">
                    Inspire Courts
                  </h3>
                  <p className="text-white/75 leading-relaxed mb-8 flex-1 text-base">
                    The home base. Two regulation indoor courts with live
                    scoreboards, game film, and a pro-level setup. Available for
                    leagues, practices, camps, clinics, and private events.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-10">
                    {["7 Courts", "Game Film", "Scoreboards", "Rentals"].map(
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
              <div className="relative bg-white border-2 border-light-gray rounded-3xl p-10 lg:p-14 h-full flex flex-col overflow-hidden group hover:border-red/40 hover:shadow-2xl transition-all">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                    <Zap className="w-7 h-7 text-red" />
                  </div>
                  <span className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-2">
                    The Tournament Series
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-semibold uppercase tracking-tight text-navy mb-5 font-[var(--font-chakra)] leading-[0.95]">
                    OFF SZN HOOPS
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-8 flex-1 text-base">
                    Compete at the highest level. Year-round youth basketball
                    tournaments with 10U through 17U divisions, boys and girls.
                    Get ranked. Get seen. Get better.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-10">
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
                    href="/events"
                    className="group/btn inline-flex items-center gap-2 bg-navy hover:bg-navy-dark text-white px-10 py-4.5 rounded-full font-bold text-sm uppercase tracking-wide transition-all self-start font-[var(--font-chakra)] shadow-lg hover:scale-[1.03]"
                  >
                    See Upcoming Events{" "}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="relative py-24 lg:py-32 bg-navy overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(204,0,0,0.1),transparent_60%)]" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
            {[
              { num: "500+", label: "Teams Hosted" },
              { num: "30+", label: "Tournaments" },
              { num: "5,000+", label: "Players" },
              { num: "100%", label: "Game Film Coverage" },
            ].map((stat, i) => (
              <AnimateIn key={stat.label} delay={i * 100}>
                <div className="text-center">
                  <div className="stats-number font-bold text-red font-[var(--font-chakra)] leading-none drop-shadow-[0_0_30px_rgba(204,0,0,0.25)]">
                    {stat.num}
                  </div>
                  <div className="text-xs md:text-sm text-white/80 uppercase tracking-[0.2em] mt-4 font-semibold font-[var(--font-chakra)]">
                    {stat.label}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>


      {/* ── LOCATION + CTA ── */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateIn>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-light-gray aspect-[4/3]">
                <iframe
                  src="https://maps.google.com/maps?q=1090+N+Fiesta+Blvd+Ste+101+%26+102+Gilbert+AZ+85233&output=embed&z=16"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Inspire Courts AZ Location"
                />
              </div>
            </AnimateIn>

            <AnimateIn delay={200}>
              <div>
                <p className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-3">
                  Visit Us
                </p>
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-8 font-[var(--font-chakra)]">
                  Come See It Live
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-red" />
                    </div>
                    <div>
                      <p className="font-bold text-navy">
                        1090 N Fiesta Blvd, Ste 101 & 102
                      </p>
                      <p className="text-text-muted text-sm">
                        Gilbert, AZ 85233
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-text-muted leading-relaxed mb-8">
                  Follow us on Instagram for game highlights, tournament recaps,
                  and behind-the-scenes content.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://instagram.com/inspirecourtsaz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-dark text-white px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all font-[var(--font-chakra)] shadow-md"
                  >
                    @inspirecourtsaz{" "}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a
                    href="https://instagram.com/azfinestmixtape"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-2 bg-white border-2 border-navy/20 hover:border-red text-navy px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all font-[var(--font-chakra)]"
                  >
                    @azfinestmixtape{" "}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── EMAIL SIGNUP ── */}
      <section className="relative py-20 lg:py-28 bg-navy overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05] bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(204,0,0,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <EmailSignup variant="dark" />
          </AnimateIn>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 to-navy/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(204,0,0,0.15),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] leading-[0.95]">
              Ready to{" "}
              <span className="text-red">Compete</span>?
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              Register your team for the next OFF SZN HOOPS tournament. Spots
              fill fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={SOCIAL_LINKS.leagueapps}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
              >
                Register Now{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] font-[var(--font-chakra)]"
              >
                Contact Us{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
