import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  GraduationCap,
  Trophy,
  Video,
  Users,
  BookOpen,
  Shield,
  Target,
  Dumbbell,
  Star,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import VideoShowcase from "@/components/ui/VideoShowcase";
import SectionHeader from "@/components/ui/SectionHeader";
import BackToTop from "@/components/ui/BackToTop";
import QuickContactBar from "@/components/ui/QuickContactBar";

export const metadata: Metadata = {
  title: "Inspire Prep | Basketball Prep School in Gilbert, AZ | Inspire Courts AZ",
  description:
    "Inspire Prep combines elite basketball development with academic excellence. Train, compete, and prepare for the next level in Gilbert, Arizona.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/prep",
  },
  openGraph: {
    title: "Inspire Prep — Basketball Prep School in Gilbert, AZ",
    description: "Elite basketball development meets academic excellence. Train, compete, and prepare for the next level at Inspire Courts AZ.",
    url: "https://inspirecourtsaz.com/prep",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Prep basketball academy" }],
  },
};

const PROGRAM_HIGHLIGHTS = [
  {
    icon: Trophy,
    title: "Elite Competition",
    desc: "Play against top-level competition year-round. Prep schedule includes tournaments, showcases, and exposure events.",
  },
  {
    icon: GraduationCap,
    title: "Academic Support",
    desc: "Education comes first. Structured academic time, tutoring support, and college prep guidance built into the program.",
  },
  {
    icon: Video,
    title: "Game Film",
    desc: "Game film available at tournaments. Film review sessions with coaches to accelerate player development.",
  },
  {
    icon: Users,
    title: "College Exposure",
    desc: "We put our players in front of college coaches. Showcases, highlight reels, and recruiting support included.",
  },
  {
    icon: BookOpen,
    title: "Life Skills",
    desc: "Leadership, discipline, time management — we develop the whole person, not just the player.",
  },
  {
    icon: Shield,
    title: "Pro-Level Facility",
    desc: "Train at Inspire Courts — regulation courts and a facility that prepares you for the next level.",
  },
];

const PROGRAM_INCLUDES = [
  "Daily skill development & team training",
  "Competitive game schedule & showcases",
  "Game film available & film review sessions",
  "Academic support & college prep",
  "Strength & conditioning program",
  "Recruiting guidance & exposure events",
];

