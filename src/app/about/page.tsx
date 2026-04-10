import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Target,
  Users,
  Flame,
  Camera,
  MapPin,
  Ticket,
  ClipboardCheck,
  Calendar,
  UtensilsCrossed,
  ShieldAlert,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "About | Inspire Courts AZ",
  description:
    "The story behind Arizona's premier indoor basketball facility. Founded to give youth basketball players a professional-level experience.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              Our Story
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              The Story
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Founded to give Arizona&apos;s youth basketball players a
              professional-level experience. No more dusty rec centers. No more
              outdoor courts in 115-degree heat.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Origin */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimateIn>
              <div>
                <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-4 font-[var(--font-chakra)]">
                  Why We Exist
                </p>
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-6 font-[var(--font-chakra)]">
                  Built for Competitors
                </h2>
                <div className="space-y-4 text-text-muted leading-relaxed">
                  <p>
                    Inspire Courts is climate-controlled, professionally
                    equipped, and built for competitors. Two regulation indoor
                    courts with live digital scoreboards, game film for every
                    game, and a setup that rivals college-level facilities.
                  </p>
                  <p>
                    We saw what youth basketball looked like in Arizona — rec
                    gyms with broken rims, outdoor tournaments in 115-degree
                    heat, and zero game footage. We built the opposite.
                  </p>
                  <p>
                    Every team that walks through our doors gets the same
                    experience: professional courts, real scoreboards, and film
                    they can use to get better. That&apos;s the standard.
                  </p>
                </div>
              </div>
            </AnimateIn>
            <AnimateIn delay={200}>
              <div className="bg-off-white border border-light-gray rounded-xl p-8 lg:p-10 space-y-6">
                <h3 className="text-navy font-bold text-lg uppercase tracking-tight font-[var(--font-chakra)]">
                  Our Mission
                </h3>
                <p className="text-red text-xl font-bold leading-snug font-[var(--font-chakra)]">
                  Elevate youth basketball in Arizona — one court, one game, one
                  player at a time.
                </p>
                <div className="pt-4 border-t border-light-gray space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-text-muted text-sm">
                      Professional-grade experience for every team, every game
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-text-muted text-sm">
                      Community of competitors from 10U through 17U
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-text-muted text-sm">
                      Raising the standard for youth basketball in AZ
                    </p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Three Brands */}
      <section className="py-20 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The Brands"
            title="Three Brands, One Mission"
            description="Inspire Courts, OFF SZN HOOPS, and @AZFinestMixtape work together to deliver the complete youth basketball experience."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimateIn>
              <div className="bg-white border border-light-gray rounded-xl p-8 h-full shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
                  Inspire Courts
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  The facility. Two regulation courts, live scoreboards, game
                  film, and a pro-level setup. Available for rentals, leagues,
                  practices, and private events.
                </p>
              </div>
            </AnimateIn>
            <AnimateIn delay={150}>
              <div className="bg-white border border-light-gray rounded-xl p-8 h-full shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red rounded-full flex items-center justify-center mb-6">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
                  OFF SZN HOOPS
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  The tournament series. Year-round youth basketball tournaments
                  with 10U through 17U divisions. Compete, get ranked, get seen.
                </p>
              </div>
            </AnimateIn>
            <AnimateIn delay={300}>
              <div className="bg-white border border-light-gray rounded-xl p-8 h-full shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center mb-6">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
                  @AZFinestMixtape
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  The content brand. Highlights, mixtapes, and player features
                  giving Arizona&apos;s best young ballers the exposure they
                  deserve.
                </p>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Game Day Info */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Game Day"
            title="Know Before You Go"
            description="Everything you need for game day at Inspire Courts."
          />
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: MapPin,
                title: "Location",
                text: "1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233",
              },
              {
                icon: Ticket,
                title: "Spectator Admission",
                text: "$15 at the door. Kids under 5 free. Cash and card accepted.",
              },
              {
                icon: ClipboardCheck,
                title: "Player Check-In",
                text: "Head coaches check in at the front table with valid ID. Rosters must be submitted before your first game.",
              },
              {
                icon: Calendar,
                title: "Schedules",
                text: "Schedules drop 48 hours before tip-off. Check the Schedule page or your email.",
              },
              {
                icon: UtensilsCrossed,
                title: "Food & Drinks",
                text: "Snack bar is open all day. No outside food or beverages permitted.",
              },
              {
                icon: ShieldAlert,
                title: "House Rules",
                text: "No hanging on rims. No profanity. All children must be supervised by an adult. Not responsible for lost or stolen items.",
              },
            ].map((item, i) => (
              <AnimateIn key={item.title} delay={i * 60}>
                <div className="flex gap-4 p-5 rounded-xl border border-light-gray bg-off-white">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-navy text-white">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-navy font-bold text-sm uppercase tracking-tight mb-1 font-[var(--font-chakra)]">
                      {item.title}
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-red">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)]">
            Ready to Compete?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Check out our upcoming tournaments and register your team.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-white text-navy px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide hover:bg-gray-100 transition-colors"
          >
            See Upcoming Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
