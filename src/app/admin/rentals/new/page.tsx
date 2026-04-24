"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, Save, AlertCircle, CheckCircle2 } from "lucide-react";

type AvailVehicle = {
  id: number;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
  seats: number | null;
  vehicleStatus: string;
  dailyRateCents: number | null;
  available: boolean;
  blockedByStatus: boolean;
  conflicts: { startAt: string; endAt: string }[];
};

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewRentalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preResourceId = searchParams?.get("vehicle");

  const now = new Date();
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const [startAt, setStartAt] = useState(toLocalInput(now));
  const [endAt, setEndAt] = useState(toLocalInput(later));
  const [resourceId, setResourceId] = useState<number | null>(
    preResourceId ? Number(preResourceId) : null
  );
  const [renterName, setRenterName] = useState("");
  const [renterEmail, setRenterEmail] = useState("");
  const [renterPhone, setRenterPhone] = useState("");
  const [renterLicenseNumber, setRenterLicenseNumber] = useState("");
  const [renterLicenseState, setRenterLicenseState] = useState("");
  const [renterLicenseExpiry, setRenterLicenseExpiry] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  const [availability, setAvailability] = useState<AvailVehicle[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh availability when window changes.
  useEffect(() => {
    const start = new Date(startAt).toISOString();
    const end = new Date(endAt).toISOString();
    if (new Date(end).getTime() <= new Date(start).getTime()) return;
    setAvailLoading(true);
    fetch(`/api/admin/fleet/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      .then((r) => r.json())
      .then((d) => setAvailability(d.vehicles || []))
      .catch(() => setAvailability([]))
      .finally(() => setAvailLoading(false));
  }, [startAt, endAt]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!resourceId) throw new Error("Pick a vehicle");
      const res = await fetch("/api/admin/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          renterName, renterEmail, renterPhone,
          renterLicenseNumber, renterLicenseState, renterLicenseExpiry,
          purpose, notes,
          status: "confirmed",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || `create ${res.status}`);
      }
      const created = await res.json();
      router.push(`/admin/rentals/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-off-white min-h-screen p-4 sm:p-6 lg:p-8">
      <Link href="/admin/rentals" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Rentals
      </Link>

      <div className="mb-6">
        <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">New Rental</p>
        <h1 className="text-navy text-3xl font-bold font-heading">Create Rental Contract</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Window */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">Rental Window</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Start *</label>
              <input type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} className={ipt} />
            </div>
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">End *</label>
              <input type="datetime-local" required value={endAt} onChange={(e) => setEndAt(e.target.value)} className={ipt} />
            </div>
          </div>
        </div>

        {/* Availability picker */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            Pick Vehicle
            {availLoading && <span className="text-[10px] text-text-muted font-normal">Checking…</span>}
          </h2>
          {availability.length === 0 ? (
            <p className="text-text-muted text-sm">No vehicles in system yet. <Link href="/admin/resources/new" className="text-red font-semibold">Add one.</Link></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availability.map((v) => {
                const selected = resourceId === v.id;
                const blocked = !v.available;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={blocked}
                    onClick={() => setResourceId(v.id)}
                    className={`text-left border rounded-2xl p-4 transition-all ${
                      blocked
                        ? "border-red/20 bg-red/5 opacity-60 cursor-not-allowed"
                        : selected
                        ? "border-red bg-red/5 shadow-md"
                        : "border-border bg-white hover:border-navy/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-navy/60" />
                      <p className="text-navy font-bold text-sm flex-1 truncate">{v.name}</p>
                      {blocked ? <AlertCircle className="w-4 h-4 text-red" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-text-muted text-xs truncate">
                      {[v.year, v.make, v.model].filter(Boolean).join(" ") || "—"}
                      {v.licensePlate ? ` · ${v.licensePlate}` : ""}
                    </p>
                    <p className="text-text-muted text-xs mt-1">
                      {v.seats ? `${v.seats} seats · ` : ""}
                      {v.dailyRateCents ? `$${v.dailyRateCents / 100}/day` : "No rate"}
                    </p>
                    {blocked && (
                      <p className="text-red text-[11px] font-semibold mt-2">
                        {v.blockedByStatus ? "Out of service" : "Conflict with existing booking"}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Renter */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4">Renter</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Name *</label>
              <input required value={renterName} onChange={(e) => setRenterName(e.target.value)} className={ipt} />
            </div>
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={renterEmail} onChange={(e) => setRenterEmail(e.target.value)} className={ipt} />
            </div>
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Phone</label>
              <input value={renterPhone} onChange={(e) => setRenterPhone(e.target.value)} className={ipt} />
            </div>
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Purpose</label>
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className={ipt} placeholder="Team trip, delivery, etc." />
            </div>
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Driver's License #</label>
              <input value={renterLicenseNumber} onChange={(e) => setRenterLicenseNumber(e.target.value)} className={ipt} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">State</label>
                <input value={renterLicenseState} onChange={(e) => setRenterLicenseState(e.target.value)} className={ipt} maxLength={2} />
              </div>
              <div>
                <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Expiry</label>
                <input type="date" value={renterLicenseExpiry} onChange={(e) => setRenterLicenseExpiry(e.target.value)} className={ipt} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${ipt} resize-none`} />
            </div>
          </div>
        </div>

        {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-4 py-3 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={submitting || !resourceId}
          className="w-full sm:w-auto bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold px-8 py-3 rounded-full text-sm uppercase tracking-wider flex items-center gap-2 justify-center"
        >
          <Save className="w-4 h-4" /> {submitting ? "Creating…" : "Create Rental"}
        </button>
      </form>
    </main>
  );
}

const ipt = "w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60";
