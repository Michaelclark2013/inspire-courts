"use client";

import { useState } from "react";
import { FACILITY_EMAIL } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Camera, ArrowRight, Check, Clock, Car } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import BackToTop from "@/components/ui/BackToTop";
import SubmitButton from "@/components/ui/SubmitButton";

const INQUIRY_TYPES = [
  "Tournament Registration",
  "Club Interest - Player",
  "Club Interest - Coach",
  "Facility Rental",
  "Sponsorship Inquiry",
  "Referee Application",
  "General Question",
  "Other",
];

export default function ContactPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    // Honeypot: if filled, silently "succeed" without submitting
    const honeypot = formData.get("website") as string;
    if (honeypot) {
      setSubmitted(true);
      setLoading(false);
      return;
    }

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      inquiryType: formData.get("inquiryType") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError(`Something went wrong. Please try again or email us directly at ${FACILITY_EMAIL}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/courts-bg.jpg" alt="Inspire Courts facility in Gilbert, Arizona" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              Get in Touch
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg text-balance">
              Contact
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Questions about events, rentals, or anything else? We&apos;ll get
              back to you fast.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              <AnimateIn>
                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <Check className="w-12 h-12 text-green-600 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-navy font-bold text-xl uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
                      Message Sent
                    </h2>
                    <p className="text-text-muted">
                      We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-navy font-bold text-xl uppercase tracking-tight mb-6 font-[var(--font-chakra)]">
                      Send a Message
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]"
                        >
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          autoComplete="name"
                          className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]"
                        >
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          autoComplete="email"
                          className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]"
                        >
                          Phone{" "}
                          <span className="font-normal normal-case tracking-normal text-text-muted">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          autoComplete="tel"
                          pattern="[0-9\s\-\(\)\+]{10,}"
                          title="Please enter a valid phone number (at least 10 digits)"
                          className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
                          placeholder="(480) 555-1234"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="inquiryType"
                          className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]"
                        >
                          Inquiry Type{" "}
                          <span className="font-normal normal-case tracking-normal text-text-muted">(optional)</span>
                        </label>
                        <select
                          id="inquiryType"
                          name="inquiryType"
                          className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors cursor-pointer"
                        >
                          {INQUIRY_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]"
                      >
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50 resize-vertical"
                        placeholder="Tell us what you need..."
                      />
                    </div>

                    {/* Honeypot — hidden from real users, catches bots */}
                    <div className="absolute opacity-0 -z-10 h-0 overflow-hidden" aria-hidden="true">
                      <label htmlFor="contact-website">Website</label>
                      <input type="text" id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
                    </div>

                    {error && (
                      <div className="flex items-start gap-2.5 text-red text-sm bg-red/5 border border-red/20 rounded-xl px-4 py-3" role="alert">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    )}

                    <SubmitButton loading={loading} loadingText="Sending...">
                      Send Message
                    </SubmitButton>
                  </form>
                  </>
                )}
              </AnimateIn>
            </div>

            {/* Info Sidebar */}
            <div className="lg:col-span-2">
              <AnimateIn delay={200}>
                <div className="space-y-8">
                  <div>
                    <h2 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 font-[var(--font-chakra)]">
                      Location
                    </h2>
                    <div className="flex gap-3 text-text-muted text-sm">
                      <MapPin className="w-5 h-5 text-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p>1090 N Fiesta Blvd</p>
                        <p>Ste 101 &amp; 102</p>
                        <p>Gilbert, AZ 85233</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 font-[var(--font-chakra)]">
                      Email
                    </h2>
                    <div className="flex gap-3 text-text-muted text-sm">
                      <Mail className="w-5 h-5 text-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <a
                        href={`mailto:${FACILITY_EMAIL}`}
                        className="hover:text-red transition-colors"
                      >
                        {FACILITY_EMAIL}
                      </a>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 font-[var(--font-chakra)]">
                      Social
                    </h2>
                    <div className="flex gap-3 text-text-muted text-sm">
                      <Camera className="w-5 h-5 text-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <a
                        href="https://instagram.com/inspirecourts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-red transition-colors"
                      >
                        @inspirecourts
                      </a>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 font-[var(--font-chakra)]">
                      Hours
                    </h2>
                    <div className="flex gap-3 text-text-muted text-sm">
                      <Clock className="w-5 h-5 text-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-navy">Open by Appointment</p>
                        <p className="text-text-muted text-xs mt-0.5">Call or book online — we operate by reservation</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 font-[var(--font-chakra)]">
                      Getting Here
                    </h2>
                    <div className="flex gap-3 text-text-muted text-sm">
                      <Car className="w-5 h-5 text-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1">
                        <p className="font-semibold text-navy">Free Parking On-Site</p>
                        <p>Enter from Fiesta Blvd — parking lot is directly in front of the building. Look for Inspire Courts signage at Suite 101 &amp; 102.</p>
                        <p className="text-xs text-text-muted/70 mt-1">From US-60: Exit Gilbert Rd south, right on Guadalupe Rd, left on Fiesta Blvd.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-off-white border border-light-gray rounded-xl overflow-hidden aspect-[4/3]">
                    <iframe
                      src="https://maps.google.com/maps?q=1090+N+Fiesta+Blvd+Ste+101+%26+102+Gilbert+AZ+85233&output=embed&z=16"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Inspire Courts AZ Location — 1090 N Fiesta Blvd, Gilbert, AZ 85233"
                    />
                  </div>
                </div>
              </AnimateIn>
            </div>
          </div>
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
              { href: "/book", label: "Book Facility" },
              { href: "/faq", label: "FAQ" },
              { href: "/gameday", label: "Game Day Info" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-center gap-1.5 bg-white border border-light-gray hover:border-red/40 hover:text-red text-navy text-xs font-bold uppercase tracking-wide py-3 px-4 rounded-xl transition-colors font-[var(--font-chakra)]"
              >
                {link.label} <ArrowRight className="w-3 h-3 opacity-60" aria-hidden="true" />
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
