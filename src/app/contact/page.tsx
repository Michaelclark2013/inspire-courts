"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Mail, Camera, ArrowRight, Check } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import BackToTop from "@/components/ui/BackToTop";
import { trackConversion } from "@/lib/analytics";
import {
  INQUIRY_TYPES,
  FACILITY_EMAIL,
  FACILITY_ADDRESS,
  SOCIAL_LINKS,
  HERO_BG_IMAGE,
} from "@/lib/constants";
import { INPUT_CLASS, LABEL_CLASS } from "@/lib/form-styles";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      inquiryType: formData.get("inquiryType") as string,
      message: formData.get("message") as string,
    };

    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        trackConversion("contact_form_submit");
        setSubmitted(true);
      } else {
        setError("Something went wrong. Please try again or email us directly.");
      }
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <Image src={HERO_BG_IMAGE} alt="Inspire Courts AZ contact page" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              Get in Touch
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
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
                  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center" role="status" aria-live="polite">
                    <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
                      Message Sent
                    </h3>
                    <p className="text-text-muted">
                      We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm" role="alert" aria-live="assertive">
                        {error}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className={LABEL_CLASS}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          aria-required="true"
                          autoComplete="name"
                          className={INPUT_CLASS}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className={LABEL_CLASS}>
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          aria-required="true"
                          autoComplete="email"
                          className={INPUT_CLASS}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="phone" className={LABEL_CLASS}>
                          Phone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          autoComplete="tel"
                          className={INPUT_CLASS}
                          placeholder="(480) 555-1234"
                        />
                      </div>
                      <div>
                        <label htmlFor="inquiryType" className={LABEL_CLASS}>
                          Inquiry Type
                        </label>
                        <select
                          id="inquiryType"
                          name="inquiryType"
                          className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors"
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
                      <label htmlFor="message" className={LABEL_CLASS}>
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

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {loading ? "Sending..." : "Send Message"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </AnimateIn>
            </div>

            {/* Info Sidebar */}
            <div className="lg:col-span-2">
              <AnimateIn delay={200}>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 font-[var(--font-chakra)]">
                      Location
                    </h3>
                    <div className="flex gap-3 text-text-muted text-sm">
                      <MapPin className="w-5 h-5 text-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p>{FACILITY_ADDRESS.street}</p>
                        <p>{FACILITY_ADDRESS.suite}</p>
                        <p>{FACILITY_ADDRESS.city}, {FACILITY_ADDRESS.state} {FACILITY_ADDRESS.zip}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 font-[var(--font-chakra)]">
                      Email
                    </h3>
                    <div className="flex gap-3 text-text-muted text-sm">
                      <Mail className="w-5 h-5 text-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <a
                        href={`mailto:${FACILITY_EMAIL}`}
                        className="hover:text-red transition-colors"
                        onClick={() => trackConversion("email_click")}
                      >
                        {FACILITY_EMAIL}
                      </a>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 font-[var(--font-chakra)]">
                      Social
                    </h3>
                    <div className="flex gap-3 text-text-muted text-sm">
                      <Camera className="w-5 h-5 text-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <a
                        href={SOCIAL_LINKS.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-red transition-colors"
                      >
                        {SOCIAL_LINKS.instagramHandle}
                      </a>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 font-[var(--font-chakra)]">
                      Hours
                    </h3>
                    <div className="text-text-muted text-sm space-y-1">
                      <p>Event days: per schedule</p>
                      <p>Facility rental: by appointment</p>
                    </div>
                  </div>

                  <div className="bg-off-white border border-light-gray rounded-xl overflow-hidden aspect-[4/3]">
                    <iframe
                      src="https://maps.google.com/maps?q=1090+N+Fiesta+Blvd,+Gilbert,+AZ+85233&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Inspire Courts AZ Location"
                    />
                  </div>
                </div>
              </AnimateIn>
            </div>
          </div>
        </div>
      </section>

      <BackToTop />
      <div className="h-32 lg:hidden" />
    </>
  );
}
