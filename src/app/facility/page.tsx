import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Tv,
  Snowflake,
  UtensilsCrossed,
  Trophy,
  MapPin,
  Clock,
  Phone,
  Users,
  CalendarDays,
  Star,
  Wifi,
  Car,
  Zap,
  LayoutGrid,
  Dumbbell,
  PartyPopper,
  Volleyball,
  CheckCircle2,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import BackToTop from "@/components/ui/BackToTop";
import { getPageContent, getField, getList } from "@/lib/content";
import { FACILITY_ADDRESS, FACILITY_PHONE, FACILITY_EMAIL, SOCIAL_LINKS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Indoor Court Rental Gilbert AZ | Inspire Courts",
  description:
    "Professional indoor basketball & volleyball court rental in Gilbert, AZ. 7 courts, climate-controlled. Book for leagues, practices, and events. $80/court/hour.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/facility",
  },
  openGraph: {
    images: [
      {
        url: "https://inspirecourtsaz.com/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Inspire Courts AZ – Indoor basketball & volleyball facility in Gilbert, AZ",
      },
    ],
  },
};

const FEATURES = [
  {
    icon: Trophy,
    title: "7 Regulation Courts",
    desc: "Professional hardwood, adjustable hoops, and college-regulation dimensions. 5 courts with possession arrows.",
  },
  {
    icon: Tv,
    title: "Game Film Available",
    desc: "Professional game film available at tournaments. Build recruiting portfolios with quality footage.",
  },
  {
    icon: Snowflake,
    title: "Fully Air-Conditioned",
    desc: "Climate-controlled year-round. No Arizona heat — play in comfort every season.",
  },
  {
    icon: UtensilsCrossed,
    title: "On-Site Concessions",
    desc: "Full snack bar with drinks and food. Fuel up without leaving the building.",
  },
  {
    icon: LayoutGrid,
    title: "52,000 Sq Ft",
    desc: "One of the largest indoor basketball & volleyball facilities in the state.",
  },
  {
    icon: Users,
    title: "Spectator Seating",
    desc: "Bleachers and benches throughout. Comfortable viewing for parents and fans.",
  },
];

const RENTAL_USES = [
  { icon: Trophy, label: "Basketball Leagues" },
  { icon: Volleyball, label: "Volleyball Leagues" },
  { icon: Users, label: "Team Practices" },
  { icon: CalendarDays, label: "Private Tournaments" },
  { icon: Zap, label: "Youth Camps & Clinics" },
  { icon: PartyPopper, label: "Birthday Parties" },
  { icon: Dumbbell, label: "Combines & Workouts" },
  { icon: Star, label: "Corporate Events" },
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

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Inspire Courts AZ",
  url: "https://inspirecourtsaz.com/facility",
  telephone: FACILITY_PHONE,
  address: {
    "@type": "PostalAddress",
    streetAddress: `${FACILITY_ADDRESS.street}, ${FACILITY_ADDRESS.suite}`,
    addressLocality: FACILITY_ADDRESS.city,
    addressRegion: FACILITY_ADDRESS.state,
    postalCode: FACILITY_ADDRESS.zip,
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 33.3825,
    longitude: -111.789,
  },
  openingHours: "Mo-Su 06:00-22:00",
  description:
    "Arizona's premier indoor basketball & volleyball facility. 7 courts and a full concession stand in Gilbert, AZ.",
};

