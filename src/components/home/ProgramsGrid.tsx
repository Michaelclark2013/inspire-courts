import { memo } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Users, Star, Trophy } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import type { ProgramCard } from "@/types/home";

const PROGRAM_CARDS: ProgramCard[] = [
  {
    icon: GraduationCap,
    accent: "red",
    title: "Inspire Prep",
    subtitle: "Basketball Prep School",
    points: [
      "Full-time basketball academy with daily training",
      "Academic support & college prep built in",
      "National competition schedule — NIBC, Grind Session, MADE Hoops",
      "College placement & recruiting exposure",
    ],
    href: "/prep",
    cta: "Learn About Inspire Prep",
  },
  {
    icon: Users,
    accent: "navy",
    title: "Team Inspire",
    subtitle: "Club Basketball",
    points: [
      "Competitive AAU/club teams on the MADE Hoops circuit",
      "Teams from 8U through 17U age groups",
      "Where Inspire Courts started — the original program",
      "Tournament travel, showcases & league play year-round",
    ],
    href: "/teams",
    cta: "Explore Team Inspire",
  },
  {
    icon: Star,
    accent: "red",
    title: "Elite Development",
    subtitle: "Train with Purpose",
    points: [
      "Private & small-group sessions with experienced coaches",
      "Position-specific skill work & game IQ development",
      "Film review sessions to sharpen decision-making",
      "Strength & conditioning integrated into training",
    ],
    href: "/training",
    cta: "Book Training",
  },
  {
    icon: Trophy,
    accent: "navy",
    title: "Tournaments & Events",
    subtitle: "Compete at Home",
    points: [
      "OFF SZN HOOPS tournaments hosted at Inspire Courts",
      "7 regulation hardwood courts — room for big brackets",
      "Live scoring, brackets & standings built into the site",
      "Game film available as a paid add-on",
    ],
    href: "/tournaments",
    cta: "View Tournaments",
  },
];

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2";

function ProgramsGrid() {
  return (
    <section className="py-10 lg:py-20 bg-white" aria-labelledby="programs-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our Programs"
          title="More Than a Facility"
          description="Inspire Courts is home to Inspire Prep, Team Inspire, and elite training — everything a serious player needs under one roof."
          titleId="programs-heading"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {PROGRAM_CARDS.map((card, i) => (
            <AnimateIn key={card.title} delay={i * 80}>
              <Link
                href={card.href}
                className={`group relative bg-white border border-light-gray rounded-2xl p-5 sm:p-8 lg:p-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden h-full flex flex-col ${FOCUS_RING}`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.accent === "red" ? "bg-red" : "bg-navy"} rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-10 h-10 sm:w-14 sm:h-14 ${card.accent === "red" ? "bg-gradient-to-br from-red to-red-dark" : "bg-gradient-to-br from-navy to-navy-dark"} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-5 shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
                </div>
                <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">{card.subtitle}</p>
                <h3 className="text-navy font-[var(--font-chakra)] font-bold text-lg lg:text-xl uppercase tracking-tight mb-3">
                  {card.title}
                </h3>
                <ul className="space-y-2 flex-1 mb-4">
                  {card.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-text-muted text-sm leading-relaxed">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${card.accent === "red" ? "bg-red" : "bg-navy"}`} aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-red group-hover:gap-3 transition-all">
                  {card.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </Link>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(ProgramsGrid);
