"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import SubmitButton from "@/components/ui/SubmitButton";
import { FACILITY_EMAIL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Role = "player" | "coach";

export default function ClubInterestForm() {
  const [role, setRole] = useState<Role>("player");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      inquiryType: role === "player" ? "Club Interest - Player" : "Club Interest - Coach",
      message: [
        `Role: ${role === "player" ? "Player" : "Coach"}`,
        role === "player" ? `Age/Grade: ${formData.get("age") || "—"}` : "",
        role === "player" ? `Position: ${formData.get("position") || "—"}` : "",
        role === "player" ? `Current/Past Team: ${formData.get("currentTeam") || "—"}` : "",
        role === "coach" ? `Experience: ${formData.get("experience") || "—"}` : "",
        role === "coach" ? `Age Groups: ${formData.get("ageGroups") || "—"}` : "",
        `Division Interest: ${formData.get("division") || "—"}`,
        `Additional Info: ${formData.get("notes") || "—"}`,
      ].filter(Boolean).join("\n"),
    };

    setFormError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        // Status-aware fallback: surface the server's reason if the
        // body parses as JSON, otherwise pick a copy that matches the
        // status family so users know whether to retry, slow down, or
        // give up and email.
        const body = await res.json().catch(() => null);
        const fromServer = typeof body?.error === "string" ? body.error : null;
        if (fromServer) {
          setFormError(fromServer);
        } else if (res.status === 429) {
          setFormError(`Hit a rate limit. Please wait a minute or email ${FACILITY_EMAIL}.`);
        } else if (res.status >= 500) {
          setFormError(`Our server hiccuped. Please try again or email ${FACILITY_EMAIL}.`);
        } else {
          setFormError(`Something went wrong. Please email ${FACILITY_EMAIL} directly.`);
        }
      }
    } catch {
      setFormError(`Network issue. Please try again or email ${FACILITY_EMAIL} directly.`);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div role="status" aria-live="polite" className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <Check className="w-12 h-12 text-green-600 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
          We Got You
        </h3>
        <p className="text-text-muted">
          We&apos;ll reach out soon about joining Team Inspire. Keep grinding.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm" role="alert" aria-live="assertive">
          {formError}
        </div>
      )}
      {/* Role Toggle */}
      <div className="flex gap-2 bg-off-white border border-light-gray rounded-xl p-1.5">
        <button
          type="button"
          onClick={() => setRole("player")}
          className={cn(
            "flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all font-[var(--font-chakra)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:outline-none",
            role === "player"
              ? "bg-red text-white shadow-md"
              : "text-text-muted hover:text-navy"
          )}
        >
          I&apos;m a Player
        </button>
        <button
          type="button"
          onClick={() => setRole("coach")}
          className={cn(
            "flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all font-[var(--font-chakra)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:outline-none",
            role === "coach"
              ? "bg-navy text-white shadow-md"
              : "text-text-muted hover:text-navy"
          )}
        >
          I&apos;m a Coach
        </button>
      </div>

      {/* Common Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="club-name" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
            Full Name *
          </label>
          <input
            type="text"
            id="club-name"
            name="name"
            required
            autoComplete="name"
            className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
            placeholder={role === "player" ? "Player name" : "Coach name"}
          />
        </div>
        <div>
          <label htmlFor="club-email" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
            Email *
          </label>
          <input
            type="email"
            id="club-email"
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
          <label htmlFor="club-phone" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
            Phone *
          </label>
          <input
            type="tel"
            id="club-phone"
            name="phone"
            required
            autoComplete="tel"
            className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
            placeholder="(480) 555-1234"
          />
        </div>
        <div>
          <label htmlFor="club-division" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
            Division Interest
          </label>
          <select
            id="club-division"
            name="division"
            className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors"
          >
            <option value="16U">16U Boys</option>
            <option value="17U">17U Boys</option>
            <option value="Both">Both / Either</option>
          </select>
        </div>
      </div>

      {/* Player-specific Fields */}
      {role === "player" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label htmlFor="club-age" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Age / Grad Year
            </label>
            <input
              id="club-age"
              type="text"
              name="age"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
              placeholder="e.g. 16 / 2028"
            />
          </div>
          <div>
            <label htmlFor="club-position" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Position
            </label>
            <input
              id="club-position"
              type="text"
              name="position"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
              placeholder="e.g. PG, SG, SF"
            />
          </div>
          <div>
            <label htmlFor="club-currentTeam" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Current / Past Team
            </label>
            <input
              id="club-currentTeam"
              type="text"
              name="currentTeam"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
              placeholder="Team name"
            />
          </div>
        </div>
      )}

      {/* Coach-specific Fields */}
      {role === "coach" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="club-experience" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Coaching Experience
            </label>
            <input
              id="club-experience"
              type="text"
              name="experience"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
              placeholder="e.g. 5 years, AAU, HS varsity"
            />
          </div>
          <div>
            <label htmlFor="club-ageGroups" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Age Groups Coached
            </label>
            <input
              id="club-ageGroups"
              type="text"
              name="ageGroups"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50"
              placeholder="e.g. 14U-17U"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="club-notes" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
          Anything else we should know?
        </label>
        <textarea
          id="club-notes"
          name="notes"
          rows={3}
          maxLength={2000}
          className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50 resize-vertical"
          placeholder={role === "player" ? "Highlight links, stats, why you want to play for Inspire..." : "What you bring to the program, coaching philosophy..."}
        />
      </div>

      <SubmitButton loading={loading} loadingText="Submitting..." fullWidth>
        Submit Interest
      </SubmitButton>
    </form>
  );
}
