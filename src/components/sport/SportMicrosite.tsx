import Link from "next/link";
import { ArrowRight, Check, MessageSquare, Phone } from "lucide-react";
import type { SportConfig } from "@/lib/sport-microsites";

// Server-rendered (no "use client") so each sport page is fully
// statically generated for SEO. The inquiry CTAs deep-link into the
// already-built /inquire/[slug] forms with a `source` param so we
// can attribute leads back to the sport page they came from.

export function SportMicrosite({ config }: { config: SportConfig }) {
  return (
    <main className="min-h-screen bg-off-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-navy/85 text-white relative overflow-hidden">
        {/* Layered visual depth: red blur orb + subtle dot grid + bottom-edge fade */}
        <div aria-hidden className="absolute -right-20 -top-20 w-[500px] h-[500px] rounded-full bg-red/20 blur-3xl" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div aria-hidden className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-navy/70 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.3em] mb-3">{config.hero.eyebrow}</p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-heading mb-5 max-w-3xl leading-[1.05]">
            {config.hero.headline}
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mb-8">{config.hero.body}</p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href={`/inquire/${config.hero.primaryCta.slug}?source=${config.slug}-hero`}
              className="bg-red hover:bg-red-hover text-white font-bold uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy transition-colors"
            >
              {config.hero.primaryCta.label} <ArrowRight className="w-4 h-4" />
            </Link>
            {config.hero.secondaryCta && (
              <Link
                href={`/inquire/${config.hero.secondaryCta.slug}?source=${config.slug}-hero`}
                className="bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy transition-colors"
              >
                {config.hero.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {config.stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold font-heading text-navy">{s.value}</p>
              <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] font-bold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pitch */}
      <section className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {config.pitch.map((p, i) => (
          <p key={i} className="text-navy text-base sm:text-lg leading-relaxed mb-4">{p}</p>
        ))}
      </section>

      {/* Programs grid */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-text-muted text-[11px] uppercase tracking-[0.3em] mb-2 text-center">Programs</p>
        <h2 className="text-3xl sm:text-4xl font-bold font-heading text-center text-navy mb-10">
          What you can do at Inspire
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.programs.map((p) => (
            <Link
              key={p.title}
              href={`/inquire/${p.inquireSlug}?source=${config.slug}-${p.inquireSlug}`}
              className="group bg-white border border-border hover:border-red/40 rounded-2xl p-5 shadow-sm transition-all block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 hover:shadow-md hover:-translate-y-0.5"
            >
              {p.badge && (
                <span className="inline-block bg-red/10 text-red text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                  {p.badge}
                </span>
              )}
              <h3 className="text-navy font-bold text-lg mb-2 group-hover:text-red transition-colors">{p.title}</h3>
              <p className="text-text-muted text-sm mb-3">{p.body}</p>
              <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-red font-bold">
                Inquire <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-text-muted text-[11px] uppercase tracking-[0.3em] mb-2 text-center">FAQ</p>
        <h2 className="text-3xl sm:text-4xl font-bold font-heading text-center text-navy mb-10">
          Common questions
        </h2>
        <div className="space-y-3">
          {config.faqs.map((f) => (
            <details key={f.q} className="group bg-white border border-border rounded-2xl p-5 shadow-sm hover:border-red/30 transition-colors">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2">
                <span className="text-navy font-bold pr-4">{f.q}</span>
                <span className="text-red text-2xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="text-text-muted text-sm mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold font-heading mb-4">
            Ready to get started?
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Tell us what you need. A real person from our team will text you back within 30 minutes during business hours.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={`/inquire/${config.hero.primaryCta.slug}?source=${config.slug}-bottom`}
              className="bg-red hover:bg-red-hover text-white font-bold uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Start an inquiry
            </Link>
            <a
              href="tel:+14805550100"
              className="bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy transition-colors"
            >
              <Phone className="w-4 h-4" />
              (480) 555-0100
            </a>
          </div>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] mt-6 flex items-center justify-center gap-2">
            <Check className="w-3 h-3" /> 30-min response · Mon-Fri 8a-7p
          </p>
        </div>
      </section>
    </main>
  );
}
