import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Video,
  Camera,
  Film,
  Scissors,
  Share2,
  Mic,
  CheckCircle2,
  Heart,
  PartyPopper,
  ExternalLink,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import VideoShowcase from "@/components/ui/VideoShowcase";
import SectionHeader from "@/components/ui/SectionHeader";
import BackToTop from "@/components/ui/BackToTop";
import QuickContactBar from "@/components/ui/QuickContactBar";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Basketball Media Services | Highlights, Film & Content | Inspire Courts AZ",
  description:
    "Professional basketball media services — game film, highlight reels, mixtapes, player profiles, and social media content. Powered by @AZFinestMixtape.",
  alternates: {
    canonical: `${SITE_URL}/media`,
  },
  openGraph: {
    title: "Basketball Media Services | @AZFinestMixtape",
    description: "Professional game film, highlight reels, mixtapes, and social media content for youth basketball players.",
    url: `${SITE_URL}/media`,
    images: [{ url: `${SITE_URL}/images/hero-bg.jpg`, width: 1200, height: 630, alt: "AZFinestMixtape basketball media services" }],
  },
};

const SERVICES = [
  {
    icon: Video,
    title: "Game Film",
    desc: "Full-game recordings available at tournaments. Multi-angle coverage, clean audio, and delivered within 48 hours. Paid service.",
    included: false,
  },
  {
    icon: Film,
    title: "Highlight Reels",
    desc: "Custom highlight packages for individual players. Perfect for recruiting profiles, social media, and college coaches.",
    included: false,
  },
  {
    icon: Camera,
    title: "Event Photography",
    desc: "Professional game-day photography for tournaments and events. Action shots, team photos, and social media assets.",
    included: false,
  },
  {
    icon: Scissors,
    title: "Mixtapes",
    desc: "Full mixtape edits with music, effects, and professional post-production. Showcasing your best plays in cinematic style.",
    included: false,
  },
  {
    icon: Share2,
    title: "Social Media Content",
    desc: "Short-form content optimized for Instagram, TikTok, and YouTube. Reels, stories, and posts that get engagement.",
    included: false,
  },
  {
    icon: Mic,
    title: "Player Profiles",
    desc: "Interview-style player profile videos. Stats, highlights, and a personal story — everything a coach needs to see.",
    included: false,
  },
];

const PACKAGES = [
  {
    name: "Game Film",
    tagline: "Available at tournaments",
    features: [
      "Full-game recording",
      "Both courts covered",
      "Delivered within 48 hours",
      "Digital download link",
    ],
    cta: "Get a Quote",
    highlighted: false,
    free: false,
  },
  {
    name: "Player Highlight",
    tagline: "Stand out to college coaches",
    features: [
      "Custom highlight reel (3-5 min)",
      "Professional editing & music",
      "Multiple game clips compiled",
      "Recruiting-ready format",
      "Digital download + shareable link",
    ],
    cta: "Get a Quote",
    highlighted: true,
    free: false,
  },
  {
    name: "Full Mixtape",
    tagline: "The ultimate showcase",
    features: [
      "Cinematic mixtape edit",
      "Professional color grading",
      "Custom music & effects",
      "Player interview segment",
      "Social media cuts included",
      "YouTube-ready format",
    ],
    cta: "Get a Quote",
    highlighted: false,
    free: false,
  },
];

