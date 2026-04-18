import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Star,
  Trophy,
  Users,
  MapPin,
  Clock,
  ChevronDown,
  Mail,
  Phone,
  Dumbbell,
  Target,
  Shield,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import BackToTop from "@/components/ui/BackToTop";
import QuickContactBar from "@/components/ui/QuickContactBar";
import EmailSignup from "@/components/ui/EmailSignup";
import {
  FACILITY_ADDRESS,
  FACILITY_EMAIL,
  FACILITY_PHONE,
  LEAGUEAPPS_URL,
  SITE_URL,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Basketball Camps | Inspire Courts AZ",
  description:
    "Youth basketball camps in Gilbert, AZ at Inspire Courts. Skill development, fundamentals & competitive play for boys and girls. Register today.",
  alternates: {
    canonical: `${SITE_URL}/camps`,
  },
  openGraph: {
    title: "Basketball Camps | Inspire Courts AZ",
    description:
      "Youth basketball camps in Gilbert, AZ. Skill development, competitive games, and expert coaching at Arizona's premier indoor facility.",
    url: `${SITE_URL}/camps`,
    images: [
      {
        url: `${SITE_URL}/images/hero-bg.jpg`,
        width: 1200,
        height: 630,
        alt: "Basketball Camps at Inspire Courts AZ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Basketball Camps | Inspire Courts AZ",
    description: "Youth basketball camps in Gilbert, AZ. Skill development, competitive games, expert coaching.",
    images: [`${SITE_URL}/images/hero-bg.jpg`],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  name: "Inspire Courts AZ",
  url: SITE_URL,
  address: {
    "@type": "PostalAddress",
    streetAddress: `${FACILITY_ADDRESS.street}, ${FACILITY_ADDRESS.suite}`,
    addressLocality: FACILITY_ADDRESS.city,
    addressRegion: FACILITY_ADDRESS.state,
    postalCode: FACILITY_ADDRESS.zip,
    addressCountry: "US",
  },
  telephone: FACILITY_PHONE,
  email: FACILITY_EMAIL,
  event: [
    {
      "@type": "SportsEvent",
      name: "Rising Stars All West Camp",
      description:
        "Youth basketball camp for classes 2030-2034 focusing on skill development, fundamentals, and competitive play.",
      location: {
        "@type": "Place",
        name: "Inspire Courts AZ",
        address: {
          "@type": "PostalAddress",
          streetAddress: `${FACILITY_ADDRESS.street}, ${FACILITY_ADDRESS.suite}`,
          addressLocality: FACILITY_ADDRESS.city,
          addressRegion: FACILITY_ADDRESS.state,
          postalCode: FACILITY_ADDRESS.zip,
          addressCountry: "US",
        },
      },
      organizer: {
        "@type": "Organization",
        name: "Inspire Courts AZ",
        url: SITE_URL,
      },
    },
  ],
};

const WHAT_TO_EXPECT = [
  {
    icon: Dumbbell,
    title: "Skill Development",
    desc: "Ball handling, shooting mechanics, footwork, and positional skills. Each session is structured to build real-game fundamentals.",
  },
  {
    icon: Trophy,
    title: "Competitive Games",
    desc: "Scrimmages and structured team play throughout camp. Players compete, make decisions under pressure, and grow.",
  },
  {
    icon: Users,
    title: "Coaching Staff",
    desc: "Experienced coaches with individual attention and player feedback. Small groups to maximize every rep.",
  },
  {
    icon: Shield,
    title: "Premier Facility",
    desc: "7 regulation basketball courts, climate-controlled environment. Train where the pros train at Arizona's premier indoor facility.",
  },
  {
    icon: Target,
    title: "Position-Specific Work",
    desc: "Guards, wings, and bigs all get focused reps on position-relevant skills. No generic drills — intentional development.",
  },
  {
    icon: Star,
    title: "Player Evaluation",
    desc: "Coaches assess each player and provide feedback on strengths and areas to improve. Every camper leaves with a clear path forward.",
  },
];

const CAMP_SCHEDULE = [
  {
    name: "Rising Stars All West Camp",
    classes: "2030 – 2034",
    gender: "Boys & Girls",
    location: "Inspire Courts AZ — Gilbert, AZ",
    status: "Upcoming",
    note: "Check LeagueApps for exact dates and registration details.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What should my player bring to camp?",
    a: "Basketball shoes (non-marking soles), athletic clothes, a water bottle, and a light snack. All court equipment is provided.",
  },
  {
    q: "What are the age / class requirements?",
    a: "The Rising Stars All West Camp is designed for players in graduating classes 2030–2034. Contact us if you're unsure whether your player qualifies.",
  },
  {
    q: "What skill level is required?",
    a: "All skill levels are welcome. Our coaches group players appropriately so everyone is challenged and gets meaningful reps.",
  },
  {
    q: "What are the drop-off and pickup procedures?",
    a: "Detailed check-in and pickup info is sent after registration. The facility is located at 1090 N Fiesta Blvd, Gilbert, AZ 85233.",
  },
  {
    q: "How much does camp cost?",
    a: "Pricing varies by camp session. Visit our LeagueApps registration page or contact us directly for current pricing.",
  },
  {
    q: "What is the refund policy?",
    a: "Refunds are available up to 7 days before the camp start date. After that, we can offer a credit toward a future session. Contact us for special circumstances.",
  },
];

export default function CampsPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/courts-bg.jpg"
          alt="Basketball camps at Inspire Courts AZ"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/75 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.12),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-14 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-6 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
              Youth Basketball Camps
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg leading-[0.9]">
              Basketball
              <br />
              <span className="text-red">Camps</span>
            </h1>
            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Developing young athletes at Arizona&apos;s premier indoor
              facility. Skill-focused, coach-driven camps built to elevate your
              game.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={LEAGUEAPPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg font-[var(--font-chakra)]"
              >
                Register Now{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </a>
              <Link
                href="/contact?type=Camps+%26+Clinics"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] font-[var(--font-chakra)]"
              >
                Contact Us{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ─── Featured Camp ────────────────────────────────────────────────────── */}
      <section className="py-10 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimateIn>
              <div>
                <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-4 font-[var(--font-chakra)]">
                  Featured Camp
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-navy mb-4 font-[var(--font-chakra)] leading-[0.95]">
                  Rising Stars
                  <br />
                  <span className="text-red">All West Camp</span>
                </h2>
                <p className="text-text-muted text-lg leading-relaxed mb-6">
                  Our flagship youth camp for the next generation of players.
                  Built around skill development, fundamentals, and real
                  competition — the Rising Stars All West Camp is where young
                  athletes level up.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Classes 2030–2034 (younger age groups)",
                    "Open to boys & girls",
                    "Focus: fundamentals, ball handling, shooting, footwork",
                    "Competitive scrimmages and team play",
                    "Individual coach feedback for every player",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red rounded-full flex-shrink-0 mt-2" />
                      <span className="text-text-muted text-sm lg:text-base">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href={LEAGUEAPPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] shadow-md font-[var(--font-chakra)]"
                >
                  Register for This Camp{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </a>
              </div>
            </AnimateIn>
            <AnimateIn delay={200}>
              <div className="bg-navy rounded-2xl p-5 sm:p-8 lg:p-10 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-navy-dark" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div
                      className="w-12 h-12 bg-red rounded-xl flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <Star className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-lg lg:text-xl uppercase tracking-tight font-[var(--font-chakra)]">
                      Camp Details
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <Users className="w-4 h-4 text-white/70" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                          Who It&apos;s For
                        </p>
                        <p className="text-white font-semibold text-sm">
                          Boys &amp; Girls — Classes 2030–2034
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <Target className="w-4 h-4 text-white/70" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                          Camp Focus
                        </p>
                        <p className="text-white font-semibold text-sm">
                          Skill Development, Fundamentals &amp; Competition
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <MapPin className="w-4 h-4 text-white/70" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                          Location
                        </p>
                        <p className="text-white font-semibold text-sm">
                          Inspire Courts AZ
                        </p>
                        <p className="text-white/60 text-xs mt-0.5">
                          {FACILITY_ADDRESS.street}, {FACILITY_ADDRESS.city},{" "}
                          {FACILITY_ADDRESS.state}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <Clock className="w-4 h-4 text-white/70" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                          Registration
                        </p>
                        <p className="text-white font-semibold text-sm">
                          Via LeagueApps
                        </p>
                        <p className="text-white/60 text-xs mt-0.5">
                          Visit our registration page for dates &amp; pricing
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <a
                      href={LEAGUEAPPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white w-full px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-all font-[var(--font-chakra)]"
                    >
                      Register Now{" "}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ─── What to Expect ───────────────────────────────────────────────────── */}
      <section className="py-10 lg:py-24 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The Experience"
            title="What to Expect"
            description="Every camp is built around reps, competition, and feedback. Here's what players get when they step through our doors."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHAT_TO_EXPECT.map((item, i) => (
              <AnimateIn key={item.title} delay={i * 80}>
                <div className="group relative bg-white border border-light-gray rounded-2xl p-6 lg:p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div
                    className="w-12 h-12 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center mb-5 shadow-md"
                    aria-hidden="true"
                  >
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-navy font-[var(--font-chakra)] font-semibold text-lg uppercase tracking-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {[
              { value: "7", label: "Regulation Courts" },
              { value: "52K", label: "Sq Ft Facility" },
              { value: "2030–34", label: "Classes Served" },
              { value: "Gilbert", label: "AZ Location" },
            ].map((stat) => (
              <AnimateIn key={stat.label}>
                <div className="text-center">
                  <p className="text-red font-bold text-3xl sm:text-4xl lg:text-5xl font-[var(--font-chakra)] uppercase tracking-tight leading-none mb-1" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {stat.value}
                  </p>
                  <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Camp Schedule ────────────────────────────────────────────────────── */}
      <section className="py-10 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Schedule"
            title="Upcoming Camps"
            description="Stay up to date on camp dates. Registration is handled through LeagueApps."
          />
          <div className="space-y-4">
            {CAMP_SCHEDULE.map((camp) => (
              <AnimateIn key={camp.name}>
                <div className="bg-white border border-light-gray rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                  {/* Header row */}
                  <div className="flex items-center justify-between px-6 py-4 bg-navy">
                    <h3 className="text-white font-bold text-base sm:text-lg uppercase tracking-tight font-[var(--font-chakra)]">
                      {camp.name}
                    </h3>
                    <span className="inline-block bg-red text-white text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full font-[var(--font-chakra)]">
                      {camp.status}
                    </span>
                  </div>
                  {/* Detail rows */}
                  <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wider mb-1 font-semibold">
                        Classes
                      </p>
                      <p className="text-navy font-semibold text-sm">
                        {camp.classes}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wider mb-1 font-semibold">
                        Open To
                      </p>
                      <p className="text-navy font-semibold text-sm">
                        {camp.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wider mb-1 font-semibold">
                        Location
                      </p>
                      <p className="text-navy font-semibold text-sm">
                        {camp.location}
                      </p>
                    </div>
                  </div>
                  {camp.note && (
                    <div className="px-6 pb-5">
                      <p className="text-text-muted text-xs italic">
                        {camp.note}
                      </p>
                    </div>
                  )}
                  <div className="px-6 pb-5">
                    <a
                      href={LEAGUEAPPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 text-red font-bold text-sm uppercase tracking-wide hover:text-navy transition-colors font-[var(--font-chakra)]"
                    >
                      View &amp; Register{" "}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
          <AnimateIn delay={100}>
            <div className="mt-10 bg-off-white border border-light-gray rounded-2xl p-8 lg:p-10">
              <p className="text-center text-text-muted text-sm mb-6">
                More camps are being added throughout the year. Get on the list for early access.
              </p>
              <EmailSignup variant="light" />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-10 lg:py-24 bg-off-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="FAQ"
            title="Common Questions"
            description="Everything you need to know before registering."
          />
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <AnimateIn key={item.q} delay={i * 50}>
                <details className="group bg-white border border-light-gray rounded-2xl overflow-hidden hover:border-red/20 transition-colors">
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-5 list-none select-none">
                    <span className="text-navy font-semibold text-sm sm:text-base pr-4 font-[var(--font-chakra)] uppercase tracking-tight group-open:text-red transition-colors">
                      {item.q}
                    </span>
                    <ChevronDown
                      className="w-5 h-5 text-red flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-6 pb-5 animate-[fadeIn_0.2s_ease-out]">
                    <p className="text-text-muted text-sm leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </details>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact / CTA ────────────────────────────────────────────────────── */}
      <section className="relative py-16 lg:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/courts-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 to-navy/85" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-center">
            <AnimateIn>
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)] leading-[0.95]">
                  Questions About{" "}
                  <span className="text-red">Camps?</span>
                </h2>
                <p className="text-white/70 text-lg mb-8 max-w-xl leading-relaxed">
                  We&apos;re happy to help. Reach out with any questions about
                  registration, pricing, age groups, or what to expect.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={LEAGUEAPPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
                  >
                    Register Now{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </a>
                  <Link
                    href="/contact"
                    className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] font-[var(--font-chakra)]"
                  >
                    Contact Us{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </AnimateIn>
            <AnimateIn delay={200}>
              <div className="hidden lg:block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-10">
                <h3 className="text-white font-bold text-lg uppercase tracking-tight font-[var(--font-chakra)] mb-6">
                  Get In Touch
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red/20 rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <Mail className="w-5 h-5 text-red" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                        Email
                      </p>
                      <a
                        href={`mailto:${FACILITY_EMAIL}`}
                        className="text-white font-semibold text-sm hover:text-red hover:underline transition-colors"
                      >
                        {FACILITY_EMAIL}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red/20 rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <Phone className="w-5 h-5 text-red" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                        Phone
                      </p>
                      <a
                        href={`tel:${FACILITY_PHONE.replace(/\D/g, "")}`}
                        className="text-white font-semibold text-sm hover:text-red hover:underline transition-colors"
                      >
                        {FACILITY_PHONE}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red/20 rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <MapPin className="w-5 h-5 text-red" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                        Location
                      </p>
                      <p className="text-white font-semibold text-sm">
                        {FACILITY_ADDRESS.full}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ─── Related Links ────────────────────────────────────────────────────── */}
      <section className="py-10 lg:py-16 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-6 text-center font-[var(--font-chakra)]">
            More Programs
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/training"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Private Training
                </p>
                <p className="text-text-muted text-xs mt-0.5">
                  1-on-1 and small group sessions
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="/teams"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Team Inspire
                </p>
                <p className="text-text-muted text-xs mt-0.5">
                  Club basketball on the MADE Hoops Circuit
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="/prep"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Inspire Prep
                </p>
                <p className="text-text-muted text-xs mt-0.5">
                  Full-time basketball prep school program
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <QuickContactBar subject="Basketball Camps" label="Questions about camps?" />
      <BackToTop />
      <div className="h-32 lg:hidden" />
    </>
  );
}
