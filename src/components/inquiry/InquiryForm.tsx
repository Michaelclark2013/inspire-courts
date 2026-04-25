"use client";

import { useState } from "react";
import { Send, Check } from "lucide-react";
import type { InquiryConfig, InquiryField } from "@/lib/inquiry-forms";

type FieldValue = string | string[] | number;

export function InquiryForm({ config, source }: { config: InquiryConfig; source?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<Record<string, FieldValue>>({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: string, value: FieldValue) {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please share your name.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Email or phone is required so we can get back to you.");
      return;
    }
    // Validate required custom fields
    for (const f of config.fields) {
      if (f.required) {
        const v = details[f.key];
        if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
          setError(`Please fill out: ${f.label}`);
          return;
        }
      }
    }
    setBusy(true);
    try {
      // Pull `sports` to top-level if present in details for indexing.
      const sports = details["sports"] || details["sport"];
      const res = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: config.kind,
          name,
          email: email || undefined,
          phone: phone || undefined,
          message: message || undefined,
          details,
          sports,
          source: source || `inquire/${config.slug}`,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Something went wrong. Try again or call us.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-emerald-800 font-bold text-lg mb-1">Got it.</h3>
        <p className="text-emerald-700 text-sm">
          A team member will reach out within 30 minutes during business hours
          (Mon-Fri 8a-7p · Sat 9a-5p). Check your phone — we sent an instant text
          confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-border rounded-2xl shadow-lg p-5 sm:p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Your name" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-off-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder="Jane Smith"
            required
          />
        </Field>
        <Field label="Phone" helper="We'll text you back within 30 min">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-off-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder="(480) 555-0100"
          />
        </Field>
      </div>
      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-off-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
          placeholder="you@example.com"
        />
      </Field>

      {/* Custom fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {config.fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <DynamicField field={field} value={details[field.key]} onChange={(v) => setField(field.key, v)} />
          </div>
        ))}
      </div>

      <Field label="Anything else we should know?">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full bg-off-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </Field>

      {error && (
        <div className="bg-red/5 border border-red/20 text-red rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
      >
        <Send className="w-4 h-4" />
        {busy ? "Sending…" : "Send inquiry"}
      </button>

      <p className="text-[10px] text-text-muted text-center">
        By submitting you agree to receive a follow-up text or call. Reply STOP anytime to opt out.
      </p>
    </form>
  );
}

function Field({ label, required, helper, children }: { label: string; required?: boolean; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
        {label} {required && <span className="text-red">*</span>}
      </span>
      {children}
      {helper && <span className="block text-[10px] text-text-muted mt-1">{helper}</span>}
    </label>
  );
}

function DynamicField({ field, value, onChange }: { field: InquiryField; value: FieldValue | undefined; onChange: (v: FieldValue) => void }) {
  const required = field.required;
  const baseClass = "w-full bg-off-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20";
  return (
    <Field label={field.label} required={required} helper={field.helper}>
      {field.type === "text" && (
        <input
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClass}
          required={required}
        />
      )}
      {field.type === "number" && (
        <input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          className={baseClass}
          required={required}
        />
      )}
      {field.type === "date" && (
        <input
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          required={required}
        />
      )}
      {field.type === "textarea" && (
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={baseClass}
          required={required}
        />
      )}
      {field.type === "select" && (
        <select
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          required={required}
        >
          <option value="">Select…</option>
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {field.type === "multiselect" && (
        <div className="flex flex-wrap gap-1.5">
          {field.options?.map((o) => {
            const sel = Array.isArray(value) && (value as string[]).includes(o);
            return (
              <button
                type="button"
                key={o}
                onClick={() => {
                  const cur = Array.isArray(value) ? (value as string[]) : [];
                  onChange(sel ? cur.filter((x) => x !== o) : [...cur, o]);
                }}
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                  sel ? "bg-navy text-white border-navy" : "bg-off-white text-text-muted border-border hover:border-navy/40"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      )}
    </Field>
  );
}
