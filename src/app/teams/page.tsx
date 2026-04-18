import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Trophy,
  Video,
  Users,
  Target,
  Flame,
  Star,
  Shield,
  Zap,
  MapPin,
} from "lucide-react";

const teamsSchema = {
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  name: "Team Inspire",
  description:
    "Team Inspire competes on the MADE Hoops Circuit. 16U and 17U boys club basketball based at Inspire Courts in Gilbert, AZ.",
  url: `${SITE_URL}/teams`,
  sport: "Basketball",
  memberOf: {
    "@type": "SportsOrganization",
    name: "MADE Hoops",
  },
  location: {
    "@type": "Place",
    name: "Inspire Courts AZ",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1090 N Fiesta Blvd, Ste 101 & 102",
      addressLocality: "Gilbert",
      addressRegion: "AZ",
      postalCode: "85233",
      addressCountry: "US",
    },
  },
  parentOrganization: {
    "@type": "SportsOrganization",
    name: "Inspire Courts AZ",
    url: SITE_URL,
  },
};
import AnimateIn from "@/components/ui/AnimateIn";
import VideoShowcase from "@/components/ui/VideoShowcase";
import SectionHeader from "@/components/ui/SectionHeader";
import ClubInterestForm from "@/components/ui/ClubInterestForm";
import BackToTop from "@/components/ui/BackToTop";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Team Inspire | Club Basketball in Gilbert, AZ | Inspire Courts AZ",
  description:
    "Team Inspire competes on the MADE Hoops Circuit. 16U and 17U boys club basketball based at Inspire Courts in Gilbert, AZ. Now recruiting coaches and players.",
  alternates: {
    canonical: `${SITE_URL}/teams`,
  },
  openGraph: {
    title: "Team Inspire | Club Basketball on MADE Hoops Circuit",
    description: "16U & 17U boys club basketball based at Inspire Courts in Gilbert, AZ. Now recruiting coaches and players for the MADE Hoops High School Circuit.",
    url: `${SITE_URL}/teams`,
    images: [{ url: `${SITE_URL}/images/hero-bg.jpg`, width: 1200, height: 630, alt: "Team Inspire club basketball program" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Team Inspire | Club Basketball on MADE Hoops Circuit",
    description: "16U & 17U boys club basketball. Now recruiting coaches and players in Gilbert, AZ.",
    images: [`${SITE_URL}/images/hero-bg.jpg`],
  },
};

const WHAT_YOU_GET = [
  {
    icon: Trophy,
    title: "MADE Hoops Circuit",
    desc: "Compete on the MADE Hoops High School Circuit — one of the top grassroots basketball platforms in the country. National exposure, elite competition.",
  },
  {
    icon: Users,
    title: "Team Training",
    desc: "Organized team practices at Inspire Courts with experienced coaches. Skill development, plays, and game prep year-round.",
  },
  {
    icon: Video,
    title: "Game Film",
    desc: "Game film available for purchase at tournaments. Build your recruiting portfolio with professional-quality footage.",
  },
  {
    icon: Target,
    title: "Player Development",
    desc: "Individual skill work, position-specific training, and a focus on basketball IQ. Get better every week with our coaching staff.",
  },
];

const WHY_INSPIRE = [
  {
    icon: Zap,
    title: "MADE Hoops Certified",
    desc: "We're on the circuit. Our teams compete against the best programs in the region on one of the top platforms in grassroots basketball.",
  },
  {
    icon: MapPin,
    title: "Home Court Advantage",
    desc: "Train and play at Inspire Courts — our own 7-court indoor facility with game film available and a pro environment.",
  },
  {
    icon: Star,
    title: "Culture First",
    desc: "We build competitors, not just players. Accountability, effort, and team-first mentality are non-negotiable.",
  },
];

export default function TeamsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamsSchema) }}
      />
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/courts-bg.jpg" alt="Team Inspire youth basketball program" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/75 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.12),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-4 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
              MADE Hoops Circuit
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg leading-[0.9]">
              Team
              <br />
              <span className="text-red">Inspire</span>
            </h1>
            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
              Club basketball on the MADE Hoops High School Circuit. Based out of Inspire Courts in Gilbert, AZ.
            </p>
            <p className="text-white/80 text-sm mb-10">
              Currently fielding 16U & 17U Boys — looking for coaches and players
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#join"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg font-[var(--font-chakra)]"
              >
                Join the Team{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </a>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] font-[var(--font-chakra)]"
              >
                Contact Us{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Interest Form — two-column on desktop */}
      <section id="join" className="py-14 lg:py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-20 items-start">
            {/* Left: info panel */}
            <AnimateIn>
              <div className="lg:sticky lg:top-32">
                <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
                  Now Recruiting
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-navy mb-4 font-[var(--font-chakra)] leading-[0.95]">
                  Join Team
                  <br />
                  Inspire
                </h2>
                <p className="text-text-muted max-w-md mb-8 leading-relaxed">
                  We&apos;re looking for competitive coaches and players for our 16U and 17U MADE Hoops teams. Fill out the form and we&apos;ll be in touch.
                </p>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3 text-navy">
                    <div className="w-10 h-10 bg-navy/5 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold">MADE Hoops High School Circuit</p>
                      <p className="text-text-muted text-xs">Top grassroots platform in the country</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-navy">
                    <div className="w-10 h-10 bg-navy/5 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold">Based at Inspire Courts</p>
                      <p className="text-text-muted text-xs">7 courts, game film, pro environment</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-navy">
                    <div className="w-10 h-10 bg-navy/5 rounded-lg flex items-center justify-center">
                      <Flame className="w-5 h-5 text-red" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold">16U & 17U Boys</p>
                      <p className="text-text-muted text-xs">Expanding to 13U–15U soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateIn>

            {/* Right: form */}
            <AnimateIn delay={150}>
              <ClubInterestForm />
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Divisions — redesigned for desktop impact */}
      <section className="py-12 lg:py-16 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center">
            {/* Left: text + future divisions */}
            <AnimateIn>
              <div>
                <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
                  2026 Season
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white font-[var(--font-chakra)] mb-4 leading-[0.95]">
                  Active Divisions
                </h2>
                <p className="text-white/60 max-w-lg mb-8 leading-relaxed">
                  Team Inspire is building something special. We&apos;re starting with two competitive age groups and growing from there.
                </p>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold mb-3">
                    Expanding Soon
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["13U", "14U", "15U"].map((d) => (
                      <div key={d} className="bg-white/5 border border-white/10 rounded-lg px-5 py-2.5 text-center">
                        <span className="text-lg font-bold text-white/40 font-[var(--font-chakra)]">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateIn>

            {/* Right: active division cards — big and bold */}
            <AnimateIn delay={150}>
              <div className="flex flex-row lg:flex-col gap-4 justify-center">
                {[
                  { division: "16U", gender: "Boys" },
                  { division: "17U", gender: "Boys" },
                ].map((ag) => (
                  <div
                    key={ag.division}
                    className="relative bg-gradient-to-br from-red/20 to-red/5 border-2 border-red/40 rounded-2xl px-10 py-8 lg:px-14 lg:py-10 text-center min-w-[160px] lg:min-w-[220px] overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="text-5xl lg:text-6xl font-bold text-red font-[var(--font-chakra)] mb-1">
                        {ag.division}
                      </div>
                      <div className="text-white/80 text-sm font-semibold uppercase tracking-wide">
                        {ag.gender}
                      </div>
                      <div className="inline-flex items-center gap-1.5 mt-3 bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full motion-safe:animate-pulse" />
                        Active
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* What You Get — improved desktop layout */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The Program"
            title="What You Get"
            description="Team Inspire is built around making players better and giving them every opportunity to compete at the highest level."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {WHAT_YOU_GET.map((item, i) => (
              <AnimateIn key={item.title} delay={i * 80}>
                <div className="group relative bg-white border border-light-gray rounded-2xl p-8 lg:p-10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-5 lg:gap-6">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center flex-shrink-0 shadow-md" aria-hidden="true">
                      <item.icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-navy font-[var(--font-chakra)] font-semibold text-lg lg:text-xl uppercase tracking-tight mb-2">
                        {item.title}
                      </h3>
                      <p className="text-text-muted text-sm lg:text-base leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why Team Inspire — side-by-side on desktop */}
      <section
        className="relative py-14 lg:py-24 bg-scroll md:bg-fixed bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/courts-bg-texture.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
            {/* Left: heading */}
            <AnimateIn>
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)] leading-[0.95]">
                  Why Team
                  <br />
                  <span className="text-red">Inspire</span>
                </h2>
                <p className="text-white/70 max-w-md leading-relaxed mb-8">
                  This isn&apos;t rec ball. We compete on a national stage and develop players who are serious about the game.
                </p>
                <a
                  href="#join"
                  className="group inline-flex items-center gap-2 text-red font-bold text-sm uppercase tracking-wide hover:text-white transition-colors font-[var(--font-chakra)]"
                >
                  Join the Team
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </a>
              </div>
            </AnimateIn>

            {/* Right: feature cards stacked */}
            <AnimateIn delay={150}>
              <div className="space-y-5">
                {WHY_INSPIRE.map((item) => (
                  <div key={item.title} className="flex items-start gap-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8">
                    <div className="w-14 h-14 bg-red/20 rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <item.icon className="w-7 h-7 text-red" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base lg:text-lg uppercase tracking-wide font-[var(--font-chakra)] mb-1.5">
                        {item.title}
                      </h3>
                      <p className="text-white/70 text-sm lg:text-base leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Player Highlights */}
      <section className="py-12 lg:py-20 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-10">
              <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
                Highlights
              </span>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-4 font-[var(--font-chakra)] leading-[0.95]">
                See Our Players <span className="text-red">In Action</span>
              </h2>
              <p className="text-text-muted leading-relaxed max-w-2xl mx-auto">
                Team Inspire players compete at the highest level on the MADE Hoops Circuit. Watch the highlights and see what our program is building.
              </p>
            </div>
          </AnimateIn>
          <div className="max-w-5xl mx-auto mb-10">
            <VideoShowcase
              videos={[
                { id: "5WFbsqEQxDE", title: "Team Inspire headline video", name: "Team Inspire", subtitle: "MADE Hoops Circuit" },
                { id: "ENl-hXQbEo8", title: "Thompson Twins playing for Team Inspire", name: "Thompson Twins", subtitle: "NBA · Team Inspire Alumni" },
                { id: "LsB3MD2GOXA", title: "Team Inspire Player Highlight", name: "Player Highlight", subtitle: "Team Inspire" },
                { id: "cOD4jknl2-E", title: "Team Inspire highlights", name: "Team Inspire", subtitle: "Highlights" },
                { id: "W84u1OuxI7M", title: "Team Inspire highlights", name: "Team Inspire", subtitle: "Highlights" },
                { id: "ZGsUk0p0CsE", title: "Team Inspire highlights", name: "Team Inspire", subtitle: "Highlights" },
                { id: "X3okI0F8RDE", title: "Team Inspire - Oba", name: "Team Inspire — Oba", subtitle: "Highlights", aspect: "9/16" },
              ]}
              initialCount={4}
              theme="light"
            />
          </div>
          <div className="text-center">
            <a
              href="#join"
              className="group inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all font-[var(--font-chakra)]"
            >
              Join the Team <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </a>
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
              href="/training"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Private Training
                </p>
                <p className="text-text-muted text-xs mt-0.5">1-on-1 and small group sessions at Inspire Courts</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="/camps"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Basketball Camps
                </p>
                <p className="text-text-muted text-xs mt-0.5">Youth skill camps at Inspire Courts</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="/prep"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Inspire Prep
                </p>
                <p className="text-text-muted text-xs mt-0.5">Basketball prep school in Gilbert, AZ</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <BackToTop />
      <div className="h-20 lg:hidden" />
    </>
  );
}
