import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Clock, Shield, Phone } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import BackToTop from "@/components/ui/BackToTop";
import BookingForm from "./BookingForm";

export const metadata: Metadata = {
  title: "Book the Facility | Inspire Courts AZ",
  description:
    "Book Inspire Courts in Gilbert, AZ for leagues, practices, tournaments, and private events. 7 regulation indoor courts.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/book",
  },
  openGraph: {
    title: "Book the Facility | Inspire Courts AZ",
    description: "Rent Inspire Courts in Gilbert, AZ for leagues, practices, tournaments, and private events. 7 regulation indoor courts available.",
    url: "https://inspirecourtsaz.com/book",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Courts AZ indoor facility for rent" }],
  },
};

const FEATURES = [
  { icon: MapPin, label: "7 Courts", desc: "Regulation hardwood" },
  { icon: Shield, label: "Climate Controlled", desc: "Year-round comfort" },
  { icon: Clock, label: "Flexible Hours", desc: "Book by appointment" },
  { icon: Phone, label: "(480) 221-7218", desc: "Call to book" },
];

const RELATED_PAGES = [
  {
    href: "/facility",
    label: "The Facility",
    desc: "Tour the 52,000 sq ft complex",
  },
  {
    href: "/contact",
    label: "Contact Us",
    desc: "Get in touch with our team",
  },
  {
    href: "/events",
    label: "Tournaments",
    desc: "Register for OFF SZN HOOPS events",
  },
];

export default function BookPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] lg:min-h-[70vh] flex items-center overflow-hidden">
        <Image
          src="/images/courts-bg.jpg"
          alt="Inspire Courts basketball facility interior"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.12),transparent_60%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-28 lg:py-36">
          <AnimateIn>
            <div className="max-w-3xl">
              <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
                Book Now
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg leading-[0.9]">
                Book the Facility
              </h1>
              <p className="text-white/70 text-lg max-w-xl leading-relaxed">
                Reserve courts for your team, league, camp, or private event. 7 regulation courts, climate controlled, pro-level setup.
              </p>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-off-white border-y border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className={`flex items-center gap-3 py-5 px-4 lg:px-6 ${
                  i < FEATURES.length - 1 ? "border-r border-light-gray" : ""
                }`}
              >
                <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-navy font-bold text-sm font-[var(--font-chakra)] uppercase tracking-wide leading-tight">
                    {label}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="mb-10 text-center">
              <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-3 font-[var(--font-chakra)]">
                Reservations
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-navy font-[var(--font-chakra)] leading-[0.95]">
                Request a Booking
              </h2>
              <p className="text-text-muted mt-4 text-base max-w-xl mx-auto leading-relaxed">
                Fill out the form below and we&apos;ll follow up to confirm your reservation. For urgent inquiries, call{" "}
                <a href="tel:+14802217218" className="text-red font-semibold hover:underline">
                  (480) 221-7218
                </a>
                .
              </p>
            </div>
          </AnimateIn>
          <AnimateIn delay={150}>
            <BookingForm />
          </AnimateIn>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-14 lg:py-20 bg-off-white border-t border-light-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-6 text-center font-[var(--font-chakra)]">
            Explore More
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {RELATED_PAGES.map(({ href, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
              >
                <div>
                  <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                    {label}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BackToTop />
      <div className="h-20 lg:hidden" />
    </>
  );
}
