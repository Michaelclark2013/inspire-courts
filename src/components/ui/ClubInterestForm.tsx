"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "player" | "coach";

export default function ClubInterestForm() {
  const [role, setRole] = useState<Role>("player");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      alert("Something went wrong. Please email mikeyclark.240@gmail.com directly.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
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
      {/* Role Toggle */}
      <div className="flex gap-2 bg-off-white border border-light-gray rounded-xl p-1.5">
        <button
          type="button"
          onClick={() => setRole("player")}
          className={cn(
            "flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all font-[var(--font-chakra)]",
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
            "flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all font-[var(--font-chakra)]",
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
          <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50"
            placeholder={role === "player" ? "Player name" : "Coach name"}
          />
        </div>
        <div>
          <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
            Email *
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
            Phone *
          </label>
          <input
            type="tel"
            name="phone"
            required
            className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50"
            placeholder="(480) 555-1234"
          />
        </div>
        <div>
          <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
            Division Interest
          </label>
          <select
            name="division"
            className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors"
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
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Age / Grad Year
            </label>
            <input
              type="text"
              name="age"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50"
              placeholder="e.g. 16 / 2028"
            />
          </div>
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Position
            </label>
            <input
              type="text"
              name="position"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50"
              placeholder="e.g. PG, SG, SF"
            />
          </div>
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Current / Past Team
            </label>
            <input
              type="text"
              name="currentTeam"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50"
              placeholder="Team name"
            />
          </div>
        </div>
      )}

      {/* Coach-specific Fields */}
      {role === "coach" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Coaching Experience
            </label>
            <input
              type="text"
              name="experience"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50"
              placeholder="e.g. 5 years, AAU, HS varsity"
            />
          </div>
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
              Age Groups Coached
            </label>
            <input
              type="text"
              name="ageGroups"
              className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50"
              placeholder="e.g. 14U-17U"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
          Anything else we should know?
        </label>
        <textarea
          name="notes"
          rows={3}
          className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50 resize-vertical"
          placeholder={role === "player" ? "Highlight links, stats, why you want to play for Inspire..." : "What you bring to the program, coaching philosophy..."}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors font-[var(--font-chakra)]"
      >
        {loading ? "Submitting..." : "Submit Interest"}{" "}
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
