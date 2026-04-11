"use client";

import { useState } from "react";
import { FACILITY_EMAIL, SOCIAL_LINKS } from "@/lib/constants";
import Link from "next/link";
import { ChevronDown, ArrowRight, Calendar, HelpCircle } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import BackToTop from "@/components/ui/BackToTop";
import { cn } from "@/lib/utils";

const FAQ_CATEGORIES = [
  {
    category: "Tournament Registration",
    items: [
      {
        q: "How do I register for a tournament?",
        a: "Visit our LeagueApps page at inspirecourts.leagueapps.com/tournaments. Select your event, choose your division, complete the registration form with your team name and coach contact info, and submit payment. You'll receive a confirmation email once registered.",
      },
      {
        q: "How do I register a team?",
        a: "Coaches register on behalf of their team. Go to our LeagueApps page, select the tournament, pick your age/gender division, fill in your team and coach details, and pay the entry fee. Registration is not complete until payment is received.",
      },
      {
        q: "What age group divisions do you offer?",
        a: "We run divisions from 10U through 17U, for both boys and girls. Division availability varies by event — check the specific tournament listing on LeagueApps for available divisions. If you don't see your division, contact us and we may be able to accommodate.",
      },
      {
        q: "What payment methods do you accept?",
        a: "Tournament registrations are processed online through LeagueApps and accept all major credit and debit cards. For in-person purchases (admission, concessions, facility rentals), we accept both cash and card.",
      },
    ],
  },
  {
    category: "Facility Rentals",
    items: [
      {
        q: "How much does it cost to rent the facility?",
        a: `Pricing depends on the number of courts, rental duration, and event type. We offer competitive rates for practices, leagues, private tournaments, camps, clinics, and corporate events. Fill out our booking form or email ${FACILITY_EMAIL} for a custom quote.`,
      },
      {
        q: "How do I book the facility?",
        a: "Fill out the booking request form at inspirecourtsaz.com/book. Provide your contact info, event details, preferred dates, and any special requests. We'll respond within 24 hours to confirm availability and pricing.",
      },
      {
        q: "Do you have volleyball courts?",
        a: "Yes! Inspire Courts has 7 regulation volleyball courts available to rent at $80/hour per court. We host volleyball leagues, practices, tournaments, and private events. Use the same booking form at inspirecourtsaz.com/book or select 'Volleyball' as your sport.",
      },
      {
        q: "What sports can I rent courts for?",
        a: "We host basketball, volleyball, and futsal. All 7 courts can be configured for the sport you need. Email us or fill out the booking form with your sport and we'll set you up.",
      },
    ],
  },
  {
    category: "Policies",
    items: [
      {
        q: "What is your cancellation and refund policy?",
        a: `Tournament registrations are generally non-refundable but may be transferable to another event at our discretion. For facility rentals, cancellations made 7 or more days in advance may be eligible for a credit toward a future booking. Contact us directly at ${FACILITY_EMAIL} for specific situations.`,
      },
    ],
  },
  {
    category: "Game Day",
    items: [
      {
        q: "What should I bring on game day?",
        a: "Players: your team jersey/uniform, non-marking court shoes, and water (1 water bottle + 1 sports drink are OK to bring in). Coaches: a valid photo ID for check-in — your roster must be submitted before your first game. Spectators: $15 admission at the door (kids under 5 free). Cash and card accepted.",
      },
      {
        q: "Where do I park?",
        a: "Free parking is available in the lot directly in front of the building at 1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233. Enter from Fiesta Blvd and look for Inspire Courts signage. Parking is generally available on both sides of the building during events.",
      },
      {
        q: "What are the facility rules?",
        a: "No hanging on rims. No outside food or beverages — our snack bar is open all day. No coolers or ice chests. All children must be supervised by an adult at all times. Non-marking court shoes only (no dress shoes, sandals, or cleats). No profanity or unsportsmanlike conduct. Inspire Courts reserves the right to remove anyone from the premises.",
      },
    ],
  },
  {
    category: "Training Programs",
    items: [
      {
        q: "What training programs do you offer?",
        a: "We offer private 1-on-1 training sessions, small group workouts, and skills clinics for basketball and volleyball. Basketball training covers shooting mechanics, ball handling, footwork, athleticism, and game IQ. Volleyball training covers serving, passing, setting, attacking, and positioning — all on regulation courts. Sessions are held at Inspire Courts by appointment.",
      },
      {
        q: "How do I book a training session?",
        a: `Contact us at ${FACILITY_EMAIL} or visit the Training page for details. Sessions are booked by appointment and scheduled based on trainer and court availability. We'll match you with the right program based on your age, skill level, and goals.`,
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-light-gray rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-off-white transition-colors"
        aria-expanded={open}
      >
        <span className="text-navy font-semibold text-sm leading-snug pr-2">
          {q}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-red flex-shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-96" : "max-h-0"
        )}
      >
        <p className="px-6 pb-5 pt-2 text-text-muted text-sm leading-relaxed border-t border-light-gray bg-off-white">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-36">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              Got Questions?
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              FAQ
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Answers to the most common questions about tournaments, rentals,
              training, and game day at Inspire Courts.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {FAQ_CATEGORIES.map((cat, ci) => (
            <AnimateIn key={cat.category} delay={ci * 80}>
              <div>
                <h2 className="text-navy font-bold text-xs uppercase tracking-[0.2em] mb-5 font-[var(--font-chakra)] flex items-center gap-2.5">
                  <span className="w-6 h-6 bg-red rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {ci + 1}
                  </span>
                  {cat.category}
                </h2>
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <AccordionItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* Still have questions CTA */}
      <section className="py-16 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <HelpCircle className="w-10 h-10 text-red mx-auto mb-4" />
            <h3 className="text-white font-bold text-xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
              Still Have Questions?
            </h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              We&apos;re happy to help. Reach out directly and we&apos;ll get
              back to you fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={SOCIAL_LINKS.leagueapps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/40 hover:bg-white hover:text-navy text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Register Now <ArrowRight className="w-4 h-4" />
              </a>
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
              { href: "/gameday", label: "Game Day Info" },
              { href: "/book", label: "Book Facility" },
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
