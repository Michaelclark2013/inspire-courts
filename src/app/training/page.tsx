import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Target,
  Clock,
  Dumbbell,
  Brain,
  TrendingUp,
  Users,
  CheckCircle2,
} from "lucide-react";

const trainingSchema = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Inspire Courts AZ — Private Basketball Training",
  description:
    "1-on-1 and small group basketball training in Gilbert, AZ. Skill development, shooting, ball handling, and sport-specific work for all ages.",
  url: "https://inspirecourtsaz.com/training",
  telephone: "+14805551234",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1090 N Fiesta Blvd, Ste 101 & 102",
    addressLocality: "Gilbert",
    addressRegion: "AZ",
    postalCode: "85233",
    addressCountry: "US",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Basketball Training Sessions",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "1-on-1 Basketball Training",
          description: "Fully personalized sessions tailored to your player's strengths, weaknesses, and goals.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Small Group Training (2-4)",
          description: "Train with a small group for competitive drills and game-like situations.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Shooting Sessions",
          description: "Dedicated shooting workouts focused on form, footwork, consistency, and game-speed shooting.",
        },
      },
    ],
  },
};
import AnimateIn from "@/components/ui/AnimateIn";
import VideoShowcase from "@/components/ui/VideoShowcase";
import SectionHeader from "@/components/ui/SectionHeader";
import QuickContactBar from "@/components/ui/QuickContactBar";
import { getPageContent, getField, getList } from "@/lib/content";

export const metadata: Metadata = {
  title: "Private Basketball Training in Gilbert, AZ | Inspire Courts AZ",
  description:
    "1-on-1 and small group basketball training at Inspire Courts AZ. Skill development, shooting, ball handling, and sport-specific work for all ages.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/training",
  },
  openGraph: {
    title: "Private Basketball Training | Inspire Courts AZ",
    description: "1-on-1 and small group basketball training in Gilbert, AZ. Shooting, ball handling, basketball IQ, and position-specific development.",
    url: "https://inspirecourtsaz.com/training",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Courts AZ private basketball training" }],
  },
};

const TRAINING_OPTIONS = [
  {
    title: "1-on-1 Training",
    desc: "Fully personalized sessions tailored to your player's strengths, weaknesses, and goals. Maximum reps, maximum development.",
    features: ["Custom workout plan", "Film review included", "Flexible scheduling"],
    highlighted: true,
  },
  {
    title: "Small Group (2-4)",
    desc: "Train with a small group for competitive drills and game-like situations. Great for teammates who want to work together.",
    features: ["2-4 players per session", "Competitive drills", "Position-specific work"],
    highlighted: false,
  },
  {
    title: "Shooting Sessions",
    desc: "Dedicated shooting workouts focused on form, footwork, consistency, and game-speed shooting off screens and catches.",
    features: ["Form correction", "Game-speed reps", "Catch & shoot / off-dribble"],
    highlighted: false,
  },
];

const SKILLS = [
  { icon: Target, title: "Shooting", desc: "Form, footwork, range, and consistency from every spot on the floor." },
  { icon: Dumbbell, title: "Ball Handling", desc: "Tight handles, change of pace, crossovers, and finishing through contact." },
  { icon: Brain, title: "Basketball IQ", desc: "Read defenses, make the right play, and understand spacing and timing." },
  { icon: TrendingUp, title: "Athleticism", desc: "Speed, agility, vertical, and explosiveness training tailored to basketball." },
  { icon: Users, title: "Position Skills", desc: "Guard work, wing skills, or post moves — training specific to your position." },
  { icon: Clock, title: "Game Situations", desc: "Late-game scenarios, pressure free throws, and decision-making under fatigue." },
];

