import type { Metadata } from "next";
import Link from "next/link";
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
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import ClubInterestForm from "@/components/ui/ClubInterestForm";

export const metadata: Metadata = {
  title: "Team Inspire | MADE Hoops Circuit — Club Basketball in Gilbert, AZ",
  description:
    "Team Inspire plays on the MADE Hoops High School Circuit. 16U and 17U boys club basketball based out of Inspire Courts in Gilbert, AZ. Looking for competitive coaches and players.",
};

const CURRENT_DIVISIONS = [
  { division: "16U", gender: "Boys", status: "Active" },
  { division: "17U", gender: "Boys", status: "Active" },
];

const FUTURE_DIVISIONS = [
  { division: "13U", label: "Coming Soon" },
  { division: "14U", label: "Coming Soon" },
  { division: "15U", label: "Coming Soon" },
];

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
    desc: "Every tournament game filmed at Inspire Courts. Build your recruiting portfolio with professional-quality footage.",
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
    desc: "Train and play at Inspire Courts — our own 2-court indoor facility with live scoreboards, game film, and a pro environment.",
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
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/75 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.12),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32 lg:py-40">
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
            <p className="text-white/50 text-sm mb-10">
              Currently fielding 16U & 17U Boys — looking for coaches and players
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#join"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg font-[var(--font-chakra)]"
              >
                Join the Team{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/60 text-white hover:bg-white hover:text-navy px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all font-[var(--font-chakra)]"
              >
                Contact Us{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Current Divisions */}
      <section className="py-16 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-2 font-[var(--font-chakra)]">
              2026 Season
            </p>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-white font-[var(--font-chakra)]">
              Active Divisions
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {CURRENT_DIVISIONS.map((ag) => (
              <AnimateIn key={ag.division}>
                <div className="bg-red/20 border-2 border-red/40 rounded-xl px-8 py-5 text-center min-w-[140px]">
                  <div className="text-3xl font-bold text-red font-[var(--font-chakra)]">
                    {ag.division}
                  </div>
                  <div className="text-white/80 text-sm mt-1 font-semibold">{ag.gender}</div>
                  <div className="text-green-400 text-xs mt-2 font-bold uppercase tracking-wider">
                    {ag.status}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
          <div className="text-center mb-4">
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold">
              Expanding Soon
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {FUTURE_DIVISIONS.map((ag) => (
              <AnimateIn key={ag.division}>
                <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center min-w-[120px] opacity-60">
                  <div className="text-2xl font-bold text-white/50 font-[var(--font-chakra)]">
                    {ag.division}
                  </div>
                  <div className="text-white/30 text-xs mt-1">{ag.label}</div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The Program"
            title="What You Get"
            description="Team Inspire is built around making players better and giving them every opportunity to compete at the highest level."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {WHAT_YOU_GET.map((item, i) => (
              <AnimateIn key={item.title} delay={i * 80}>
                <div className="group relative bg-white border border-light-gray rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-navy font-[var(--font-chakra)] font-bold text-lg uppercase tracking-tight mb-2">
                        {item.title}
                      </h3>
                      <p className="text-text-muted text-sm leading-relaxed">
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

      {/* Why Team Inspire */}
      <section
        className="relative py-28 lg:py-36 bg-fixed bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)] leading-[0.95]">
                Why Team Inspire
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                This isn&apos;t rec ball. We compete on a national stage and develop players who are serious about the game.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {WHY_INSPIRE.map((item) => (
                <div key={item.title} className="text-center">
                  <div className="w-16 h-16 bg-red/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-red" />
                  </div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide font-[var(--font-chakra)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Interest Form */}
      <section id="join" className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
              Now Recruiting
            </span>
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-4 font-[var(--font-chakra)]">
              Join Team Inspire
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              We&apos;re looking for competitive coaches and players for our 16U and 17U MADE Hoops teams. Fill out the form below and we&apos;ll be in touch.
            </p>
          </div>
          <ClubInterestForm />
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
