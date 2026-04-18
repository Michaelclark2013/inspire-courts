"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FileCheck, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatPhone } from "@/lib/utils";

export default function WaiverPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({
    playerName: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    emergencyContact: "",
    emergencyPhone: "",
    allergies: "",
    eventName: "",
    agreed: false,
  });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from session
  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        parentName: prev.parentName || session.user?.name || "",
        parentEmail: prev.parentEmail || session.user?.email || "",
      }));
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agreed) {
      setError("You must agree to the waiver terms.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/portal/waiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          submittedBy: session?.user?.name || session?.user?.email,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit waiver");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-6" aria-hidden="true" />
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading mb-3">
            Waiver Submitted
          </h1>
          <p className="text-text-muted mb-8">
            The waiver for <span className="text-navy font-semibold">{form.playerName}</span> has been submitted successfully.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setForm((prev) => ({
                  playerName: "",
                  parentName: session?.user?.name || "",
                  parentEmail: session?.user?.email || "",
                  parentPhone: prev.parentPhone,
                  emergencyContact: prev.emergencyContact,
                  emergencyPhone: prev.emergencyPhone,
                  allergies: "",
                  eventName: prev.eventName,
                  agreed: false,
                }));
              }}
              className="bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              Submit Another Waiver
            </button>
            <Link
              href="/portal"
              className="text-text-muted hover:text-navy px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors border border-border hover:border-navy/30"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4 transition-colors">
        <span aria-hidden="true">&larr;</span> Back to Dashboard
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">
          Player Waiver Form
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Complete this waiver for each player before they can participate
        </p>
      </div>

      <div className="max-w-xl">
        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-6">
          {["Player Info", "Emergency", "Agreement"].map((step, i) => {
            const filled = i === 0
              ? !!(form.playerName && form.parentName)
              : i === 1
              ? !!(form.emergencyContact && form.emergencyPhone)
              : form.agreed;
            return (
              <div key={step} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${filled ? "bg-red" : "bg-navy/[0.06]"}`} />
                <p className={`text-[10px] uppercase tracking-wider mt-1.5 font-semibold ${filled ? "text-red" : "text-text-muted"}`}>{step}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-light-gray rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileCheck className="w-4 h-4 text-red" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
              Participation Waiver
            </h2>
          </div>

          {error && (
            <div role="alert" aria-live="assertive" className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Event */}
            <div>
              <label htmlFor="waiver-event" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Event / Tournament Name
              </label>
              <input id="waiver-event" type="text" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50" placeholder="e.g. Spring Classic 2026" />
            </div>

            {/* Player info */}
            <div>
              <label htmlFor="waiver-player" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Player Full Name <span className="text-red">*</span>
              </label>
              <input id="waiver-player" type="text" value={form.playerName} onChange={(e) => setForm({ ...form, playerName: e.target.value })} required autoComplete="name" className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50" placeholder="Player's full name" />
            </div>

            {/* Parent/Guardian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="waiver-parentName" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Parent/Guardian Name <span className="text-red">*</span>
                </label>
                <input id="waiver-parentName" type="text" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} required autoComplete="name" className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50" placeholder="Parent's full name" />
              </div>
              <div>
                <label htmlFor="waiver-parentEmail" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Parent Email <span className="text-red">*</span>
                </label>
                <input id="waiver-parentEmail" type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} required autoComplete="email" className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50" placeholder="parent@email.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="waiver-parentPhone" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Parent Phone <span className="text-red">*</span>
                </label>
                <input
                  id="waiver-parentPhone"
                  type="tel"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: formatPhone(e.target.value) })}
                  required
                  autoComplete="tel"
                  className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label htmlFor="waiver-allergies" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Known Allergies
                </label>
                <input id="waiver-allergies" type="text" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50" placeholder="None, or list allergies" />
              </div>
            </div>

            {/* Emergency contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="waiver-emergName" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Emergency Contact Name <span className="text-red">*</span>
                </label>
                <input id="waiver-emergName" type="text" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} required className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50" placeholder="Emergency contact" />
              </div>
              <div>
                <label htmlFor="waiver-emergPhone" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Emergency Contact Phone <span className="text-red">*</span>
                </label>
                <input
                  id="waiver-emergPhone"
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => setForm({ ...form, emergencyPhone: formatPhone(e.target.value) })}
                  required
                  className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Waiver agreement */}
            <div className="bg-off-white border border-light-gray rounded-lg p-4 text-text-muted text-xs leading-relaxed">
              I, the undersigned parent/guardian, hereby grant permission for the above-named player to participate in activities at Inspire Courts AZ. I understand that participation in basketball and athletic activities involves inherent risks. I agree to hold harmless Inspire Courts AZ, its staff, and affiliates from any claims arising from participation. I confirm that the player is in good physical condition and fit to participate.
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-light-gray bg-off-white text-red focus:ring-red/30"
              />
              <span className="text-navy text-sm">
                I agree to the terms above and confirm that I am the parent/legal guardian of the player.
              </span>
            </label>

            <button
              type="submit"
              disabled={saving || !form.agreed}
              aria-busy={saving}
              className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover disabled:opacity-40 text-white py-3.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FileCheck className="w-4 h-4" aria-hidden="true" />}
              Submit Waiver
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
