"use client";

import { useState, useEffect, useCallback } from "react";
import { triggerHaptic } from "@/lib/capacitor";
import { useFormPersist } from "@/hooks/useFormPersist";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  Trophy,
  Users,
  FileCheck,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

type TournamentInfo = {
  id: number;
  name: string;
  startDate: string;
  location: string | null;
  entryFee: number | null;
  divisions: string[];
  registrationOpen: boolean;
  registrationDeadline: string | null;
  maxTeamsPerDivision: number | null;
  requirePayment: boolean;
  requireWaivers: boolean;
  description: string | null;
  registrationCount: number;
};

export default function RegisterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [teamName, setTeamName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [coachEmail, setCoachEmail] = useState("");
  const [coachPhone, setCoachPhone] = useState("");
  const [division, setDivision] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [waiversAcknowledged, setWaiversAcknowledged] = useState(false);

  // Persist form data to localStorage so users don't lose progress
  const restoreForm = useCallback((saved: Record<string, unknown>) => {
    if (saved.teamName) setTeamName(saved.teamName as string);
    if (saved.coachName) setCoachName(saved.coachName as string);
    if (saved.coachEmail) setCoachEmail(saved.coachEmail as string);
    if (saved.coachPhone) setCoachPhone(saved.coachPhone as string);
    if (saved.division) setDivision(saved.division as string);
    if (saved.playerCount) setPlayerCount(saved.playerCount as string);
  }, []);

  const { clearSaved } = useFormPersist(
    `tournament-register-${id}`,
    { teamName, coachName, coachEmail, coachPhone, division, playerCount },
    restoreForm,
  );

  // Field-level validation (touched tracks which fields the user has interacted with)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const fieldErrors: Record<string, string> = {};
  if (!teamName.trim()) fieldErrors.teamName = "Team name is required";
  if (!coachName.trim()) fieldErrors.coachName = "Coach name is required";
  if (!coachEmail.trim()) fieldErrors.coachEmail = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coachEmail))
    fieldErrors.coachEmail = "Enter a valid email address";
  if (coachPhone && coachPhone.replace(/\D/g, "").length < 10)
    fieldErrors.coachPhone = "Enter a valid 10-digit phone number";

  const fieldClass = (field: string) =>
    `w-full bg-off-white border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50 transition-colors ${
      touched[field] && fieldErrors[field]
        ? "border-red/60 bg-red/[0.03]"
        : "border-light-gray"
    }`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/tournaments/${id}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setTournament({
          id: data.id,
          name: data.name,
          startDate: data.startDate,
          location: data.location,
          entryFee: data.entryFee ?? null,
          divisions: data.divisions || [],
          registrationOpen: data.registrationOpen ?? false,
          registrationDeadline: data.registrationDeadline ?? null,
          maxTeamsPerDivision: data.maxTeamsPerDivision ?? null,
          requirePayment: data.requirePayment ?? true,
          requireWaivers: data.requireWaivers ?? true,
          description: data.description ?? null,
          registrationCount: data.teams?.length ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          coachName,
          coachEmail,
          coachPhone: coachPhone || undefined,
          division: division || undefined,
          playerCount: playerCount ? Number(playerCount) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setSubmitting(false);
        return;
      }

      triggerHaptic("success");
      clearSaved(); // Clear persisted form data on success

      // If checkout URL, redirect to Square
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Otherwise go to confirmation
      router.push(
        `/tournaments/${id}/register/confirmation?reg=${data.registrationId}`
      );
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <p className="text-text-muted">Tournament not found.</p>
      </div>
    );
  }

  if (!tournament.registrationOpen) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-text-muted" aria-hidden="true" />
          <p className="text-text-muted mb-4">Registration is not open for this tournament.</p>
          <Link href={`/tournaments/${id}`} className="text-red text-sm hover:text-red-hover">
            View Tournament
          </Link>
        </div>
      </div>
    );
  }

  const fee = tournament.entryFee ?? 0;
  const totalSteps = tournament.requireWaivers ? 3 : 2;
  const needsPayment = tournament.requirePayment && fee > 0;

  const steps = [
    { label: "Team Info", icon: Users },
    ...(tournament.requireWaivers ? [{ label: "Waivers", icon: FileCheck }] : []),
    { label: needsPayment ? "Payment" : "Confirm", icon: needsPayment ? CreditCard : CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
        <Link
          href={`/tournaments/${id}`}
          className="text-text-muted text-xs hover:text-navy flex items-center gap-1 mb-6 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" aria-hidden="true" /> Back to {tournament.name}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy font-heading mb-1">
            Register for {tournament.name}
          </h1>
          <div className="flex items-center gap-3 text-text-muted text-sm">
            <span>
              {new Date(tournament.startDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {tournament.location && <span>{tournament.location}</span>}
            {fee > 0 && (
              <span className="text-emerald-600 font-semibold">
                ${(fee / 100).toFixed(0)} entry fee
              </span>
            )}
          </div>
        </div>

        {/* Step indicators */}
        <nav aria-label="Registration progress" className="mb-8">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-3">
            Step {step} of {totalSteps}
          </p>
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              const active = step === i + 1;
              const done = step > i + 1;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      done
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : active
                        ? "bg-red text-white shadow-sm shadow-red/30 ring-4 ring-red/10"
                        : "bg-light-gray text-text-muted"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider hidden sm:inline ${
                      active ? "text-navy" : done ? "text-emerald-600" : "text-text-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-200 ${done ? "bg-emerald-500" : "bg-light-gray"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {error && (
          <div role="alert" aria-live="assertive" className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3 mb-6 input-shake">
            {error}
          </div>
        )}

        {/* Step 1: Team Info */}
        {step === 1 && (
          <div className="bg-white border border-light-gray shadow-sm rounded-2xl p-6">
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">
              Team Information
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="treg-teamName" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Team Name *
                </label>
                <input
                  id="treg-teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  onBlur={() => markTouched("teamName")}
                  required
                  className={fieldClass("teamName")}
                  placeholder="e.g. Phoenix Elite"
                  aria-invalid={touched.teamName && !!fieldErrors.teamName}
                  aria-describedby={touched.teamName && fieldErrors.teamName ? "err-teamName" : undefined}
                />
                {touched.teamName && fieldErrors.teamName && (
                  <p id="err-teamName" className="text-red text-xs mt-1">{fieldErrors.teamName}</p>
                )}
              </div>
              {tournament.divisions.length > 0 && (
                <div>
                  <label htmlFor="treg-division" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Division *
                  </label>
                  <select
                    id="treg-division"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    required
                    className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                  >
                    <option value="">Select division</option>
                    {tournament.divisions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="treg-coachName" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Coach Name *
                  </label>
                  <input
                    id="treg-coachName"
                    type="text"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    onBlur={() => markTouched("coachName")}
                    required
                    autoComplete="name"
                    className={fieldClass("coachName")}
                    placeholder="Full name"
                    aria-invalid={touched.coachName && !!fieldErrors.coachName}
                    aria-describedby={touched.coachName && fieldErrors.coachName ? "err-coachName" : undefined}
                  />
                  {touched.coachName && fieldErrors.coachName && (
                    <p id="err-coachName" className="text-red text-xs mt-1">{fieldErrors.coachName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="treg-coachEmail" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Coach Email *
                  </label>
                  <input
                    id="treg-coachEmail"
                    type="email"
                    value={coachEmail}
                    onChange={(e) => setCoachEmail(e.target.value)}
                    onBlur={() => markTouched("coachEmail")}
                    required
                    autoComplete="email"
                    className={fieldClass("coachEmail")}
                    placeholder="coach@email.com"
                    aria-invalid={touched.coachEmail && !!fieldErrors.coachEmail}
                    aria-describedby={touched.coachEmail && fieldErrors.coachEmail ? "err-coachEmail" : undefined}
                  />
                  {touched.coachEmail && fieldErrors.coachEmail && (
                    <p id="err-coachEmail" className="text-red text-xs mt-1">{fieldErrors.coachEmail}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="treg-coachPhone" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Phone (optional)
                  </label>
                  <input
                    id="treg-coachPhone"
                    type="tel"
                    value={coachPhone}
                    onChange={(e) => setCoachPhone(e.target.value)}
                    onBlur={() => markTouched("coachPhone")}
                    autoComplete="tel"
                    className={fieldClass("coachPhone")}
                    placeholder="(555) 123-4567"
                    aria-invalid={touched.coachPhone && !!fieldErrors.coachPhone}
                    aria-describedby={touched.coachPhone && fieldErrors.coachPhone ? "err-coachPhone" : undefined}
                  />
                  {touched.coachPhone && fieldErrors.coachPhone && (
                    <p id="err-coachPhone" className="text-red text-xs mt-1">{fieldErrors.coachPhone}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="treg-playerCount" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Number of Players
                  </label>
                  <input
                    id="treg-playerCount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={25}
                    value={playerCount}
                    onChange={(e) => setPlayerCount(e.target.value)}
                    className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  if (!teamName || !coachName || !coachEmail) {
                    setError("Please fill in all required fields");
                    return;
                  }
                  if (tournament.divisions.length > 0 && !division) {
                    setError("Please select a division");
                    return;
                  }
                  setError("");
                  setStep(tournament.requireWaivers ? 2 : totalSteps);
                }}
                className="bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Waivers (if required) */}
        {step === 2 && tournament.requireWaivers && (
          <div className="bg-white border border-light-gray shadow-sm rounded-2xl p-6">
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">
              Waivers & Acknowledgment
            </h2>
            <div className="bg-off-white border border-light-gray rounded-xl p-4 mb-4 text-text-muted text-sm space-y-2">
              <p>
                All players must have a signed waiver on file before participating.
                You can submit waivers through the coach portal after registration.
              </p>
              <p>
                Paper waivers will also be accepted at the front desk on game day.
              </p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={waiversAcknowledged}
                onChange={(e) => setWaiversAcknowledged(e.target.checked)}
                className="mt-1 accent-red"
              />
              <span className="text-navy text-sm">
                I acknowledge that all players on my team will have signed waivers
                before competing.
              </span>
            </label>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-text-muted hover:text-navy text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 rounded min-h-[44px] inline-flex items-center"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!waiversAcknowledged) {
                    setError("Please acknowledge the waiver requirement");
                    return;
                  }
                  setError("");
                  setStep(totalSteps);
                }}
                className="bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Final step: Payment / Confirm */}
        {step === totalSteps && (
          <div className="bg-white border border-light-gray shadow-sm rounded-2xl p-6">
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">
              {needsPayment ? "Review & Pay" : "Review & Confirm"}
            </h2>

            {/* Summary */}
            <div className="bg-off-white border border-light-gray rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Team</span>
                <span className="text-navy font-semibold">{teamName}</span>
              </div>
              {division && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Division</span>
                  <span className="text-navy">{division}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Coach</span>
                <span className="text-navy">{coachName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Email</span>
                <span className="text-navy">{coachEmail}</span>
              </div>
              {needsPayment && (
                <div className="flex justify-between text-sm pt-2 border-t border-light-gray">
                  <span className="text-text-muted">Entry Fee</span>
                  <span className="text-emerald-600 font-bold">
                    ${(fee / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() =>
                  setStep(tournament.requireWaivers ? 2 : 1)
                }
                className="text-text-muted hover:text-navy text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 rounded min-h-[44px] inline-flex items-center"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : needsPayment ? (
                  <CreditCard className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                )}
                {needsPayment
                  ? `Pay $${(fee / 100).toFixed(0)}`
                  : "Complete Registration"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
