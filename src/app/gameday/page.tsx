import type { Metadata } from "next";
import { FACILITY_EMAIL } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import { getPageContent, getField } from "@/lib/content";
import {
  MapPin,
  Ticket,
  ClipboardCheck,
  Calendar,
  UtensilsCrossed,
  HeartPulse,
  CloudSun,
  ShieldAlert,
  HelpCircle,
  Car,
  ArrowRight,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import BackToTop from "@/components/ui/BackToTop";

export const metadata: Metadata = {
  title: "Game Day Info | Inspire Courts AZ",
  description:
    "Everything you need for game day at Inspire Courts AZ. Location, parking, admission, check-in, schedules, food, house rules, and more. Gilbert, AZ.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/gameday",
  },
  openGraph: {
    title: "Game Day Info | Inspire Courts AZ",
    description: "Location, parking, admission, check-in, schedules, food, and house rules for game day at Inspire Courts AZ.",
    url: "https://inspirecourtsaz.com/gameday",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Courts AZ game day" }],
  },
};

const INFO_SECTIONS = [
  {
    icon: MapPin,
    title: "Location",
    content: "1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233",
    map: true,
    highlight: false,
  },
  {
    icon: Ticket,
    title: "Spectator Admission",
    content:
      "Admission at the door — cash and card accepted. Kids under 5 free.",
    highlight: false,
  },
  {
    icon: ClipboardCheck,
    title: "Player & Team Check-In",
    content:
      "Head coaches check in at the front table with a valid ID. Rosters must be submitted before your first game.",
    highlight: false,
  },
  {
    icon: Calendar,
    title: "Schedule & Brackets",
    content:
      "Schedules drop 48 hours before tip-off. Check the Schedule page or your email.",
    highlight: false,
  },
  {
    icon: UtensilsCrossed,
    title: "Food & Drinks",
    content:
      "Snack bar is open all day. No outside food or beverages permitted. No coolers or ice chests.",
    highlight: false,
  },
  {
    icon: HeartPulse,
    title: "First Aid",
    content:
      "Basic first aid is available on-site. For emergencies, call 911.",
    highlight: false,
  },
  {
    icon: CloudSun,
    title: "Weather Policy",
    content:
      "We're indoors — games happen rain or shine. In the event of a cancellation, all registered coaches will be notified by email and text.",
    highlight: false,
  },
  {
    icon: ShieldAlert,
    title: "House Rules",
    content:
      "No hanging on rims. No profanity. All children must be supervised by an adult at all times. Not responsible for lost or stolen items. Unattended items will be removed by security. Inspire Courts reserves the right to remove anyone.",
    highlight: false,
  },
  {
    icon: HelpCircle,
    title: "Need Help?",
    content:
      `Email ${FACILITY_EMAIL} or find any staff member in an Inspire Courts shirt.`,
    highlight: false,
  },
];

export default function GameDayPage() {
  const page = getPageContent("gameday");

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/courts-bg.jpg" alt="Inspire Courts indoor basketball facility on game day" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              {page ? getField(page, "Hero", "badge") : "Be Ready"}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              {page ? getField(page, "Hero", "headline") : "Game Day Info"}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              {page ? getField(page, "Hero", "description") : "Everything you need to know before you walk through the doors."}
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-14 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {INFO_SECTIONS.map((section, i) => (
            <AnimateIn key={section.title} delay={i * 60}>
              <div
                className={`bg-white border rounded-xl p-6 lg:p-8 flex gap-4 lg:gap-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                  section.highlight
                    ? "border-red/40 bg-red/5"
                    : "border-light-gray hover:border-red/20"
                }`}
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      section.highlight
                        ? "bg-red/20 text-red"
                        : "bg-navy text-white"
                    }`}
                  >
                    <section.icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h3 className="text-navy font-bold text-sm uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
                    {section.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {section.content}
                  </p>
                  {section.map && (
                    <div className="mt-4 bg-off-white border border-light-gray rounded-xl overflow-hidden aspect-[16/9]">
                      <iframe
                        src="https://maps.google.com/maps?q=1090+N+Fiesta+Blvd+Ste+101+%26+102+Gilbert+AZ+85233&output=embed&z=16"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Inspire Courts AZ Location"
                        aria-label="Google Maps showing Inspire Courts AZ at 1090 N Fiesta Blvd, Gilbert, AZ"
                      />
                    </div>
                  )}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* Getting Here */}
      <section className="py-16 bg-navy" aria-label="Getting here and parking">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red rounded-full flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-white font-bold text-sm uppercase tracking-[0.15em] font-[var(--font-chakra)]">
                Getting Here & Parking
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">Address</h3>
                <p className="text-white text-sm leading-relaxed">1090 N Fiesta Blvd<br />Ste 101 &amp; 102<br />Gilbert, AZ 85233</p>
              </div>
              <div>
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">Parking</h3>
                <p className="text-white/80 text-sm leading-relaxed">Free parking in the lot directly in front of the building. Enter from Fiesta Blvd. Look for the Inspire Courts signage.</p>
              </div>
              <div>
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">Entrance</h3>
                <p className="text-white/80 text-sm leading-relaxed">Enter through Suite 101 &amp; 102. Staff in Inspire Courts shirts are at the entrance on event days.</p>
              </div>
              <div>
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">From US-60</h3>
                <p className="text-white/80 text-sm leading-relaxed">Exit at Gilbert Rd south → right on Guadalupe Rd → left on Fiesta Blvd. Facility is on the right.</p>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-12 bg-off-white border-t border-light-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-text-muted text-xs font-bold uppercase tracking-[0.2em] mb-5 text-center font-[var(--font-chakra)]">
            Related Pages
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/events", label: "Tournaments" },
              { href: "/schedule", label: "Schedules" },
              { href: "/facility", label: "Facility" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-center gap-1.5 bg-white border border-light-gray hover:border-red/40 hover:text-red text-navy text-xs font-bold uppercase tracking-wide py-3 px-4 rounded-xl transition-colors font-[var(--font-chakra)]"
              >
                {link.label} <ArrowRight className="w-3 h-3 opacity-60" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BackToTop />
      <div className="h-16 lg:hidden" />
    </>
  );
}
