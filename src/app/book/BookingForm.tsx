"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  MapPin,
  Mail,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import QuickContactBar from "@/components/ui/QuickContactBar";
import {
  EVENT_TYPES,
  SPORT_TYPES,
  FACILITY_EMAIL,
  FACILITY_ADDRESS,
  HERO_BG_IMAGE,
} from "@/lib/constants";
import { INPUT_CLASS_LG, LABEL_CLASS, SELECT_CLASS, TEXTAREA_CLASS } from "@/lib/form-styles";

const DURATIONS = [
  "1 Hour",
  "2 Hours",
  "3 Hours",
  "4 Hours",
  "Half Day (4–6 hrs)",
  "Full Day",
  "Multiple Days / Weekend",
  "Not sure yet",
];

const COURT_OPTIONS = [
  "1 Court",
  "2 Courts",
  "3 Courts",
  "4 Courts",
  "5 Courts",
  "6 Courts",
  "7 Courts",
  "Entire Facility",
];

const GROUP_SIZES = [
  "1–10 people",
  "11–20 people",
  "21–40 people",
  "41–60 people",
  "60–100 people",
  "100+ people",
];

const RECURRING_OPTIONS = [
  "One-Time Event",
  "Weekly",
  "Bi-Weekly",
  "Monthly",
  "Not Sure Yet",
];

function ChevronDown() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
      <svg
        className="w-4 h-4 text-text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
}

function StepLabel({ step, label }: { step: number; label: string }) {
  return (
    <h2 className="text-navy font-bold text-sm uppercase tracking-[0.15em] mb-5 font-[var(--font-chakra)] flex items-center gap-2.5">
      <span className="w-6 h-6 bg-red rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
        {step}
      </span>
      {label}
    </h2>
  );
}