export default function PrepPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/courts-bg.jpg" alt="Inspire Prep basketball academy" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/75 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.12),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-6 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
              Prep School
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg leading-[0.9]">
              Inspire
              <br />
              <span className="text-red">Prep</span>
            </h1>
            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Elite basketball development meets academic excellence. Train,
              compete, and prepare for the next level — all under one roof.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?type=Inspire+Prep"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg font-[var(--font-chakra)]"
              >
                Apply Now{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] font-[var(--font-chakra)]"
              >
                Learn More{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* What is Inspire Prep — improved desktop two-column */}
      <section className="py-14 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimateIn>
              <div>
                <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-4 font-[var(--font-chakra)]">
                  The Program
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-navy mb-6 font-[var(--font-chakra)] leading-[0.95]">
                  More Than
                  <br />
                  Basketball
                </h2>
                <div className="space-y-4 text-text-muted leading-relaxed lg:text-lg">
                  <p>
                    Inspire Prep is a basketball-focused prep program based out of
                    Inspire Courts in Gilbert, AZ. We combine elite-level training
                    and competition with structured academics to prepare
                    student-athletes for the next level.
                  </p>
                  <p>
                    Our players train daily at a professional facility, compete in
                    top-tier tournaments and showcases, and receive the academic
                    support they need to succeed in the classroom and beyond.
                  </p>
                  <p>
                    Whether the goal is a college scholarship, a prep school
                    placement, or simply becoming the best version of themselves —
                    Inspire Prep is where it starts.
                  </p>
                </div>
              </div>
            </AnimateIn>
            <AnimateIn delay={200}>
              <div className="bg-navy rounded-2xl p-8 lg:p-10 text-white relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/images/courts-bg-texture.jpg')",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-navy-dark" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red rounded-xl flex items-center justify-center" aria-hidden="true">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg lg:text-xl uppercase tracking-tight font-[var(--font-chakra)]">
                      Program Includes
                    </h3>
                  </div>
                  <ul className="space-y-3.5">
                    {PROGRAM_INCLUDES.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red rounded-full flex-shrink-0 mt-2" />
                        <span className="text-white/80 text-sm lg:text-base">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Adan Diggs — Flagship Player */}
      <section className="py-14 lg:py-24 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimateIn>
              <div>
                <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
                  Inspire Prep Alumni
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-navy mb-6 font-[var(--font-chakra)] leading-[0.95]">
                  Adan Diggs <span className="text-red">Came Up Here</span>
                </h2>
                <p className="text-text-muted text-lg leading-relaxed mb-6">
                  Adan Diggs developed his game through Inspire Prep — training daily, competing against top talent, and earning his opportunity. This is what the program builds.
                </p>
                <Link
                  href="/contact?type=Inspire+Prep"
                  className="group inline-flex items-center gap-2 text-red font-bold text-sm uppercase tracking-wide hover:text-navy transition-colors font-[var(--font-chakra)]"
                >
                  Join the Program
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </AnimateIn>
            <AnimateIn delay={150}>
              <div
                className="relative rounded-2xl overflow-hidden shadow-2xl border border-light-gray mx-auto"
                style={{ aspectRatio: "9/16", maxWidth: "360px" }}
              >
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/HXmJvuzzPxg?rel=0&modestbranding=1"
                  title="Adan Diggs — Inspire Prep"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* More Inspire Prep Videos */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-10">
              <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
                Inside Look
              </span>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy font-[var(--font-chakra)] leading-[0.95]">
                Inspire Prep in Action
              </h2>
            </div>
          </AnimateIn>
          <VideoShowcase
            videos={[
              { id: "HXmJvuzzPxg", title: "Inspire Prep 2030", name: "Inspire Prep 2030", subtitle: "Highlights", aspect: "9/16" },
              { id: "X3okI0F8RDE", title: "Inspire Prep — Oba", name: "Inspire Prep — Oba", subtitle: "Highlights", aspect: "9/16" },
            ]}
            initialCount={4}
            theme="light"
          />
        </div>
      </section>

      {/* Program Highlights — featured card + grid layout for desktop */}
      <section className="py-14 lg:py-24 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Why Inspire Prep"
            title="Built for the Next Level"
            description="Everything a student-athlete needs to develop, compete, and earn their opportunity."
          />

          {/* Desktop: featured top row + bottom grid */}
          <div className="space-y-6 lg:space-y-8">
            {/* Top row: 2 featured cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {PROGRAM_HIGHLIGHTS.slice(0, 2).map((item, i) => (
                <AnimateIn key={item.title} delay={i * 80}>
                  <div className="group relative bg-white border border-light-gray rounded-2xl p-8 lg:p-10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-5 lg:gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center flex-shrink-0 shadow-md" aria-hidden="true">
                        <item.icon className="w-7 h-7 text-white" />
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

            {/* Bottom row: 4 cards in a grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PROGRAM_HIGHLIGHTS.slice(2).map((item, i) => (
                <AnimateIn key={item.title} delay={(i + 2) * 80}>
                  <div className="group relative bg-white border border-light-gray rounded-2xl p-6 lg:p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center mb-4 shadow-md" aria-hidden="true">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-navy font-[var(--font-chakra)] font-semibold text-base lg:text-lg uppercase tracking-tight mb-2">
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
        </div>
      </section>

      {/* The Difference — stats/values bar */}
      <section className="py-12 lg:py-16 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {[
              { icon: Dumbbell, label: "Daily Training", value: "Year-Round" },
              { icon: Trophy, label: "Tournaments", value: "Regional & National" },
              { icon: GraduationCap, label: "Academics", value: "Built In" },
              { icon: Star, label: "Facility", value: "52K Sq Ft" },
            ].map((stat) => (
              <AnimateIn key={stat.label}>
                <div className="text-center">
                  <div className="w-12 h-12 bg-red/20 rounded-xl flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                    <stat.icon className="w-6 h-6 text-red" />
                  </div>
                  <p className="text-white font-bold text-lg lg:text-xl font-[var(--font-chakra)] uppercase tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-white/50 text-xs uppercase tracking-wider mt-1">
                    {stat.label}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 lg:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/courts-bg-texture.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 to-navy/85" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-center">
            <AnimateIn>
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] leading-[0.95]">
                  Join <span className="text-red">Inspire Prep</span>
                </h2>
                <p className="text-white/70 text-lg mb-8 max-w-xl leading-relaxed">
                  Spots are limited. Contact us to learn about tryouts, enrollment,
                  and what Inspire Prep can do for your student-athlete.
                </p>
                <Link
                  href="/contact?type=Inspire+Prep"
                  className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
                >
                  Apply Now{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </AnimateIn>
            <AnimateIn delay={200}>
              <div className="hidden lg:block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-10">
                <h3 className="text-white font-bold text-lg uppercase tracking-tight font-[var(--font-chakra)] mb-5">
                  What to Expect
                </h3>
                <div className="space-y-4">
                  {[
                    "Professional coaching staff with college & pro experience",
                    "Full competitive schedule with national exposure",
                    "Academic accountability and college placement support",
                    "Training at Arizona's premier indoor facility",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-red/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-red rounded-full" />
                      </div>
                      <span className="text-white/80 text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>
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
              href="/teams"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Team Inspire
                </p>
                <p className="text-text-muted text-xs mt-0.5">Club basketball on the MADE Hoops Circuit</p>
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
                <p className="text-text-muted text-xs mt-0.5">1-on-1 and small group sessions</p>
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
                <p className="text-text-muted text-xs mt-0.5">Compete in OFF SZN HOOPS events</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <QuickContactBar subject="Inspire Prep" label="Questions about Prep?" />
      <BackToTop />
      <div className="h-16 lg:hidden" />
    </>
  );
}
