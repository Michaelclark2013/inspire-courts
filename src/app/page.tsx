import type { Metadata } from "next";
import { FACILITY_EMAIL, SOCIAL_LINKS } from "@/lib/constants";
import { getPageContent, getField, getList } from "@/lib/content";
import Link from "next/link";
import RegisterLink from "@/components/ui/RegisterLink";
import Image from "next/image";
import {
  ArrowRight,
  Tv,
  Video,
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
import dynamic from "next/dynamic";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
const EmailSignup = dynamic(() => import("@/components/ui/EmailSignup"));

export const metadata: Metadata = {
  title: "Inspire Courts AZ | Indoor Basketball & Volleyball Facility in Gilbert, Arizona",
  description:
    "Arizona's premier indoor basketball & volleyball facility. 7 courts, game film available at tournaments. Home of OFF SZN HOOPS tournaments in Gilbert, AZ.",
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
    "Arizona's premier indoor basketball & volleyball facility. 7 regulation courts, game film available at tournaments. Home of OFF SZN HOOPS youth basketball tournaments.",
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

const FEATURE_ICONS = [Trophy, Video, UtensilsCrossed, Wifi];

const FALLBACK_FEATURES = [
  { title: "7 Indoor Courts", desc: "Regulation hardwood floors, professional dimensions, adjustable hoops for all age groups." },
  { title: "Game Film", desc: "Professional game film available as a paid add-on at tournaments. Review footage and improve." },
  { title: "Snack Bar", desc: "Drinks, snacks, and game-day fuel available all day. No outside food or beverages permitted." },
  { title: "Climate Controlled", desc: "Fully air-conditioned, 52,000 sq ft facility. No Arizona heat — play in comfort year-round." },
];

const VALUE_PROP_ICONS = [Shield, Zap, Users];

const FALLBACK_VALUE_PROPS = [
  { title: "Pro-Level Setup", desc: "College-quality courts and a pro-level environment — not a rec gym." },
  { title: "Year-Round Action", desc: "Tournaments, leagues, and open runs every month. Never an off season." },
  { title: "Real Competition", desc: "500+ teams hosted. The best youth players in Arizona compete here." },
];

export default function Home() {
  const page = getPageContent("home");
  const valueProps = page ? getList(page, "Value Props") : [];
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
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-navy" />
        {/* Subtle red glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.15),transparent_60%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-8 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
            {page ? getField(page, "Hero", "badge") : "Est. Gilbert, AZ"}
          </span>

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
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              {page ? getField(page, "Hero", "subheadline") : "7 courts. 52,000 sq ft. Basketball & volleyball. Built for competitors."}
            </p>
          </AnimateIn>

          <AnimateIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <RegisterLink
                href={SOCIAL_LINKS.leagueapps}
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
              >
                {page ? getField(page, "Hero", "ctaPrimary") : "Register for Next Event"}{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </RegisterLink>
              <Link
                href="/facility"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] font-[var(--font-chakra)]"
              >
                {page ? getField(page, "Hero", "ctaSecondary") : "Book the Facility"}{" "}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wide">
                {page ? getField(page, "Event Bar", "text") : "OFF SZN HOOPS — Tournaments Running Year-Round"}
              </span>
            </div>
            <RegisterLink
              href={SOCIAL_LINKS.leagueapps}
              className="group flex items-center gap-2 bg-white text-red px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide hover:bg-off-white transition-colors font-[var(--font-chakra)]"
            >
              {page ? getField(page, "Event Bar", "buttonText") : "Register Now"}{" "}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </RegisterLink>
          </div>
        </div>
      </section>

      {/* ── WHY INSPIRE COURTS (3 value props) ── */}
      <section className="py-16 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Why Inspire Courts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y divide-white/10 md:divide-y-0 md:divide-x md:divide-white/10">
            {VALUE_PROP_ICONS.map((Icon, i) => {
              const item = valueProps[i];
              const title = item?.title || FALLBACK_VALUE_PROPS[i].title;
              const desc = item?.description || FALLBACK_VALUE_PROPS[i].desc;
              return (
                <AnimateIn key={title} delay={i * 100}>
                  <div className="flex items-start gap-4 px-4 sm:px-8 py-6 md:py-0">
                    <div className="w-12 h-12 bg-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-red" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm uppercase tracking-tight font-[var(--font-chakra)] mb-1">
                        {title}
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FACILITY FEATURES ── */}
      <section className="py-14 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={page ? getField(page, "Facility Features", "eyebrow") : "The Facility"}
            title={page ? getField(page, "Facility Features", "headline") : "Built for Competitors"}
            description={page ? getField(page, "Facility Features", "description") : "Professional-grade courts, technology, and amenities designed for serious athletes."}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {FEATURE_ICONS.map((Icon, i) => {
              const item = features[i];
              const title = item?.title || FALLBACK_FEATURES[i].title;
              const desc = item?.description || FALLBACK_FEATURES[i].desc;
              return (
                <AnimateIn key={title} delay={i * 80}>
                  <div className="group relative bg-white border border-light-gray rounded-2xl p-8 lg:p-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden h-full">
                    {/* Red accent stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 bg-gradient-to-br from-navy to-navy-dark rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                      <Icon className="w-7 h-7 text-white" />
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

      {/* ── PARALLAX MISSION ── */}
      <section
        className="relative py-20 lg:py-44 bg-scroll md:bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero-bg-texture.jpg')" }}
      >
        <div className="absolute inset-0 bg-navy/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(204,0,0,0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <span className="inline-block bg-red/20 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 font-[var(--font-chakra)] border border-red/30">
              Our Mission
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] leading-[0.95]">
              {page ? getField(page, "Mission Section", "headline") : "Elevating Youth Sports in Arizona"}
            </h2>
            <p className="text-white/75 text-lg lg:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
              {page ? getField(page, "Mission Section", "description") : "We built something Arizona was missing — a facility where young athletes train, compete, and grow in a pro-level environment year-round."}
            </p>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
            >
              {page ? getField(page, "Mission Section", "buttonText") : "Our Story"}{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── DUAL BRAND CARDS ── */}
      <section className="py-14 lg:py-32 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The Brands"
            title="Two Brands. One Mission."
            description="Inspire Courts is the home base. OFF SZN HOOPS is the tournament series. Together, we're elevating youth sports in Arizona."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* Inspire Courts card */}
            <AnimateIn>
              <div className="relative bg-navy rounded-3xl p-10 lg:p-14 h-full flex flex-col text-white overflow-hidden group hover:shadow-2xl transition-shadow">
                {/* Background pattern */}
                <div
                  className="absolute inset-0 opacity-[0.07] bg-cover bg-center"
                  style={{ backgroundImage: "url('/images/hero-bg-texture.jpg')" }}
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
                    The home base. 7 regulation indoor courts — basketball and
                    volleyball — with a pro-level setup and game film available
                    at tournaments. Available for leagues, practices, camps,
                    clinics, and private events.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-10">
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


      {/* ── LOCATION + CTA ── */}
      <section className="py-14 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                </div>

                <p className="text-text-muted leading-relaxed mb-8">
                  {page ? getField(page, "Location", "description") : "Follow us on Instagram for game highlights, tournament recaps, and behind-the-scenes content."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://instagram.com/inspirecourts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-dark text-white px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all font-[var(--font-chakra)] shadow-md"
                  >
                    @inspirecourts{" "}
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
      <section className="relative py-14 lg:py-28 bg-navy overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05] bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg-texture.jpg')" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(204,0,0,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <EmailSignup variant="dark" />
          </AnimateIn>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-16 lg:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg-texture.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 to-navy/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(204,0,0,0.15),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] leading-[0.95]">
              Ready to{" "}
              <span className="text-red">Compete</span>?
            </h2>
            {/* CMS headline available at: getField(page, "Final CTA", "headline") */}
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              {page ? getField(page, "Final CTA", "description") : "Register your team for the next OFF SZN HOOPS tournament. Spots fill fast."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <RegisterLink
                href={SOCIAL_LINKS.leagueapps}
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
              >
                {page ? getField(page, "Final CTA", "ctaPrimary") : "Register Now"}{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </RegisterLink>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] font-[var(--font-chakra)]"
              >
                {page ? getField(page, "Final CTA", "ctaSecondary") : "Contact Us"}{" "}
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