export default function FacilityPage() {
  const page = getPageContent("facility");

  return (
    <>
      {/* LocalBusiness JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* Hero — with booking CTA as the primary focus */}
      <section className="relative min-h-[70vh] lg:min-h-[80vh] flex items-center overflow-hidden">
        <Image src="/images/courts-bg.jpg" alt="Inspire Courts basketball facility interior" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.12),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-28 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 lg:gap-16 items-center">
            {/* Left: headline */}
            <AnimateIn>
              <div>
                <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
                  {page ? getField(page, "Hero", "badge") : "52,000 Sq Ft • 7 Courts"}
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg leading-[0.9]">
                  Arizona&apos;s Premier
                  <br />
                  <span className="text-red">Indoor Facility</span>
                </h1>
                <p className="text-white/70 text-lg max-w-xl leading-relaxed mb-8">
                  {page
                    ? getField(page, "Hero", "description")
                    : "A premium indoor basketball & volleyball facility built from the ground up for serious competition. Every detail is intentional."}
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red flex-shrink-0" />
                    <span>Gilbert, AZ</span>
                  </div>
                  <a
                    href={`tel:+1${FACILITY_PHONE.replace(/\D/g, "")}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4 text-red flex-shrink-0" />
                    {FACILITY_PHONE}
                  </a>
                </div>
              </div>
            </AnimateIn>

            {/* Right: Book a Court card — immediately visible */}
            <AnimateIn delay={200}>
              <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-red" />
                <div className="text-center mb-6">
                  <h2 className="text-navy font-[var(--font-chakra)] font-bold text-2xl lg:text-3xl uppercase tracking-tight mb-2">
                    Book a Court
                  </h2>
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-red font-[var(--font-chakra)] font-bold text-4xl lg:text-5xl">$80</span>
                    <span className="text-text-muted text-sm">/court/hour</span>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {[
                    "Basketball, volleyball & futsal",
                    "Regulation hardwood courts",
                    "Electronic scoreboards included",
                    "Climate-controlled year-round",
                    "Same-day availability",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-navy text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/book"
                  className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover text-white py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.02] shadow-lg font-[var(--font-chakra)]"
                >
                  Book Now <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-text-muted text-xs text-center mt-4">
                  Or email{" "}
                  <a href={`mailto:${FACILITY_EMAIL}`} className="text-red hover:underline font-medium">
                    {FACILITY_EMAIL}
                  </a>
                </p>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
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
                <Icon className="w-4 h-4 text-red flex-shrink-0" />
                <span className="text-sm font-semibold font-[var(--font-chakra)] uppercase tracking-wide whitespace-nowrap">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid — clean, visual, desktop-optimized */}
      <section className="py-14 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
              The Complex
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-navy font-[var(--font-chakra)] leading-[0.95]">
              Built for Competition
            </h2>
          </div>

          {/* Top row: 2 large featured cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
            {FEATURES.slice(0, 2).map((feature, i) => (
              <AnimateIn key={feature.title} delay={i * 80}>
                <div className="group relative bg-off-white border border-light-gray rounded-2xl p-8 lg:p-10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-5 lg:gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-navy font-[var(--font-chakra)] font-bold text-xl lg:text-2xl uppercase tracking-tight mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-text-muted text-sm lg:text-base leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>

          {/* Bottom row: 4 smaller cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {FEATURES.slice(2).map((feature, i) => (
              <AnimateIn key={feature.title} delay={(i + 2) * 80}>
                <div className="group relative bg-off-white border border-light-gray rounded-2xl p-6 lg:p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-navy font-[var(--font-chakra)] font-bold text-sm lg:text-base uppercase tracking-tight mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted text-xs lg:text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Book a Court — full-width CTA with use cases */}
      <section id="rentals" className="py-16 lg:py-24 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
            {/* Left: CTA */}
            <AnimateIn>
              <div>
                <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
                  Court Rentals
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white mb-2 font-[var(--font-chakra)] leading-[0.95]">
                  {page ? getField(page, "Rental CTA", "headline") : "Your Event,"}
                  <br />
                  <span className="text-red">Our Courts</span>
                </h2>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-white font-[var(--font-chakra)] font-bold text-3xl">$80</span>
                  <span className="text-white/50 text-sm">/court/hour</span>
                </div>
                <p className="text-white/60 leading-relaxed mb-8 max-w-md">
                  {page
                    ? getField(page, "Rental CTA", "description")
                    : "Host your league, practice, or private event at Arizona's premier indoor facility. Basketball, volleyball, and futsal — we've got the court for you."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/book"
                    className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg font-[var(--font-chakra)]"
                  >
                    Book Now <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href={`mailto:${FACILITY_EMAIL}`}
                    className="inline-flex items-center justify-center gap-2 border border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                  >
                    Email Us
                  </a>
                </div>
              </div>
            </AnimateIn>

            {/* Right: Use case grid */}
            <AnimateIn delay={150}>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                {RENTAL_USES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-4 lg:px-5 lg:py-5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-red" />
                    </div>
                    <span className="text-white text-sm font-semibold font-[var(--font-chakra)] uppercase tracking-wide leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Virtual Tour / Parallax */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <Image src="/images/courts-bg-texture.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)] leading-[0.95]">
              No Rec Gyms. No Excuses.
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              This is what youth sports should look like. Take a virtual tour of the facility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-off-white text-navy px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors font-[var(--font-chakra)]"
              >
                Watch Tour <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors font-[var(--font-chakra)]"
              >
                Book Your Court <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
              What Coaches &amp; Organizers Say
            </p>
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy font-[var(--font-chakra)]">
              Trusted by Teams Across Arizona
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <AnimateIn key={name}>
                <div className="bg-off-white border border-light-gray rounded-xl p-7 flex flex-col gap-4 h-full">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-red text-red" />
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

      {/* Location + Contact */}
      <section className="py-14 lg:py-20 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-12 items-center">
            <AnimateIn>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-navy mb-6 font-[var(--font-chakra)]">
                  Visit Us
                </h2>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-navy font-semibold text-sm">Address</p>
                      <p className="text-text-muted text-sm">{FACILITY_ADDRESS.full}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-red mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-navy font-semibold text-sm">Hours</p>
                      <p className="text-text-muted text-sm">Open by Appointment — Call or Book Online</p>
                    </div>
                  </div>
                  <a
                    href={`tel:+1${FACILITY_PHONE.replace(/\D/g, "")}`}
                    className="flex items-start gap-3 group"
                  >
                    <Phone className="w-5 h-5 text-red mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-navy font-semibold text-sm">Phone</p>
                      <p className="text-text-muted text-sm group-hover:text-red transition-colors">{FACILITY_PHONE}</p>
                    </div>
                  </a>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-red font-bold text-sm uppercase tracking-wide hover:text-navy transition-colors font-[var(--font-chakra)]"
                >
                  Contact Us <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimateIn>
            <AnimateIn delay={150}>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-light-gray h-[300px] lg:h-[400px]">
                <iframe
                  title="Inspire Courts AZ Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3332.5!2d-111.789!3d33.3825!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDIyJzU3LjAiTiAxMTHCsDQ3JzIwLjQiVw!5e0!3m2!1sen!2sus!4v1"
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Final CTA — sticky feeling */}
      <section className="py-12 bg-red">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-white font-[var(--font-chakra)]">
                Ready to play?
              </h2>
              <p className="text-white/80 text-sm mt-1">
                7 courts available • $80/court/hour • Book online or call
              </p>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-white hover:bg-off-white text-red px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors flex-shrink-0 font-[var(--font-chakra)]"
            >
              Book a Court <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-16 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-6 text-center font-[var(--font-chakra)]">
            You Might Also Like
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/events"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Tournaments
                </p>
                <p className="text-text-muted text-xs mt-0.5">Register for OFF SZN HOOPS events</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/training"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Private Training
                </p>
                <p className="text-text-muted text-xs mt-0.5">Train with a pro coach at the facility</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/gallery"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Gallery
                </p>
                <p className="text-text-muted text-xs mt-0.5">See photos from events and the facility</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <BackToTop />
      <div className="h-28 lg:hidden" />
    </>
  );
}
