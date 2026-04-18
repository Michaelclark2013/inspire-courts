import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  DollarSign,
  Users,
  ShieldCheck,
  Calendar,
  MapPin,
} from "lucide-react";

const openGymSchema = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Inspire Courts AZ — Open Gym Basketball",
  description:
    "Drop-in open gym basketball at Inspire Courts in Gilbert, AZ. Regulation hardwood courts, climate-controlled facility. Weekdays 10am–3:30pm.",
  url: "https://inspirecourtsaz.com/open-gym",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1090 N Fiesta Blvd, Ste 101 & 102",
    addressLocality: "Gilbert",
    addressRegion: "AZ",
    postalCode: "85233",
    addressCountry: "US",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "15:30",
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Open Gym Pricing",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Single Session",
        price: "10",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "5-Pack",
        price: "40",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Monthly Pass",
        price: "75",
        priceCurrency: "USD",
      },
    ],
  },
};
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import BackToTop from "@/components/ui/BackToTop";
import QuickContactBar from "@/components/ui/QuickContactBar";
import { FACILITY_EMAIL, FACILITY_PHONE, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Open Gym | Inspire Courts AZ",
  description:
    "Drop-in open gym basketball at Inspire Courts in Gilbert, AZ. Regulation hardwood courts, climate-controlled facility. Check the schedule and drop in.",
  alternates: {
    canonical: `${SITE_URL}/open-gym`,
  },
  openGraph: {
    title: "Open Gym | Inspire Courts AZ",
    description:
      "Drop-in open gym basketball at Inspire Courts. Regulation hardwood, climate-controlled, Gilbert AZ.",
    url: `${SITE_URL}/open-gym`,
    images: [
      {
        url: `${SITE_URL}/images/hero-bg.jpg`,
        width: 1200,
        height: 630,
        alt: "Open Gym at Inspire Courts AZ",
      },
    ],
  },
};

const SCHEDULE = [
  { day: "Monday", time: "10:00 AM – 3:30 PM", note: "" },
  { day: "Tuesday", time: "10:00 AM – 3:30 PM", note: "" },
  { day: "Wednesday", time: "10:00 AM – 3:30 PM", note: "" },
  { day: "Thursday", time: "10:00 AM – 3:30 PM", note: "" },
  { day: "Friday", time: "10:00 AM – 3:30 PM", note: "" },
  { day: "Saturday", time: "Inquire", note: "Contact us for weekend hours" },
  { day: "Sunday", time: "Inquire", note: "Contact us for weekend hours" },
];

const RULES = [
  "Must check in at the front desk before entering courts",
  "Proper basketball shoes required — no sandals, boots, or street shoes",
  "No hanging on rims",
  "No profanity or unsportsmanlike conduct",
  "All minors must have a signed waiver on file",
  "Inspire Courts reserves the right to remove anyone at any time",
  "Not responsible for lost or stolen items",
];

export default function OpenGymPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(openGymSchema) }}
      />
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-bg.jpg"
          alt="Open gym basketball at Inspire Courts AZ"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              Drop In & Play
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              Open Gym
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Lace up and get runs in on regulation hardwood. No team required — just show up, check in, and play.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-navy border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {[
              { icon: DollarSign, label: "Drop-In Pricing", sub: "See details below" },
              { icon: Clock, label: "Weekday Hours", sub: "10am–3:30pm" },
              { icon: Users, label: "All Skill Levels", sub: "Runs for everyone" },
              { icon: MapPin, label: "Gilbert, AZ", sub: "52,000 sq ft facility" },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center justify-center py-5 px-4 text-center ${i < 3 ? "border-r border-white/10" : ""}`}
              >
                <Icon className="w-4 h-4 text-red mb-1" aria-hidden="true" />
                <span className="text-white font-bold text-xs font-[var(--font-chakra)] uppercase tracking-wide">{label}</span>
                <span className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-14 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Schedule"
            title="Open Gym Hours"
            description="Weekdays 10 AM – 3:30 PM. For evenings, weekends, and holiday hours, please contact us. Schedule subject to change during tournaments."
          />
          <AnimateIn>
            <div className="bg-off-white border border-light-gray rounded-2xl overflow-hidden">
              {SCHEDULE.map((item, i) => (
                <div
                  key={item.day}
                  className={`flex items-center justify-between px-6 py-4 ${
                    i < SCHEDULE.length - 1 ? "border-b border-light-gray" : ""
                  } ${item.time === "Inquire" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-red flex-shrink-0" aria-hidden="true" />
                    <span className="text-navy font-bold text-sm uppercase tracking-wide font-[var(--font-chakra)]">
                      {item.day}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-navy text-sm font-semibold">{item.time}</span>
                    {item.note && (
                      <span className="text-text-muted text-xs block">{item.note}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-text-muted text-xs text-center mt-4">
              For evening sessions, weekends, or special events — call or message us to check availability.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-14 lg:py-24 bg-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Pricing"
            title="Drop-In Rates"
            description="Pay at the door — cash and card accepted."
          />
          <AnimateIn>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "Single Session", price: "$10", sub: "Per player, per visit" },
                { label: "5-Pack", price: "$40", sub: "5 sessions — save $10" },
                { label: "Monthly Pass", price: "$75", sub: "Unlimited open gym" },
              ].map((tier) => (
                <div
                  key={tier.label}
                  className="bg-white border border-light-gray rounded-2xl p-6 text-center hover:shadow-md hover:border-red/30 transition-all"
                >
                  <p className="text-text-muted text-xs font-bold uppercase tracking-[0.2em] mb-2 font-[var(--font-chakra)]">
                    {tier.label}
                  </p>
                  <p className="text-navy text-4xl font-bold font-[var(--font-chakra)]">
                    {tier.price}
                  </p>
                  <p className="text-text-muted text-sm mt-2">{tier.sub}</p>
                </div>
              ))}
            </div>
            <p className="text-text-muted text-xs text-center mt-4">
              Pricing is placeholder — contact us for current rates.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Rules */}
      <section className="py-14 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="House Rules"
            title="Know Before You Go"
            description="Keep it respectful, keep it competitive."
          />
          <AnimateIn>
            <div className="space-y-3">
              {RULES.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-off-white border border-light-gray rounded-xl px-5 py-4"
                >
                  <ShieldCheck className="w-4 h-4 text-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-navy text-sm">{rule}</p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 lg:py-20 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-4 font-[var(--font-chakra)]">
              Ready to Run?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              No signup needed for open gym — just show up during scheduled hours. For private bookings or group events, get in touch.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Book a Private Court <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-white/40 hover:border-white/70 text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors hover:bg-white/5"
              >
                Contact Us
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      <QuickContactBar subject="Open Gym" label="Questions about open gym?" />
      <BackToTop />
      <div className="h-32 lg:hidden" />
    </>
  );
}
