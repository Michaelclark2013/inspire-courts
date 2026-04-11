import type { Metadata } from "next";
import Link from "next/link";
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
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import QuickContactBar from "@/components/ui/QuickContactBar";
import BackToTop from "@/components/ui/BackToTop";
import { getPageContent, getField, getList } from "@/lib/content";
import { FACILITY_ADDRESS, FACILITY_PHONE, HERO_BG_IMAGE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Indoor Court Rental Gilbert AZ | Inspire Courts",
  description:
    "Professional indoor basketball & volleyball court rental in Gilbert, AZ. 7 courts, live scoreboards, game film, climate-controlled. Book for leagues, practices, and events.",
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
    title: "Courts",
    headline: "7 Regulation Indoor Courts",
    desc: "Professional-grade hardwood flooring, regulation dimensions, and adjustable hoops for all age groups. Built for real competition.",
  },
  {
    icon: Tv,
    title: "Technology",
    headline: "Digital Scoreboards & Game Film",
    desc: "Live digital scoreboards visible from every angle. Game film captured for every game — your team gets footage to review and improve.",
  },
  {
    icon: UtensilsCrossed,
    title: "Concessions",
    headline: "Snack Bar & Game-Day Fuel",
    desc: "Full concession stand with snacks and drinks on-site. Fuel up before, during, and after your game without leaving the building.",
  },
  {
    icon: Snowflake,
    title: "Climate",
    headline: "Fully Air-Conditioned",
    desc: "No Arizona heat, no excuses. Our facility is fully climate-controlled year-round. Play in comfort no matter the season.",
  },
];

const AMENITIES = [
  { icon: Trophy, label: "7 Regulation Courts" },
  { icon: Tv, label: "Electronic Scoreboards" },
  { icon: Zap, label: "Professional Shot Clocks" },
  { icon: Snowflake, label: "Climate-Controlled" },
  { icon: Users, label: "Spectator Seating" },
  { icon: UtensilsCrossed, label: "Concession Stand" },
  { icon: Wifi, label: "Free WiFi" },
  { icon: Car, label: "Ample Parking" },
];

