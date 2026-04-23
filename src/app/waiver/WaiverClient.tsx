"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { SignaturePad, type SignaturePadHandle } from "@/components/waiver/SignaturePad";

// Public waiver signing page. No auth required — anyone with the
// link can sign. Submissions hit /api/waivers/sign which rate-limits
// per-IP. On success, shows a confirmation with the waiver id so
// the signer can reference it with front desk.
export default function WaiverClient() {
  const [form, setForm] = useState({
    playerName: "",
    parentName: "",
    signedByName: "",
    email: "",
    phone: "",
    teamName: "",
    waiverType: "general" as "general" | "program" | "tournament" | "rental" | "other",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState<{ id: number; expiresAt: string | null } | null>(null);
  const padRef = useRef<SignaturePadHandle>(null);

  async function submit() {
    setErr("");
    if (!form.playerName.trim() || !form.signedByName.trim()) {
      setErr("Player name and signer name are required");
      return;
    }
    if (!agreed) {
      setErr("You must agree to the terms");
      return;
    }
    const dataUrl = padRef.current?.toDataUrl();
    if (!dataUrl) {
      setErr("Please sign above before submitting");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/waivers/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: form.playerName.trim(),
          parentName: form.parentName.trim() || null,
          signedByName: form.signedByName.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          teamName: form.teamName.trim() || null,
          waiverType: form.waiverType,
          signatureDataUrl: dataUrl,
          waiverVersion: "v1-2026",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "Submission failed");
        return;
      }
      setSuccess({ id: json.waiverId, expiresAt: json.expiresAt });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
        <div className="max-w-md bg-white border border-border rounded-xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Waiver Signed</h1>
          <p className="text-text-secondary text-sm mb-4">
            Confirmation #{success.id}
          </p>
          {success.expiresAt && (
            <p className="text-text-secondary text-xs mb-6">
              Valid through{" "}
              {new Date(success.expiresAt).toLocaleDateString([], {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          )}
          <p className="text-sm text-navy mb-6">
            You&apos;re all set. Reference this confirmation number at the front desk on your
            first visit.
          </p>
          <Link href="/" className="inline-block text-red hover:text-red/80 text-sm font-semibold">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <FileText className="w-10 h-10 text-navy mx-auto mb-3" />
          <h1 className="text-3xl font-bold uppercase tracking-tight text-navy font-heading">
            Liability Waiver
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            Required before participating at Inspire Courts. One-time signature,
            valid for one year.
          </p>
        </div>

        {/* WAIVER TEXT */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6 text-sm text-navy space-y-3 max-h-[300px] overflow-y-auto">
          <p className="font-semibold">Inspire Courts AZ — Release of Liability</p>
          <p>
            I, the undersigned, in consideration of being permitted to participate in
            activities at Inspire Courts AZ (&ldquo;the Facility&rdquo;), including but
            not limited to basketball, volleyball, training, tournaments, camps,
            clinics, and open gym, do hereby acknowledge and agree to the following:
          </p>
          <p>
            <strong>1. Assumption of Risk.</strong> I understand that participation
            in athletic activities involves inherent risk of injury, including
            serious injury or death. I voluntarily assume all such risks.
          </p>
          <p>
            <strong>2. Release of Claims.</strong> I release, waive, discharge, and
            covenant not to sue Inspire Courts AZ, its owners, employees, officers,
            agents, contractors, and insurers from any and all liability, claims,
            demands, actions, and causes of action arising out of or related to any
            loss, damage, or injury sustained in connection with my participation.
          </p>
          <p>
            <strong>3. Medical Treatment.</strong> I authorize Inspire Courts AZ
            staff to arrange emergency medical treatment if needed and agree to be
            financially responsible for any such treatment.
          </p>
          <p>
            <strong>4. Media Consent.</strong> I grant Inspire Courts AZ permission
            to use photographs and video taken at the Facility for promotional
            purposes, unless I opt out in writing.
          </p>
          <p>
            <strong>5. Minor Participants.</strong> If the participant is under 18,
            I am signing as their legal parent or guardian and accept all terms on
            their behalf.
          </p>
          <p>
            <strong>6. Duration.</strong> This waiver remains in effect for twelve
            (12) months from the date of signing.
          </p>
        </div>

        {/* FORM */}
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy mb-2">
            Participant Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Player / Participant Name *</span>
              <input
                value={form.playerName}
                onChange={(e) => setForm({ ...form, playerName: e.target.value })}
                required
                className="w-full bg-off-white border border-border rounded px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Team (optional)</span>
              <input
                value={form.teamName}
                onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Phone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-3 py-2"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs text-text-secondary mb-1">
                Parent / Guardian Name (if participant is under 18)
              </span>
              <input
                value={form.parentName}
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-3 py-2"
              />
            </label>
          </div>

          <label className="inline-flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I have read and agree to the terms above. I am legally authorized to sign
              this waiver on behalf of the named participant.
            </span>
          </label>

          <div>
            <label className="block text-xs text-text-secondary mb-2">
              Typed Legal Name *
            </label>
            <input
              value={form.signedByName}
              onChange={(e) => setForm({ ...form, signedByName: e.target.value })}
              placeholder="Full legal name"
              className="w-full bg-off-white border border-border rounded px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-2">Signature *</label>
            <SignaturePad ref={padRef} />
          </div>

          {err && (
            <div className="bg-red/5 border border-red/20 rounded-lg p-3 text-sm text-red flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full bg-red text-white rounded-lg py-3 font-bold uppercase tracking-wide text-sm hover:bg-red/90 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Waiver"}
          </button>
        </div>
      </div>
    </div>
  );
}
