import Link from "next/link";
import {
  ArrowRight,
  Tv,
  Video,
  BarChart3,
  UtensilsCrossed,
  Car,
  Trophy,
  MapPin,
  Calendar,
  Shield,
  Zap,
  Users,
  CheckCircle2,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";

const FACILITY_FEATURES = [
  {
    icon: Trophy,
    title: "2 Indoor Courts",
    desc: "Regulation hardwood floors, professional dimensions, adjustable hoops for all age groups.",
  },
  {
    icon: Tv,
    title: "Live Scoreboards",
    desc: "Digital scoreboards visible from every seat. Real-time scores, period tracking, shot clocks.",
  },
  {
    icon: Video,
    title: "Game Film",
    desc: "Every game filmed, every play captured. Teams get footage to review and improve.",
  },
  {
    icon: BarChart3,
    title: "Stats & Analytics",
    desc: "Real-time stats tracking for every game. Points, rebounds, assists — all on record.",
  },
  {
    icon: UtensilsCrossed,
    title: "Snack Bar",
    desc: "Drinks, snacks, and game-day fuel available all day. Outside food welcome, no glass.",
  },
  {
    icon: Car,
    title: "Free Parking",
    desc: "Always free. No meters, no permits, no cost. If someone asks you to pay, it's not us.",
  },
];

const WHY_INSPIRE = [
  {
    icon: Shield,
    title: "Pro-Level Setup",
    desc: "College-quality courts, scoreboards, and game film — not a rec gym.",
  },
  {
    icon: Zap,
    title: "Year-Round Action",
    desc: "Tournaments, leagues, and open runs every month. Never an off season.",
  },
  {
    icon: Users,
    title: "Real Competition",
    desc: "500+ teams hosted. The best youth players in Arizona compete here.",
  },
];

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{
            backgroundImage:
              "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-navy" />
        {/* Subtle red glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.15),transparent_60%)]" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <AnimateIn>
            <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-8 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
              Est. Gilbert, AZ
            </span>
          </AnimateIn>

          <AnimateIn delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold uppercase tracking-tight text-white leading-[0.9] mb-8 font-[var(--font-chakra)] drop-shadow-[2px_4px_16px_rgba(0,0,0,0.5)]">
              Arizona&apos;s Premier
              <br />
              <span className="text-red drop-shadow-[0_0_30px_rgba(204,0,0,0.3)]">
                Indoor Basketball
              </span>
              <br />
              Facility
            </h1>
          </AnimateIn>

          <AnimateIn delay={200}>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              2 courts. Live scoreboards. Game film every game. Zero excuses.
            </p>
          </AnimateIn>

          <AnimateIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/events"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.04] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
              >
                Register for Next Event{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/facility"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all font-[var(--font-chakra)]"
              >
                Book the Facility{" "}
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
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wide">
                Next Event: OFF SZN Session 1 — May 2025
              </span>
            </div>
            <Link
              href="/events"
              className="group flex items-center gap-2 bg-white text-red px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide hover:bg-off-white transition-colors font-[var(--font-chakra)]"
            >
              Register Now{" "}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY INSPIRE COURTS (3 value props) ── */}
      <section className="py-16 bg-navy">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-white/10">
            {WHY_INSPIRE.map((item, i) => (
              <AnimateIn key={item.title} delay={i * 100}>
                <div className="flex items-start gap-4 px-8 py-6 md:py-0">
                  <div className="w-12 h-12 bg-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-red" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FACILITY FEATURES ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The Facility"
            title="Built for Competitors"
            description="Professional-grade courts, technology, and amenities designed for serious athletes."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FACILITY_FEATURES.map((feature, i) => (
              <AnimateIn key={feature.title} delay={i * 80}>
                <div className="group relative bg-white border border-light-gray rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  {/* Red accent stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center mb-5 shadow-md">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-navy font-[var(--font-chakra)] font-bold text-lg uppercase tracking-tight mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARALLAX MISSION ── */}
      <section
        className="relative py-32 lg:py-44 bg-fixed bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-navy/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(204,0,0,0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <span className="inline-block bg-red/20 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 font-[var(--font-chakra)] border border-red/30">
              Our Mission
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] leading-[0.95]">
              Two Brands.
              <br />
              One Mission.
            </h2>
            <p className="text-white/75 text-lg lg:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
              Inspire Courts is the home base. OFF SZN HOOPS is the tournament
              series. Together, we&apos;re elevating youth basketball in Arizona.
            </p>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
            >
              Our Story{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── DUAL BRAND CARDS ── */}
      <section className="py-20 lg:py-28 bg-off-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inspire Courts card */}
            <AnimateIn>
              <div className="relative bg-navy rounded-2xl p-8 lg:p-12 h-full flex flex-col text-white overflow-hidden group">
                {/* Background pattern */}
                <div
                  className="absolute inset-0 opacity-10 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-navy-dark" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-14 h-14 bg-red rounded-xl flex items-center justify-center mb-6 shadow-lg">
                    <span className="font-bold text-lg font-[var(--font-chakra)]">
                      IC
                    </span>
                  </div>
                  <span className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-2">
                    The Facility
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-bold uppercase tracking-tight mb-4 font-[var(--font-chakra)]">
                    Inspire Courts
                  </h3>
                  <p className="text-white/70 leading-relaxed mb-8 flex-1">
                    The home base. Two regulation indoor courts with live
                    scoreboards, game film, and a pro-level setup. Available for
                    leagues, practices, camps, clinics, and private events.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {["Courts", "Game Film", "Scoreboards", "Rentals"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-white/10 border border-white/20 text-white/80 px-3 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                  <Link
                    href="/facility"
                    className="group/btn inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wide transition-all self-start font-[var(--font-chakra)] shadow-lg"
                  >
                    Explore the Facility{" "}
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </AnimateIn>

            {/* OFF SZN card */}
            <AnimateIn delay={150}>
              <div className="relative bg-white border-2 border-light-gray rounded-2xl p-8 lg:p-12 h-full flex flex-col overflow-hidden group hover:border-red/30 transition-colors">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-14 h-14 bg-navy rounded-xl flex items-center justify-center mb-6 shadow-lg">
                    <Zap className="w-6 h-6 text-red" />
                  </div>
                  <span className="text-red font-[var(--font-chakra)] font-bold text-xs uppercase tracking-[0.2em] mb-2">
                    The Tournament Series
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-bold uppercase tracking-tight text-navy mb-4 font-[var(--font-chakra)]">
                    OFF SZN HOOPS
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-8 flex-1">
                    Compete at the highest level. Year-round youth basketball
                    tournaments with 10U through 17U divisions, boys and girls.
                    Get ranked. Get seen. Get better.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {["10U-17U", "Boys & Girls", "3+ Games", "Ranked"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-off-white border border-light-gray text-text-muted px-3 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                  <Link
                    href="/events"
                    className="group/btn inline-flex items-center gap-2 bg-navy hover:bg-navy-dark text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wide transition-all self-start font-[var(--font-chakra)] shadow-lg"
                  >
                    See Upcoming Events{" "}
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="relative py-20 bg-navy overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(204,0,0,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {[
              { num: "500+", label: "Teams Hosted" },
              { num: "30+", label: "Tournaments" },
              { num: "5,000+", label: "Players" },
              { num: "100%", label: "Game Film Coverage" },
            ].map((stat, i) => (
              <AnimateIn key={stat.label} delay={i * 100}>
                <div className="text-center">
                  <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-red font-[var(--font-chakra)] leading-none drop-shadow-[0_0_20px_rgba(204,0,0,0.2)]">
                    {stat.num}
                  </div>
                  <div className="text-xs md:text-sm text-white/60 uppercase tracking-[0.15em] mt-3 font-semibold font-[var(--font-chakra)]">
                    {stat.label}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>


      {/* ── LOCATION + CTA ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateIn>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-light-gray aspect-[4/3]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3331.1!2d-111.7897!3d33.3528!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDIxJzEwLjEiTiAxMTHCsDQ3JzIyLjkiVw!5e0!3m2!1sen!2sus!4v1234567890"
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
                  Come See It Live
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-red" />
                    </div>
                    <div>
                      <p className="font-bold text-navy">
                        1090 N Fiesta Blvd, Ste 101 & 102
                      </p>
                      <p className="text-text-muted text-sm">
                        Gilbert, AZ 85233
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-navy">
                        FREE Parking — Always
                      </p>
                      <p className="text-text-muted text-sm">
                        No meters, no permits, no cost
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-text-muted leading-relaxed mb-8">
                  Follow us on Instagram for game highlights, tournament recaps,
                  and behind-the-scenes content.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://instagram.com/inspirecourtsaz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-dark text-white px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all font-[var(--font-chakra)] shadow-md"
                  >
                    @inspirecourtsaz{" "}
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

      {/* ── FINAL CTA ── */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 to-navy/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(204,0,0,0.15),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] leading-[0.95]">
              Ready to{" "}
              <span className="text-red">Compete</span>?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              Register your team for the next OFF SZN HOOPS tournament. Spots
              fill fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/events"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
              >
                Register Now{" "}
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

      <div className="h-16 lg:hidden" />
    </>
  );
}
