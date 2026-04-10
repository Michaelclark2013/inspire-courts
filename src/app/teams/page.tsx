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
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Team Inspire | Club Basketball in Gilbert, AZ",
  description:
    "Join Team Inspire — competitive club basketball teams for youth players in Gilbert, AZ. 10U through 17U boys and girls. Year-round training, tournaments, and development.",
};

const AGE_GROUPS = [
  { division: "10U", gender: "Boys & Girls" },
  { division: "11U", gender: "Boys & Girls" },
  { division: "12U", gender: "Boys & Girls" },
  { division: "13U", gender: "Boys & Girls" },
  { division: "14U", gender: "Boys & Girls" },
  { division: "15U", gender: "Boys" },
  { division: "17U", gender: "Boys" },
];

const WHAT_YOU_GET = [
  {
    icon: Trophy,
    title: "Tournament Play",
    desc: "Compete in top tournaments across Arizona and beyond. Multiple events per season with 3+ game guarantees.",
  },
  {
    icon: Users,
    title: "Team Training",
    desc: "Organized team practices at Inspire Courts with experienced coaches. Skill development, plays, and game prep.",
  },
  {
    icon: Video,
    title: "Game Film",
    desc: "Every tournament game filmed at Inspire Courts. Use film to improve and build your recruiting portfolio.",
  },
  {
    icon: Target,
    title: "Player Development",
    desc: "Individual skill work, position-specific training, and a focus on basketball IQ. Get better every week.",
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
            <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-6 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
              Club Basketball
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg leading-[0.9]">
              Team
              <br />
              <span className="text-red">Inspire</span>
            </h1>
            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Competitive club basketball for youth players who want to get
              better, compete harder, and be part of something bigger.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?type=Team+Inspire+Tryouts"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg font-[var(--font-chakra)]"
              >
                Tryout Info{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
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

      {/* Age Groups */}
      <section className="py-16 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-2 font-[var(--font-chakra)]">
              Divisions
            </p>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-white font-[var(--font-chakra)]">
              Age Groups Available
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {AGE_GROUPS.map((ag) => (
              <AnimateIn key={ag.division}>
                <div className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-center min-w-[120px]">
                  <div className="text-2xl font-bold text-red font-[var(--font-chakra)]">
                    {ag.division}
                  </div>
                  <div className="text-white/60 text-xs mt-1">{ag.gender}</div>
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
            description="Team Inspire is built around making players better and giving them every opportunity to compete."
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
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-8 font-[var(--font-chakra)] leading-[0.95]">
              This Isn&apos;t Rec Ball
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {[
                { icon: Flame, label: "Competitive Culture" },
                { icon: Star, label: "Top Coaches" },
                { icon: Shield, label: "Pro Facility" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="w-14 h-14 bg-red/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-7 h-7 text-red" />
                  </div>
                  <p className="text-white font-bold text-sm uppercase tracking-wide font-[var(--font-chakra)]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-red">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)]">
            Join Team Inspire
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Tryouts happen throughout the year. Contact us to find out when the
            next tryout is and how to get your player involved.
          </p>
          <Link
            href="/contact?type=Team+Inspire+Tryouts"
            className="group inline-flex items-center gap-2 bg-white text-navy px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide hover:bg-gray-100 transition-colors font-[var(--font-chakra)]"
          >
            Get Tryout Info{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