export default function BookingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    const data = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      organization: fd.get("organization") as string,
      eventType: fd.get("eventType") as string,
      sport: fd.get("sport") as string,
      preferredDate: fd.get("preferredDate") as string,
      alternateDate: fd.get("alternateDate") as string,
      startTime: fd.get("startTime") as string,
      duration: fd.get("duration") as string,
      courts: fd.get("courts") as string,
      groupSize: fd.get("groupSize") as string,
      recurring: fd.get("recurring") as string,
      notes: fd.get("notes") as string,
    };

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const json = await res.json();
        setError(json.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError(
        "Something went wrong. Please try again or email us directly."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${HERO_BG_IMAGE}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/92 via-navy/85 to-navy/97" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-24 lg:py-36">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              Facility Rentals
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-5 font-[var(--font-chakra)] drop-shadow-lg">
              Book the Facility
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Reserve Inspire Courts for your league, practice, tournament,
              birthday party, or private event. Fill out the form and we&apos;ll
              get back to you within 24 hours.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Form + Sidebar */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

            {/* ── Booking Form ── */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <AnimateIn>
                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-navy font-bold text-2xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
                      Request Received!
                    </h3>
                    <p className="text-text-muted max-w-sm mx-auto">
                      We&apos;ll review your booking request and reach out within
                      24 hours to confirm availability and pricing.
                    </p>
                    <p className="text-text-muted text-sm mt-4">
                      Questions? Email us at{" "}
                      <a
                        href={`mailto:${FACILITY_EMAIL}`}
                        className="text-red hover:underline"
                      >
                        {FACILITY_EMAIL}
                      </a>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Step 1: Contact Info */}
                    <div>
                      <StepLabel step={1} label="Contact Info" />
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="name" className={LABEL_CLASS}>
                              Full Name *
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              required
                              autoComplete="name"
                              className={INPUT_CLASS_LG}
                              placeholder="Your name"
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className={LABEL_CLASS}>
                              Phone *
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              required
                              autoComplete="tel"
                              className={INPUT_CLASS_LG}
                              placeholder="(480) 555-1234"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="email" className={LABEL_CLASS}>
                              Email *
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              required
                              autoComplete="email"
                              className={INPUT_CLASS_LG}
                              placeholder="you@example.com"
                            />
                          </div>
                          <div>
                            <label htmlFor="organization" className={LABEL_CLASS}>
                              Organization / Team Name <span className="text-text-muted font-normal normal-case tracking-normal">(optional)</span>
                            </label>
                            <input
                              type="text"
                              id="organization"
                              name="organization"
                              className={INPUT_CLASS_LG}
                              placeholder="e.g. Arizona Hoops Club"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-light-gray" />

                    {/* Step 2: Event Details */}
                    <div>
                      <StepLabel step={2} label="Event Details" />
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="eventType" className={LABEL_CLASS}>
                              Event Type *
                            </label>
                            <div className="relative">
                              <select
                                id="eventType"
                                name="eventType"
                                required
                                defaultValue=""
                                className={SELECT_CLASS}
                              >
                                <option value="" disabled>
                                  Select event type…
                                </option>
                                {EVENT_TYPES.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="sport" className={LABEL_CLASS}>
                              Sport *
                            </label>
                            <div className="relative">
                              <select
                                id="sport"
                                name="sport"
                                required
                                defaultValue=""
                                className={SELECT_CLASS}
                              >
                                <option value="" disabled>
                                  Select sport…
                                </option>
                                {SPORT_TYPES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="courts" className={LABEL_CLASS}>
                              Courts Needed <span className="text-text-muted font-normal normal-case tracking-normal">(optional)</span>
                            </label>
                            <div className="relative">
                              <select
                                id="courts"
                                name="courts"
                                defaultValue=""
                                className={SELECT_CLASS}
                              >
                                <option value="">Select…</option>
                                {COURT_OPTIONS.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="groupSize" className={LABEL_CLASS}>
                              Estimated Group Size <span className="text-text-muted font-normal normal-case tracking-normal">(optional)</span>
                            </label>
                            <div className="relative">
                              <select
                                id="groupSize"
                                name="groupSize"
                                defaultValue=""
                                className={SELECT_CLASS}
                              >
                                <option value="">Select…</option>
                                {GROUP_SIZES.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-light-gray" />

                    {/* Step 3: Scheduling */}
                    <div>
                      <StepLabel step={3} label="Scheduling" />
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="preferredDate" className={LABEL_CLASS}>
                              Preferred Date *
                            </label>
                            <input
                              type="date"
                              id="preferredDate"
                              name="preferredDate"
                              required
                              className={INPUT_CLASS_LG}
                            />
                          </div>
                          <div>
                            <label htmlFor="alternateDate" className={LABEL_CLASS}>
                              Alternate Date <span className="text-text-muted font-normal normal-case tracking-normal">(optional)</span>
                            </label>
                            <input
                              type="date"
                              id="alternateDate"
                              name="alternateDate"
                              className={INPUT_CLASS_LG}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="startTime" className={LABEL_CLASS}>
                              Preferred Start Time <span className="text-text-muted font-normal normal-case tracking-normal">(optional)</span>
                            </label>
                            <input
                              type="time"
                              id="startTime"
                              name="startTime"
                              className={INPUT_CLASS_LG}
                            />
                          </div>
                          <div>
                            <label htmlFor="duration" className={LABEL_CLASS}>
                              Duration <span className="text-text-muted font-normal normal-case tracking-normal">(optional)</span>
                            </label>
                            <div className="relative">
                              <select
                                id="duration"
                                name="duration"
                                defaultValue=""
                                className={SELECT_CLASS}
                              >
                                <option value="">Select…</option>
                                {DURATIONS.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="recurring" className={LABEL_CLASS}>
                            Recurring Booking? <span className="text-text-muted font-normal normal-case tracking-normal">(optional)</span>
                          </label>
                          <div className="relative">
                            <select
                              id="recurring"
                              name="recurring"
                              defaultValue=""
                              className={SELECT_CLASS}
                            >
                              <option value="">Select…</option>
                              {RECURRING_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <ChevronDown />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-light-gray" />

                    {/* Step 4: Notes */}
                    <div>
                      <StepLabel step={4} label="Anything Else?" />
                      <label htmlFor="notes" className={LABEL_CLASS}>
                        Special Requests / Notes <span className="text-text-muted font-normal normal-case tracking-normal">(optional)</span>
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={4}
                        className={TEXTAREA_CLASS}
                        placeholder="Scoreboard use, concessions, recurring booking, court layout, anything else…"
                      />
                    </div>

                    {error && (
                      <p className="text-red text-sm bg-red/5 border border-red/20 rounded-xl px-4 py-3">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
                    >
                      {loading ? "Submitting…" : "Submit Booking Request"}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
                )}
              </AnimateIn>
            </div>

            {/* ── Sidebar ── */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <AnimateIn delay={150}>
                <div className="space-y-5 lg:sticky lg:top-28">

                  {/* What's Included */}
                  <div className="bg-navy rounded-2xl p-6 text-white">
                    <h3 className="font-bold text-sm uppercase tracking-[0.15em] mb-4 font-[var(--font-chakra)]">
                      What&apos;s Included
                    </h3>
                    <ul className="space-y-2.5">
                      {[
                        "7 regulation indoor courts",
                        "Digital scoreboards",
                        "Game film capture",
                        "Fully air-conditioned",
                        "Snack bar & concessions",
                        "Ample parking",
                        "Available 7 days a week",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-sm text-white/80"
                        >
                          <div className="w-1.5 h-1.5 bg-red rounded-full mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Perfect For */}
                  <div className="bg-off-white border border-light-gray rounded-2xl p-6">
                    <h3 className="text-navy font-bold text-sm uppercase tracking-[0.15em] mb-4 font-[var(--font-chakra)]">
                      Perfect For
                    </h3>
                    <ul className="space-y-2">
                      {[
                        "Leagues & rec programs",
                        "Team practices & workouts",
                        "Private tournaments",
                        "Youth camps & clinics",
                        "Birthday parties",
                        "Corporate events",
                        "Film sessions & combines",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2.5 text-sm text-text-muted"
                        >
                          <Check className="w-3.5 h-3.5 text-red flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Contact */}
                  <div className="bg-off-white border border-light-gray rounded-2xl p-6 space-y-3">
                    <h3 className="text-navy font-bold text-sm uppercase tracking-[0.15em] mb-1 font-[var(--font-chakra)]">
                      Contact Us Directly
                    </h3>
                    <a
                      href={`mailto:${FACILITY_EMAIL}`}
                      className="flex items-center gap-3 text-sm text-text-muted hover:text-red transition-colors"
                    >
                      <Mail className="w-4 h-4 text-red flex-shrink-0" />
                      {FACILITY_EMAIL}
                    </a>
                    <div className="flex items-start gap-3 text-sm text-text-muted">
                      <MapPin className="w-4 h-4 text-red flex-shrink-0 mt-0.5" />
                      <span>
                        {FACILITY_ADDRESS.street}, {FACILITY_ADDRESS.suite}
                        <br />
                        {FACILITY_ADDRESS.city}, {FACILITY_ADDRESS.state} {FACILITY_ADDRESS.zip}
                      </span>
                    </div>
                  </div>

                </div>
              </AnimateIn>
            </div>

          </div>
        </div>
      </section>

      <QuickContactBar subject="Facility Rental" label="Book a court?" formHref="/book" />
      <div className="h-28 lg:hidden" />
    </>
  );
}
