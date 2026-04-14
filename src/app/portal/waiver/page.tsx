"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FileCheck, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agreed) {
      setError("You must agree to the waiver terms.");
      return;
    }
    setSaving(true);
    setError("");

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
    setSaving(false);
  }

  if (submitted) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-lg mx-auto text-center py-20">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading mb-3">
            Waiver Submitted
          </h1>
          <p className="text-text-secondary mb-8">
            The waiver for <span className="text-white font-semibold">{form.playerName}</span> has been submitted successfully.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ playerName: "", parentName: "", parentEmail: "", parentPhone: "", emergencyContact: "", emergencyPhone: "", allergies: "", eventName: "", agreed: false });
            }}
            className="bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            Submit Another Waiver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
          Player Waiver Form
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Complete this waiver for each player before they can participate
        </p>
      </div>

      <div className="max-w-xl">
        <div className="bg-card border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileCheck className="w-4 h-4 text-red" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">
              Participation Waiver
            </h2>
          </div>

          {error && (
            <div className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Event */}
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Event / Tournament Name
              </label>
              <input type="text" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25" placeholder="e.g. Spring Classic 2026" />
            </div>

            {/* Player info */}
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Player Full Name
              </label>
              <input type="text" value={form.playerName} onChange={(e) => setForm({ ...form, playerName: e.target.value })} required autoComplete="name" className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25" placeholder="Player's full name" />
            </div>

            {/* Parent/Guardian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Parent/Guardian Name
                </label>
                <input type="text" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} required autoComplete="name" className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25" placeholder="Parent's full name" />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Parent Email
                </label>
                <input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} required autoComplete="email" className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25" placeholder="parent@email.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Parent Phone
                </label>
                <input type="tel" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} required autoComplete="tel" className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25" placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Known Allergies
                </label>
                <input type="text" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25" placeholder="None, or list allergies" />
              </div>
            </div>

            {/* Emergency contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Emergency Contact Name
                </label>
                <input type="text" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} required className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25" placeholder="Emergency contact" />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Emergency Contact Phone
                </label>
                <input type="tel" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} required className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25" placeholder="(555) 123-4567" />
              </div>
            </div>

            {/* Waiver agreement */}
            <div className="bg-navy/50 border border-white/5 rounded-lg p-4 text-white/50 text-xs leading-relaxed">
              I, the undersigned parent/guardian, hereby grant permission for the above-named player to participate in activities at Inspire Courts AZ. I understand that participation in basketball and athletic activities involves inherent risks. I agree to hold harmless Inspire Courts AZ, its staff, and affiliates from any claims arising from participation. I confirm that the player is in good physical condition and fit to participate.
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-navy text-red focus:ring-red/30"
              />
              <span className="text-white text-sm">
                I agree to the terms above and confirm that I am the parent/legal guardian of the player.
              </span>
            </label>

            <button
              type="submit"
              disabled={saving || !form.agreed}
              className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover disabled:opacity-40 text-white py-3.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Submit Waiver
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