export default function TrainingPage() {
  const page = getPageContent("training");

  const cmsTrainingOptions = page ? getList(page, "Training Options") : [];

  const trainingOptions = TRAINING_OPTIONS.map((opt, i) => ({
    ...opt,
    title: cmsTrainingOptions[i]?.title ?? opt.title,
    desc: cmsTrainingOptions[i]?.description ?? opt.desc,
    features: cmsTrainingOptions[i]?.features
      ? cmsTrainingOptions[i].features.split(", ")
      : opt.features,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(trainingSchema) }}
      />
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/courts-bg.jpg" alt="Inspire Courts basketball training facility" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/75 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.12),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-6 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
              {page ? getField(page, "Hero", "badge") : "Get Better"}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg leading-[0.9]">
              {page ? getField(page, "Hero", "headline") : "Private Training"}
            </h1>
            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              {page ? getField(page, "Hero", "description") : "Koa Peat. Saben Lee. Cody Williams. They train here. So can you — same courts, same environment, same standard."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?type=Private+Training"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg font-[var(--font-chakra)]"
              >
                Book a Session{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#videos"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white hover:text-navy px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] font-[var(--font-chakra)]"
              >
                See Training Videos{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-navy border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {[
              { label: "10+ Years", sub: "Building Arizona basketball" },
              { label: "Pro-Level Training", sub: "Same floor, same results" },
              { label: "7 Courts", sub: "Regulation hardwood" },
              { label: "Gilbert, AZ", sub: "52,000 sq ft facility" },
            ].map(({ label, sub }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center justify-center py-5 px-4 text-center ${i < 3 ? "border-r border-white/10" : ""}`}
              >
                <span className="text-red font-bold text-sm font-[var(--font-chakra)] uppercase tracking-wide">{label}</span>
                <span className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Options */}
      <section className="py-14 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Programs"
            title="Training Options"
            description="Choose the format that fits your goals. Every session happens at Inspire Courts on regulation hardwood."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trainingOptions.map((opt, i) => (
              <AnimateIn key={opt.title} delay={i * 100}>
                <div
                  className={`relative rounded-2xl p-8 lg:p-10 h-full flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    opt.highlighted
                      ? "bg-navy text-white"
                      : "bg-white border border-light-gray"
                  }`}
                >
                  {opt.highlighted && (
                    <>
                      <Image src="/images/courts-bg-texture.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-center opacity-10" />
                      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-navy-dark" />
                      <span className="relative z-10 inline-block self-start bg-red text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 font-[var(--font-chakra)]">
                        Most Popular
                      </span>
                    </>
                  )}
                  <div className="relative z-10 flex flex-col h-full">
                    <h3
                      className={`font-[var(--font-chakra)] font-semibold text-xl uppercase tracking-tight mb-3 ${
                        opt.highlighted ? "text-white" : "text-navy"
                      }`}
                    >
                      {opt.title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed mb-6 flex-1 ${
                        opt.highlighted ? "text-white/70" : "text-text-muted"
                      }`}
                    >
                      {opt.desc}
                    </p>
                    <ul className="space-y-2 mb-6">
                      {opt.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 flex-shrink-0 ${
                              opt.highlighted ? "text-red" : "text-green-600"
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              opt.highlighted ? "text-white/80" : "text-text-muted"
                            }`}
                          >
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/contact?type=Private+Training"
                      className={`group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all font-[var(--font-chakra)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 shadow-md hover:shadow-lg hover:scale-[1.03] ${
                        opt.highlighted
                          ? "bg-red hover:bg-red-hover text-white focus-visible:ring-offset-navy shadow-[0_4px_20px_rgba(204,0,0,0.3)]"
                          : "bg-navy hover:bg-navy-dark text-white focus-visible:ring-offset-white"
                      }`}
                    >
                      Book Now{" "}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Skills We Develop */}
      <section className="py-14 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Development"
            title="Skills We Develop"
            description="Our trainers focus on the skills that translate directly to game performance."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SKILLS.map((skill, i) => (
              <AnimateIn key={skill.title} delay={i * 80}>
                <div className="group relative bg-white border border-light-gray rounded-2xl p-8 lg:p-10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center mb-5 shadow-md">
                    <skill.icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-navy font-[var(--font-chakra)] font-semibold text-lg uppercase tracking-tight mb-2">
                    {skill.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {skill.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Trainers */}
      <section className="py-14 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Coaching Staff"
            title="Meet the Trainers"
            description="Our trainers bring years of playing and coaching experience to every session."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Trainer 1",
                role: "Head Skills Trainer",
                credentials: [
                  "10+ years coaching experience",
                  "Former collegiate athlete",
                  "Specializes in guard development",
                ],
                photo: null,
              },
              {
                name: "Trainer 2",
                role: "Strength & Conditioning",
                credentials: [
                  "Certified strength & conditioning specialist",
                  "Youth athletic development focus",
                  "Speed and agility training",
                ],
                photo: null,
              },
              {
                name: "Trainer 3",
                role: "Skills Development Coach",
                credentials: [
                  "Former professional player",
                  "Shooting and footwork specialist",
                  "Works with all age groups",
                ],
                photo: null,
              },
            ].map((trainer, i) => (
              <AnimateIn key={trainer.name} delay={i * 100}>
                <div className="bg-off-white border border-light-gray rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-[4/3] bg-navy/10 flex items-center justify-center">
                    {trainer.photo ? (
                      <Image
                        src={trainer.photo}
                        alt={trainer.name}
                        width={400}
                        height={300}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 300px"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Users className="w-12 h-12 text-navy/40 mx-auto mb-2" />
                        <span className="text-navy/30 text-xs uppercase tracking-wider font-semibold">Photo Coming Soon</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-navy font-bold text-lg uppercase tracking-tight font-[var(--font-chakra)] mb-1">
                      {trainer.name}
                    </h3>
                    <p className="text-red text-xs font-bold uppercase tracking-[0.15em] font-[var(--font-chakra)] mb-4">
                      {trainer.role}
                    </p>
                    <ul className="space-y-2">
                      {trainer.credentials.map((cred) => (
                        <li key={cred} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-text-muted text-sm">{cred}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
          <p className="text-text-muted text-xs text-center mt-6">
            Trainer profiles are placeholders — real names, photos, and credentials coming soon.
          </p>
        </div>
      </section>

      {/* Koa Peat Headline Training Video */}
      <section className="py-14 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimateIn>
              <div>
                <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
                  #1 Recruit Trains Here
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-navy mb-6 font-[var(--font-chakra)] leading-[0.95]">
                  Koa Peat <span className="text-red">Trains at Inspire</span>
                </h2>
                <p className="text-text-muted text-lg leading-relaxed mb-6">
                  The #1 recruit in the nation trains at Inspire Courts. This is the same floor your kids train on — pro-level facility, pro-level results.
                </p>
                <Link
                  href="/contact?type=Private+Training"
                  className="group inline-flex items-center gap-2 text-red font-bold text-sm uppercase tracking-wide hover:text-navy transition-colors font-[var(--font-chakra)]"
                >
                  Book Your Session
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </AnimateIn>
            <AnimateIn delay={150}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-light-gray" style={{ aspectRatio: "16/9" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/FmcgFmICrf4?rel=0&modestbranding=1"
                  title="Koa Peat training at Inspire Courts"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* More Training Videos */}
      <section id="videos" className="py-14 lg:py-28 bg-off-white scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-10">
              <span className="inline-block bg-red/10 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
                Inside Look
              </span>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy font-[var(--font-chakra)] leading-[0.95]">
                Training Day at Inspire
              </h2>
            </div>
          </AnimateIn>
          <VideoShowcase
            videos={[
              { id: "HkiDY_bwRVw", title: "Saben Lee training at Inspire Courts", name: "Saben Lee", subtitle: "NBA · Training at Inspire" },
              { id: "S8HgOlyWnDg", title: "Cody Williams training at Inspire Courts", name: "Cody Williams", subtitle: "NBA · Training at Inspire" },
              { id: "OUkcMQd_aWM", title: "Cam Williams training at Inspire Courts", name: "Cam Williams", subtitle: "NBA Prospect · Training at Inspire" },
              { id: "iwla0gak5JU", title: "Zylan Cheatham training at Inspire Courts", name: "Zylan Cheatham", subtitle: "NBA · Training at Inspire" },
              { id: "mmbKaoOHzn4", title: "Jordan Burks training at Inspire Courts", name: "Jordan Burks", subtitle: "Training at Inspire" },
              { id: "EkIbBj3UDAg", title: "Recent training day at Inspire Courts", name: "Training Day", subtitle: "Recent Session at Inspire" },
            ]}
            initialCount={4}
            theme="light"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 lg:py-32 overflow-hidden">
        <Image src="/images/courts-bg-texture.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 to-navy/85" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] leading-[0.95]">
              Ready to <span className="text-red">Level Up</span>?
            </h2>
            <p className="text-white/70 text-lg mb-4 max-w-xl mx-auto">
              Koa Peat, Saben Lee, Cody Williams, and Zylan Cheatham have all put in work on these courts. Your session starts here.
            </p>
            <p className="text-white/40 text-sm mb-10 max-w-md mx-auto">
              All ages and skill levels welcome. 1-on-1, small group, and shooting sessions available.
            </p>
            <Link
              href="/contact?type=Private+Training"
              className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 sm:px-10 sm:py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] shadow-[0_4px_24px_rgba(204,0,0,0.4)] font-[var(--font-chakra)]"
            >
              Book a Session{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-6 text-center font-[var(--font-chakra)]">
            You Might Also Like
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/teams"
              className="group flex items-center justify-between bg-off-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all cursor-pointer"
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
              href="/events"
              className="group flex items-center justify-between bg-off-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Tournaments
                </p>
                <p className="text-text-muted text-xs mt-0.5">Compete in OFF SZN HOOPS events</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/prep"
              className="group flex items-center justify-between bg-off-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Inspire Prep
                </p>
                <p className="text-text-muted text-xs mt-0.5">Full-time basketball prep school program</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <QuickContactBar subject="Private Training" label="Train with us?" />
      <div className="h-32 lg:hidden" />
    </>
  );
}