export default function MediaPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/courts-bg.jpg" alt="Inspire Courts media and highlights" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/75 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(204,0,0,0.15),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-6 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
              @AZFinestMixtape
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg leading-[0.9]">
              Media
              <br />
              <span className="text-red">Services</span>
            </h1>
            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Professional basketball media — game film, highlights, mixtapes,
              and content that gets your player seen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?type=Media+Services"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg font-[var(--font-chakra)]"
              >
                Get a Quote{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
              <a
                href="https://www.youtube.com/@AZFinestMixtape"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/60 text-white hover:bg-white hover:text-navy px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all font-[var(--font-chakra)]"
              >
                Watch on YouTube{" "}
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-14 lg:py-28 bg-white" aria-label="Media services offered">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="What We Offer"
            title="Media Services"
            description="From basic game film to full cinematic mixtapes — we cover every level of basketball content."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, i) => (
              <AnimateIn key={service.title} delay={i * 80}>
                <div className="group relative bg-white border border-light-gray rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  {service.included && (
                    <span className="inline-block bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 border border-green-200">
                      Included Free
                    </span>
                  )}
                  <div className="w-14 h-14 bg-gradient-to-br from-navy to-navy-dark rounded-xl flex items-center justify-center mb-5 shadow-md">
                    <service.icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-navy font-[var(--font-chakra)] font-bold text-lg uppercase tracking-tight mb-3">
                    {service.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-14 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Packages"
            title="Choose Your Package"
            description="Professional game film and media packages available at tournaments and events."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKAGES.map((pkg, i) => (
              <AnimateIn key={pkg.name} delay={i * 100}>
                <div
                  className={`relative rounded-2xl p-8 h-full flex flex-col overflow-hidden ${
                    pkg.highlighted
                      ? "bg-navy text-white"
                      : "bg-white border border-light-gray"
                  }`}
                >
                  {pkg.highlighted && (
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
                      className={`font-[var(--font-chakra)] font-bold text-xl uppercase tracking-tight mb-1 ${
                        pkg.highlighted ? "text-white" : "text-navy"
                      }`}
                    >
                      {pkg.name}
                    </h3>
                    <p
                      className={`text-sm mb-6 ${
                        pkg.highlighted ? "text-white/60" : "text-text-muted"
                      }`}
                    >
                      {pkg.tagline}
                    </p>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {pkg.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                              pkg.highlighted ? "text-red" : "text-green-600"
                            }`}
                            aria-hidden="true"
                          />
                          <span
                            className={`text-sm ${
                              pkg.highlighted ? "text-white/80" : "text-text-muted"
                            }`}
                          >
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {pkg.free ? (
                      <div className="bg-green-50 text-green-700 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide text-center font-[var(--font-chakra)] border border-green-200">
                        Included with Tournaments
                      </div>
                    ) : (
                      <Link
                        href="/contact?type=Media+Services"
                        className={`group inline-flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all font-[var(--font-chakra)] ${
                          pkg.highlighted
                            ? "bg-red hover:bg-red-hover text-white"
                            : "bg-navy hover:bg-navy-dark text-white"
                        }`}
                      >
                        {pkg.cta}{" "}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Work — Video Showcase */}
      <section className="py-14 lg:py-28 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="text-center mb-10">
              <span className="inline-block bg-red/20 text-red text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-4 font-[var(--font-chakra)]">
                Sample Work
              </span>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white font-[var(--font-chakra)] leading-[0.95]">
                See What We <span className="text-red">Produce</span>
              </h2>
              <p className="text-white/60 mt-4 max-w-xl mx-auto">
                Mixtapes, player highlights, and tournament coverage from @AZFinestMixtape — this is the quality you&apos;re booking.
              </p>
            </div>
          </AnimateIn>
          <VideoShowcase
            videos={[
              { id: "ENl-hXQbEo8", title: "Thompson Twins mixtape", name: "Thompson Twins", subtitle: "NBA · AZFinestMixtape" },
              { id: "5WFbsqEQxDE", title: "Team Inspire headline video", name: "Team Inspire", subtitle: "Tournament Highlight" },
              { id: "cOD4jknl2-E", title: "Team Inspire highlights", name: "Team Inspire", subtitle: "Game Highlights" },
              { id: "mmbKaoOHzn4", title: "Player training highlight", name: "Player Highlight", subtitle: "Training at Inspire" },
              { id: "X3okI0F8RDE", title: "Inspire Prep — Oba", name: "Inspire Prep — Oba", subtitle: "Player Feature", aspect: "9/16" },
              { id: "HXmJvuzzPxg", title: "Inspire Prep 2030", name: "Inspire Prep 2030", subtitle: "Program Highlight", aspect: "9/16" },
            ]}
            initialCount={4}
            theme="dark"
          />
        </div>
      </section>

      {/* Beyond Basketball — Wedding & Event Videography */}
      <section className="py-14 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateIn>
              <div>
                <span className="inline-block bg-navy/5 text-navy text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-5 font-[var(--font-chakra)]">
                  Beyond the Court
                </span>
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy mb-5 font-[var(--font-chakra)] leading-[0.95]">
                  We Shoot More Than <span className="text-red">Hoops</span>
                </h2>
                <p className="text-text-muted leading-relaxed mb-6">
                  The same team behind @AZFinestMixtape also produces
                  professional videography for weddings, quinceañeras,
                  corporate events, and private celebrations. Cinematic quality,
                  same creative eye.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-red" aria-hidden="true" />
                    </div>
                    <span className="text-navy text-sm font-semibold">
                      Wedding Films & Highlight Reels
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <PartyPopper className="w-4 h-4 text-red" aria-hidden="true" />
                    </div>
                    <span className="text-navy text-sm font-semibold">
                      Quinceañeras, Birthdays & Private Events
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4 text-red" aria-hidden="true" />
                    </div>
                    <span className="text-navy text-sm font-semibold">
                      Corporate & Promotional Video
                    </span>
                  </div>
                </div>
                <Link
                  href="/contact?type=Event+Videography"
                  className="group inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-dark text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all font-[var(--font-chakra)]"
                >
                  Inquire About Event Videography{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </div>
            </AnimateIn>
            <AnimateIn delay={200}>
              <div className="relative">
                <div className="bg-off-white border border-light-gray rounded-2xl p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-red to-red-hover rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Camera className="w-10 h-10 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-navy font-bold text-lg uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
                    Same Team. Different Stage.
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed mb-6">
                    Our videographers bring the same energy and production
                    quality from courtside to your biggest life moments.
                  </p>
                  <a
                    href="https://instagram.com/azfinestmixtape"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red hover:text-red-hover text-sm font-bold uppercase tracking-wide transition-colors"
                  >
                    See our portfolio on Instagram &rarr;
                  </a>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Instagram CTA */}
      <section className="relative py-16 lg:py-32 overflow-hidden">
        <Image src="/images/courts-bg-texture.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 to-navy/85" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <div className="w-16 h-16 bg-red/20 rounded-xl flex items-center justify-center mx-auto mb-6 border border-red/30">
              <Camera className="w-8 h-8 text-red" aria-hidden="true" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] leading-[0.95]">
              See Our <span className="text-red">Work</span>
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              Follow @AZFinestMixtape for highlights, mixtapes, and the best
              plays from Arizona&apos;s youth basketball scene.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <a
                href="https://instagram.com/azfinestmixtape"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg font-[var(--font-chakra)]"
              >
                @AZFinestMixtape{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </a>
              <a
                href="https://www.youtube.com/@AZFinestMixtape"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/60 text-white hover:bg-white hover:text-navy px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all font-[var(--font-chakra)]"
              >
                YouTube Channel{" "}
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </a>
              <Link
                href="/contact?type=Media+Services"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/60 text-white hover:bg-white hover:text-navy px-10 py-5 rounded-full font-bold text-sm uppercase tracking-wide transition-all font-[var(--font-chakra)]"
              >
                Request Media Services{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </AnimateIn>
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
              href="/gallery"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Gallery
                </p>
                <p className="text-text-muted text-xs mt-0.5">Tournament action and facility photos</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="/events"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Tournaments
                </p>
                <p className="text-text-muted text-xs mt-0.5">Upcoming OFF SZN HOOPS events</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="/contact?type=Media+Services"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Get a Quote
                </p>
                <p className="text-text-muted text-xs mt-0.5">Request media services for your player</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <QuickContactBar subject="Media Services" label="Need a quote?" />
      <BackToTop />
      <div className="h-32 lg:hidden" />
    </>
  );
}
