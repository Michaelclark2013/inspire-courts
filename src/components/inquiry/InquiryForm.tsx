"use client";

import { useState, useEffect } from "react";
import { Send, Check } from "lucide-react";
import type { InquiryConfig, InquiryField } from "@/lib/inquiry-forms";
import { trackConversion, trackEvent } from "@/lib/analytics";

type FieldValue = string | string[] | number;

export function InquiryForm({ config, source }: { config: InquiryConfig; source?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<Record<string, FieldValue>>({});
  const [honeypot, setHoneypot] = useState("");
  // Capture UTM + referrer once on mount. Keeps the source field
  // attribution-rich without the user seeing or filling anything.
  const [attribution, setAttribution] = useState<{
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  }>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setAttribution({
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      referrer: document.referrer || undefined,
    });
  }, []);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Field key of the first invalid input so we can highlight it inline.
  // Cleared whenever the user edits any field.
  const [invalidField, setInvalidField] = useState<string | null>(null);

  function setField(key: string, value: FieldValue) {
    setDetails((prev) => ({ ...prev, [key]: value }));
    if (invalidField === key) setInvalidField(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInvalidField(null);
    if (!name.trim()) {
      setError("Please share your name.");
      setInvalidField("name");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Email or phone is required so we can get back to you.");
      setInvalidField("phone");
      return;
    }
    // Validate required custom fields
    for (const f of config.fields) {
      if (f.required) {
        const v = details[f.key];
        if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
          setError(`Please fill out: ${f.label}`);
          setInvalidField(f.key);
          return;
        }
      }
    }
    setBusy(true);
    try {
      // Pull `sports` to top-level if present in details for indexing.
      const sports = details["sports"] || details["sport"];
      // Stitch UTM into source so attribution rolls up cleanly.
      const utmTag = attribution.utmSource
        ? `utm:${attribution.utmSource}${attribution.utmCampaign ? `/${attribution.utmCampaign}` : ""}`
        : "";
      const finalSource = [source || `inquire/${config.slug}`, utmTag]
        .filter(Boolean)
        .join("|");
      const res = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: config.kind,
          name,
          email: email || undefined,
          phone: phone || undefined,
          message: message || undefined,
          details: { ...details, ...attribution },
          sports,
          source: finalSource,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
          // Honeypot — bots fill it, real users never see it.
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Something went wrong. Try again or call us.");
        return;
      }
      // Fire analytics — gives marketing a real conversion event in
      // GA + Meta Pixel + any future tools, with the inquiry kind +
      // source so funnels can be sliced.
      trackConversion("inquire_form_submit");
      trackEvent("inquire_submitted", {
        kind: config.kind,
        source: finalSource,
        utm_source: attribution.utmSource ?? "",
        utm_campaign: attribution.utmCampaign ?? "",
      });
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-fade-in-up"
      >
        <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 animate-success-pop">
          <Check className="w-7 h-7 text-white" strokeWidth={3} />
        </div>
        <h3 className="text-emerald-800 font-bold text-xl mb-1.5">Got it.</h3>
        <p className="text-emerald-700 text-sm max-w-md mx-auto">
          A team member will reach out within 30 minutes during business hours
          (Mon-Fri 8a-7p · Sat 9a-5p). Check your phone — we sent an instant text
          confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-border rounded-2xl shadow-lg p-5 sm:p-6 space-y-4">
      {/* Honeypot — visually hidden + tabindex out of order. Bots fill,
          humans don't. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden" style={{ position: "absolute" }}>
        <label htmlFor="website-url-field">Website (leave blank)</label>
        <input
          id="website-url-field"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Your name" required invalid={invalidField === "name"}>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (invalidField === "name") setInvalidField(null);
            }}
            className={inputClass(invalidField === "name")}
            placeholder="Jane Smith"
            aria-invalid={invalidField === "name" || undefined}
            required
          />
        </Field>
        <Field label="Phone" helper="We'll text you back within 30 min" invalid={invalidField === "phone"}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (invalidField === "phone") setInvalidField(null);
            }}
            className={inputClass(invalidField === "phone")}
            placeholder="(480) 555-0100"
            aria-invalid={invalidField === "phone" || undefined}
          />
        </Field>
      </div>
      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (invalidField === "phone") setInvalidField(null);
          }}
          className={inputClass(false)}
          placeholder="you@example.com"
        />
      </Field>

      {/* Custom fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {config.fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <DynamicField
              field={field}
              value={details[field.key]}
              onChange={(v) => setField(field.key, v)}
              invalid={invalidField === field.key}
            />
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
        <div role="alert" aria-live="polite" className="bg-red/5 border border-red/20 text-red rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
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

function inputClass(invalid: boolean) {
  return `w-full bg-off-white border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red focus:ring-red/30"
      : "border-border focus:ring-navy/20"
  }`;
}

function Field({ label, required, helper, invalid, children }: { label: string; required?: boolean; helper?: string; invalid?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wider text-navy mb-1">
        {label} {required && <span className="text-red">*</span>}
      </span>
      {children}
      {helper && <span className="block text-[10px] text-text-muted mt-1">{helper}</span>}
      {invalid && (
        <span className="block text-[10px] font-semibold text-red mt-1">
          {required ? "Required" : "Please complete this field"}
        </span>
      )}
    </label>
  );
}

function DynamicField({ field, value, onChange, invalid }: { field: InquiryField; value: FieldValue | undefined; onChange: (v: FieldValue) => void; invalid?: boolean }) {
  const required = field.required;
  const cls = inputClass(!!invalid);
  return (
    <Field label={field.label} required={required} helper={field.helper} invalid={invalid}>
      {field.type === "text" && (
        <input
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cls}
          aria-invalid={invalid || undefined}
          required={required}
        />
      )}
      {field.type === "number" && (
        <input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          className={cls}
          aria-invalid={invalid || undefined}
          required={required}
        />
      )}
      {field.type === "date" && (
        <input
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          aria-invalid={invalid || undefined}
          required={required}
        />
      )}
      {field.type === "textarea" && (
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={cls}
          aria-invalid={invalid || undefined}
          required={required}
        />
      )}
      {field.type === "select" && (
        <select
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          aria-invalid={invalid || undefined}
          required={required}
        >
          <option value="">Select…</option>
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {field.type === "multiselect" && (
        <div
          className={`flex flex-wrap gap-1.5 ${invalid ? "ring-2 ring-red/40 rounded-lg p-1" : ""}`}
          aria-invalid={invalid || undefined}
        >
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
