"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { FACILITY_EMAIL } from "@/lib/constants";
import { INPUT_CLASS_LG, LABEL_CLASS, SELECT_CLASS, TEXTAREA_CLASS } from "@/lib/form-styles";
import { trackConversion } from "@/lib/analytics";

const SPORT_OPTIONS = ["Basketball", "Volleyball", "Futsal", "Jiu-Jitsu", "Other"];

const EVENT_TYPE_OPTIONS = ["Practice", "Tournament", "Party / Event", "Open Gym", "Other"];

const TIME_OPTIONS = [
  "Morning (8am–12pm)",
  "Afternoon (12pm–5pm)",
  "Evening (5pm–10pm)",
  "Flexible",
];

const COURT_OPTIONS = [
  "1 Court",
  "2 Courts",
  "3 Courts",
  "4 Courts",
  "5 Courts",
  "6 Courts",
  "7 Courts",
  "Full Facility",
];

function ChevronDown() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function BookingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    // Honeypot: if filled, silently "succeed" without submitting
    const honeypot = fd.get("website") as string;
    if (honeypot) {
      setSubmitted(true);
      setLoading(false);
      return;
    }

    const data = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      sport: fd.get("sport") as string,
      eventType: fd.get("eventType") as string,
      preferredDate: fd.get("preferredDate") as string,
      preferredTime: fd.get("preferredTime") as string,
      courts: fd.get("courts") as string,
      notes: fd.get("notes") as string,
    };

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        trackConversion("book_form_submit");
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const json = await res.json();
        setError(json.error || "Something went wrong. Please try again.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div role="status" aria-live="polite" className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-navy font-bold text-2xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
            Request Received!
          </h3>
          <p className="text-text-muted max-w-sm mx-auto">
            We&apos;ll review your booking request and reach out within 24 hours to confirm availability and pricing.
          </p>
          <p className="text-text-muted text-sm mt-4">
            Questions? Email us at{" "}
            <a href={`mailto:${FACILITY_EMAIL}`} className="text-red hover:underline">
              {FACILITY_EMAIL}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

          {/* Contact Information */}
          <fieldset className="space-y-5">
            <legend className="text-navy font-bold text-sm uppercase tracking-wider font-[var(--font-chakra)] pb-2 border-b border-light-gray w-full flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
              Contact Information
            </legend>

          <div>
            <label htmlFor="name" className={LABEL_CLASS}>Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              aria-required="true"
              autoComplete="name"
              maxLength={200}
              className={INPUT_CLASS_LG}
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="phone" className={LABEL_CLASS}>Phone *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              aria-required="true"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              pattern="[0-9\s\-\(\)\+]{10,}"
              title="Please enter a valid phone number (at least 10 digits)"
              className={INPUT_CLASS_LG}
              placeholder="(480) 555-1234"
            />
          </div>

          <div>
            <label htmlFor="email" className={LABEL_CLASS}>Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              aria-required="true"
              autoComplete="email"
              className={INPUT_CLASS_LG}
              placeholder="you@example.com"
            />
          </div>
          </fieldset>

          {/* Booking Details */}
          <fieldset className="space-y-5">
            <legend className="text-navy font-bold text-sm uppercase tracking-wider font-[var(--font-chakra)] pb-2 border-b border-light-gray w-full flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
              Booking Details
            </legend>

          <div>
            <label htmlFor="sport" className={LABEL_CLASS}>Sport *</label>
            <div className="relative">
              <select id="sport" name="sport" required defaultValue="" className={SELECT_CLASS}>
                <option value="" disabled>Select a sport…</option>
                {SPORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </div>

          <div>
            <label htmlFor="eventType" className={LABEL_CLASS}>Type of Event *</label>
            <div className="relative">
              <select id="eventType" name="eventType" required defaultValue="" className={SELECT_CLASS}>
                <option value="" disabled>Select event type…</option>
                {EVENT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </div>

          <div>
            <label htmlFor="preferredDate" className={LABEL_CLASS}>Preferred Date *</label>
            <input
              type="date"
              id="preferredDate"
              name="preferredDate"
              required
              min={new Date().toISOString().split("T")[0]}
              className={INPUT_CLASS_LG}
            />
            <p className="text-text-muted text-xs mt-1.5">Select a future date for your booking</p>
          </div>

          <div>
            <label htmlFor="preferredTime" className={LABEL_CLASS}>Preferred Time *</label>
            <div className="relative">
              <select id="preferredTime" name="preferredTime" required defaultValue="" className={SELECT_CLASS}>
                <option value="" disabled>Select a time…</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </div>

          <div>
            <label htmlFor="courts" className={LABEL_CLASS}>Courts Needed *</label>
            <div className="relative">
              <select id="courts" name="courts" required defaultValue="" className={SELECT_CLASS}>
                <option value="" disabled>Select…</option>
                {COURT_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className={LABEL_CLASS}>
              Anything else we should know?{" "}
              <span className="text-text-muted font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={2000}
              className={TEXTAREA_CLASS}
              placeholder="Any special requests, questions, or details…"
            />
          </div>
          </fieldset>

          {/* Honeypot — hidden from real users, catches bots */}
          <div className="absolute opacity-0 -z-10 h-0 overflow-hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          {error && (
            <p role="alert" aria-live="assertive" className="text-red text-sm bg-red/5 border border-red/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>
                Submit Booking Request
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
      {/* Footer note */}
      <p className="text-center text-sm text-text-muted mt-8">
        Questions? Email us at{" "}
        <a href={`mailto:${FACILITY_EMAIL}`} className="text-red hover:underline">
          {FACILITY_EMAIL}
        </a>
      </p>
    </form>
  );
}