const TESTIMONIALS = [
  {
    quote:
      "Best tournament facility in Arizona. We bring our teams here every season — the scoreboards, the courts, and the staff make it a first-class experience.",
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
    "Arizona's premier indoor basketball & volleyball facility. 7 courts, live digital scoreboards, game film, and a full concession stand in Gilbert, AZ.",
};

export default function FacilityPage() {
  const page = getPageContent("facility");

  const cmsFeatures = page ? getList(page, "Features") : [];
  const features = FEATURES.map((f, i) => ({
    ...f,
    title: cmsFeatures[i]?.eyebrow ?? f.title,
    headline: cmsFeatures[i]?.title ?? f.headline,
    desc: cmsFeatures[i]?.description ?? f.desc,
  }));

  return (
    <>
      {/* LocalBusiness JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${HERO_BG_IMAGE}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              {page ? getField(page, "Hero", "badge") : "The Complex"}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              {page ? getField(page, "Hero", "headline") : "The Facility"}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              {page
                ? getField(page, "Hero", "description")
                : "A premium indoor basketball & volleyball facility built from the ground up for serious competition. Every detail is intentional."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Book the Facility <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/60 hover:border-white text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { icon: Trophy, label: "7 Courts" },
              { icon: LayoutGrid, label: "40,000+ Sq Ft" },
              { icon: Tv, label: "Full Scoreboards" },
              { icon: UtensilsCrossed, label: "Concession Stand" },
              { icon: CalendarDays, label: "Year-Round" },
            ].map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                className={`flex items-center justify-center gap-2.5 py-5 px-4 text-white/80 ${
                  i < 4 ? "border-r border-white/10" : ""
                } ${i >= 2 ? "border-t border-white/10 lg:border-t-0" : ""}`}
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

      {/* Social Proof Stats */}
      <section className="bg-off-white py-10 border-b border-light-gray">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 text-center">
            {[
              { stat: "500+", label: "Events Hosted" },
              { stat: "7,000+", label: "Athletes" },
              { stat: "4.8★", label: "on Google" },
            ].map(({ stat, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-3xl font-bold text-navy font-[var(--font-chakra)] uppercase tracking-tight">
                  {stat}
                </span>
                <span className="text-sm text-text-muted mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Address + Hours */}
      <section className="bg-white py-7 border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-5 sm:gap-10 text-sm text-text-muted flex-wrap">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red mt-0.5 flex-shrink-0" />
              <span>{FACILITY_ADDRESS.full}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red flex-shrink-0" />
              <span>Open by Appointment — Call or Book Online</span>
            </div>
            <a
              href={`tel:+1${FACILITY_PHONE.replace(/\D/g, "")}`}
              className="flex items-center gap-2 text-navy font-semibold hover:text-red transition-colors"
            >
              <Phone className="w-4 h-4 text-red flex-shrink-0" />
              {FACILITY_PHONE}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-14 text-center font-[var(--font-chakra)]">
            Built for Competition
          </h2>
          <div className="space-y-16">
            {features.map((feature, i) => (
              <AnimateIn key={feature.title} delay={i * 80}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                  <div
                    className={`bg-off-white border border-light-gray rounded-xl aspect-[16/10] flex items-center justify-center ${
                      i % 2 === 1 ? "lg:order-2" : ""
                    }`}
                  >
                    <feature.icon className="w-16 h-16 text-red" />
                  </div>
                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                    <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
                      {feature.title}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-semibold uppercase tracking-tight text-navy mb-4 font-[var(--font-chakra)]">
                      {feature.headline}
                    </h3>
                    <p className="text-text-muted leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* What's Inside – Amenities */}
      <section className="py-16 lg:py-20 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-3 text-center font-[var(--font-chakra)]">
            What&apos;s Inside
          </h2>
          <p className="text-text-muted text-center mb-12 max-w-xl mx-auto">
            Everything you need for a professional game-day experience — under one roof.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {AMENITIES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-3 bg-white rounded-xl p-6 border border-light-gray text-center"
              >
                <Icon className="w-8 h-8 text-red" />
                <span className="text-navy font-semibold text-sm font-[var(--font-chakra)] uppercase tracking-wide leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="py-14 bg-red">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)]">
            Ready to bring your team here?
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Book a court for practice, your next tournament, or a private event.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-white hover:bg-off-white text-red px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
          >
            Book the Facility <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Parallax break */}
      <section
        className="relative py-28 bg-scroll md:bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_BG_IMAGE}')` }}
      >
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)]">
            No Rec Gyms. No Excuses.
          </h2>
          <p className="text-white/70 text-lg mb-8">
            This is what youth sports should look like.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
          >
            Book Your Court <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Rental CTA */}
      <section id="rentals" className="py-20 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-navy rounded-xl p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
                  Rentals
                </p>
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)]">
                  {page ? getField(page, "Rental CTA", "headline") : "Book the Facility"}
                </h2>
                <p className="text-white/70 leading-relaxed mb-6">
                  {page
                    ? getField(page, "Rental CTA", "description")
                    : "Host your league, practice, or private event at Inspire Courts. Available for basketball and volleyball leagues, team practices, private tournaments, camps, clinics, and corporate events."}
                </p>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                >
                  Book the Facility <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  "Basketball leagues & rec programs",
                  "Volleyball leagues & tournaments",
                  "Team practices & workouts",
                  "Private tournaments",
                  "Youth camps & clinics",
                  "Corporate events & birthday parties",
                  "Film sessions & combines",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-white/70">
                    <div className="w-2 h-2 bg-red rounded-full flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 text-center font-[var(--font-chakra)]">
            What Coaches &amp; Organizers Say
          </p>
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-12 text-center font-[var(--font-chakra)]">
            Trusted by Teams Across Arizona
          </h2>
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

      {/* Related Pages */}
      <section className="py-16 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-6 text-center font-[var(--font-chakra)]">
            You Might Also Like
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/book"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Book the Facility
                </p>
                <p className="text-text-muted text-xs mt-0.5">Request a reservation online</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
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
                <p className="text-text-muted text-xs mt-0.5">Train here with a pro coach</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <QuickContactBar subject="Facility Rental" label="Book the court?" formHref="/book" />
      <BackToTop />
      <div className="h-28 lg:hidden" />
    </>
  );
}
