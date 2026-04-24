"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, Save } from "lucide-react";

export default function NewVehiclePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    kind: "vehicle",
    make: "",
    model: "",
    year: "",
    color: "",
    licensePlate: "",
    vin: "",
    seats: "",
    capacity: "",
    transmission: "automatic",
    fuelType: "gasoline",
    currentMileage: "",
    dailyRateCents: "",
    hourlyRateCents: "",
    weeklyRateCents: "",
    monthlyRateCents: "",
    mileageIncludedPerDay: "",
    mileageOverageCentsPerMile: "",
    lateFeeCentsPerHour: "",
    securityDepositCents: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceExpiry: "",
    registrationExpiry: "",
    nextOilChangeMileage: "",
    nextInspectionAt: "",
    imageUrl: "",
    notes: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Dollars in the form → cents in the payload.
  const toCents = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = Number(v.replace(/[,$]/g, ""));
    return Number.isFinite(n) ? Math.round(n * 100) : null;
  };
  const toNum = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        ...form,
        year: toNum(form.year),
        seats: toNum(form.seats),
        capacity: toNum(form.capacity),
        currentMileage: toNum(form.currentMileage),
        nextOilChangeMileage: toNum(form.nextOilChangeMileage),
        mileageIncludedPerDay: toNum(form.mileageIncludedPerDay),
        mileageOverageCentsPerMile: toCents(form.mileageOverageCentsPerMile),
        dailyRateCents: toCents(form.dailyRateCents),
        hourlyRateCents: toCents(form.hourlyRateCents),
        weeklyRateCents: toCents(form.weeklyRateCents),
        monthlyRateCents: toCents(form.monthlyRateCents),
        lateFeeCentsPerHour: toCents(form.lateFeeCentsPerHour),
        securityDepositCents: toCents(form.securityDepositCents),
      };
      const res = await fetch("/api/admin/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || `create ${res.status}`);
      }
      const created = await res.json();
      router.push(`/admin/resources/${created.id}`);
    } catch (err) {
      setError((err as Error).message || "Failed to create vehicle");
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-off-white min-h-screen p-4 sm:p-6 lg:p-8">
      <Link href="/admin/resources" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet
      </Link>

      <div className="mb-6">
        <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">New Asset</p>
        <h1 className="text-navy text-3xl font-bold font-heading flex items-center gap-2">
          <Truck className="w-7 h-7 text-red" /> Add Vehicle
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Section title="Identity">
          <Field label="Name *" required>
            <input required value={form.name} onChange={update("name")} className={ipt} placeholder="e.g. Sprinter Van #1" />
          </Field>
          <Field label="Kind">
            <select value={form.kind} onChange={update("kind")} className={ipt}>
              <option value="vehicle">Vehicle</option>
              <option value="equipment">Equipment</option>
              <option value="court">Court</option>
              <option value="room">Room</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Make"><input value={form.make} onChange={update("make")} className={ipt} /></Field>
          <Field label="Model"><input value={form.model} onChange={update("model")} className={ipt} /></Field>
          <Field label="Year"><input type="number" value={form.year} onChange={update("year")} className={ipt} /></Field>
          <Field label="Color"><input value={form.color} onChange={update("color")} className={ipt} /></Field>
          <Field label="License Plate"><input value={form.licensePlate} onChange={update("licensePlate")} className={ipt} /></Field>
          <Field label="VIN"><input value={form.vin} onChange={update("vin")} className={ipt} /></Field>
        </Section>

        <Section title="Specs">
          <Field label="Seats"><input type="number" value={form.seats} onChange={update("seats")} className={ipt} /></Field>
          <Field label="Capacity"><input type="number" value={form.capacity} onChange={update("capacity")} className={ipt} /></Field>
          <Field label="Transmission">
            <select value={form.transmission} onChange={update("transmission")} className={ipt}>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </Field>
          <Field label="Fuel Type">
            <select value={form.fuelType} onChange={update("fuelType")} className={ipt}>
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="ev">EV</option>
            </select>
          </Field>
          <Field label="Current Mileage"><input type="number" value={form.currentMileage} onChange={update("currentMileage")} className={ipt} /></Field>
          <Field label="Image URL"><input value={form.imageUrl} onChange={update("imageUrl")} className={ipt} placeholder="https://..." /></Field>
        </Section>

        <Section title="Rates (USD)">
          <Field label="Hourly"><input value={form.hourlyRateCents} onChange={update("hourlyRateCents")} className={ipt} placeholder="15.00" /></Field>
          <Field label="Daily"><input value={form.dailyRateCents} onChange={update("dailyRateCents")} className={ipt} placeholder="75.00" /></Field>
          <Field label="Weekly"><input value={form.weeklyRateCents} onChange={update("weeklyRateCents")} className={ipt} placeholder="420.00" /></Field>
          <Field label="Monthly"><input value={form.monthlyRateCents} onChange={update("monthlyRateCents")} className={ipt} placeholder="1500.00" /></Field>
          <Field label="Miles Included / Day"><input type="number" value={form.mileageIncludedPerDay} onChange={update("mileageIncludedPerDay")} className={ipt} placeholder="150" /></Field>
          <Field label="Mileage Overage $/mile"><input value={form.mileageOverageCentsPerMile} onChange={update("mileageOverageCentsPerMile")} className={ipt} placeholder="0.35" /></Field>
          <Field label="Late Fee $/hour"><input value={form.lateFeeCentsPerHour} onChange={update("lateFeeCentsPerHour")} className={ipt} placeholder="25.00" /></Field>
          <Field label="Security Deposit $"><input value={form.securityDepositCents} onChange={update("securityDepositCents")} className={ipt} placeholder="250.00" /></Field>
        </Section>

        <Section title="Compliance">
          <Field label="Insurance Provider"><input value={form.insuranceProvider} onChange={update("insuranceProvider")} className={ipt} /></Field>
          <Field label="Policy Number"><input value={form.insurancePolicyNumber} onChange={update("insurancePolicyNumber")} className={ipt} /></Field>
          <Field label="Insurance Expiry"><input type="date" value={form.insuranceExpiry} onChange={update("insuranceExpiry")} className={ipt} /></Field>
          <Field label="Registration Expiry"><input type="date" value={form.registrationExpiry} onChange={update("registrationExpiry")} className={ipt} /></Field>
          <Field label="Next Oil Change (mileage)"><input type="number" value={form.nextOilChangeMileage} onChange={update("nextOilChangeMileage")} className={ipt} /></Field>
          <Field label="Next Inspection"><input type="date" value={form.nextInspectionAt} onChange={update("nextInspectionAt")} className={ipt} /></Field>
        </Section>

        <Section title="Notes">
          <div className="sm:col-span-2">
            <textarea value={form.notes} onChange={update("notes")} rows={3} className={`${ipt} resize-none`} placeholder="Any additional details..." />
          </div>
        </Section>

        {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-4 py-3 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold px-8 py-3 rounded-full text-sm uppercase tracking-wider flex items-center gap-2 justify-center"
        >
          <Save className="w-4 h-4" /> {submitting ? "Saving…" : "Save Vehicle"}
        </button>
      </form>
    </main>
  );
}

const ipt = "w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
      <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-red ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
