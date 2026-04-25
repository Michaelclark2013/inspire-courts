"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Truck,
  User,
  Clock,
  DollarSign,
  CheckCircle2,
  LogIn,
  LogOut,
  Printer,
  Shield,
} from "lucide-react";

type Vehicle = {
  id: number; name: string; licensePlate: string | null;
  make: string | null; model: string | null; year: number | null;
  currentMileage: number | null;
};
type Booking = {
  id: number; resourceId: number; renterName: string | null;
  renterEmail: string | null; renterPhone: string | null;
  renterLicenseNumber: string | null; renterLicenseState: string | null;
  renterLicenseExpiry: string | null; renterLicensePhotoUrl: string | null;
  renterInsuranceProvider: string | null;
  renterInsurancePolicyNumber: string | null;
  renterInsuranceExpiry: string | null;
  renterInsurancePhotoUrl: string | null;
  renterRegistrationNumber: string | null;
  renterRegistrationState: string | null;
  renterRegistrationExpiry: string | null;
  declinedCollisionWaiver: boolean;
  additionalDriverName: string | null;
  additionalDriverLicense: string | null;
  startAt: string; endAt: string; status: string;
  amountCents: number; totalCents: number | null; paid: boolean;
  paymentMethod: string | null;
  contractNumber: string | null; purpose: string | null; notes: string | null;
  odometerStart: number | null; odometerEnd: number | null;
  fuelStart: string | null; fuelEnd: string | null;
  checkoutAt: string | null; checkinAt: string | null;
  mileageDriven: number | null; mileageOverageCents: number | null;
  lateFeeCents: number | null; fuelChargeCents: number | null;
  damageChargeCents: number | null;
  securityDepositCents: number | null; depositReleased: boolean;
};

function dollars(c: number | null | undefined): string {
  return `$${((c ?? 0) / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return iso; }
}

export default function RentalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setNotFound(false);
      const res = await fetch(`/api/admin/rentals/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error(`load ${res.status}`);
      const d = await res.json();
      setBooking(d.booking);
      setVehicle(d.vehicle);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/admin/rentals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  if (loading) return <div className="p-8 text-text-muted">Loading…</div>;
  if (notFound) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
        <Link href="/admin/rentals" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Rentals
        </Link>
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-navy font-bold mb-1">Rental not found</p>
          <p className="text-text-muted text-sm mb-4">
            This rental contract may have been deleted, or the link is incorrect.
          </p>
          <Link
            href="/admin/rentals"
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to rentals
          </Link>
        </div>
      </div>
    );
  }
  if (error || !booking) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-red/10 border border-red/20 rounded-2xl p-6">
          <p className="text-red font-semibold mb-2">Couldn&apos;t load rental</p>
          <p className="text-red/80 text-sm mb-3">{error || "Try again."}</p>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="bg-red hover:bg-red-hover text-white rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin/rentals" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Rentals
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1 font-mono">
                {booking.contractNumber || "—"}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading flex items-center gap-2">
                <FileText className="w-6 h-6 text-red" /> Rental Contract
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {booking.renterName} · {vehicle?.name} {vehicle?.licensePlate ? `(${vehicle.licensePlate})` : ""}
              </p>
            </div>
            <span className="bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {booking.status.replace(/_/g, " ")}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeroStat label="Base" value={dollars(booking.amountCents)} />
            <HeroStat label="Total" value={dollars(booking.totalCents ?? booking.amountCents)} tone="red" />
            <HeroStat label="Deposit" value={dollars(booking.securityDepositCents)} />
            <HeroStat label={booking.paid ? "Paid" : "Unpaid"} value={booking.paid ? "✓" : "—"} tone={booking.paid ? "emerald" : undefined} />
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {booking.status === "confirmed" && (
          <button
            onClick={() => {
              const odo = prompt("Starting odometer:");
              if (odo === null) return;
              const fuel = prompt("Starting fuel level (e.g. 'Full', '3/4'):") || "";
              patch({
                status: "in_use",
                checkoutAt: new Date().toISOString(),
                odometerStart: Number(odo),
                fuelStart: fuel,
              });
            }}
            className="bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Check Out
          </button>
        )}
        {booking.status === "in_use" && (
          <button
            onClick={() => {
              const odo = prompt("Ending odometer:");
              if (odo === null) return;
              const fuel = prompt("Ending fuel level:") || "";
              patch({
                status: "returned",
                checkinAt: new Date().toISOString(),
                odometerEnd: Number(odo),
                fuelEnd: fuel,
              });
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5" /> Check In
          </button>
        )}
        {!booking.paid && (
          <button
            onClick={() => {
              const method = prompt("Payment method (cash/card/check/square):") || "card";
              patch({ paid: true, paymentMethod: method });
            }}
            className="bg-navy hover:bg-navy/90 text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <DollarSign className="w-3.5 h-3.5" /> Mark Paid
          </button>
        )}
        {booking.status === "returned" && !booking.depositReleased && (
          <button
            onClick={() => patch({ depositReleased: true, depositReleasedAt: new Date().toISOString() })}
            className="bg-white border border-border text-navy hover:bg-off-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Release Deposit
          </button>
        )}
        {booking.status !== "cancelled" && booking.status !== "returned" && (
          <button
            onClick={() => {
              if (confirm("Cancel this rental?")) patch({ status: "cancelled" });
            }}
            className="bg-white border border-red/20 text-red hover:bg-red/5 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            Cancel Rental
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="bg-white border border-border text-navy hover:bg-off-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 no-print"
        >
          <Printer className="w-3.5 h-3.5" /> Print Contract
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Window" icon={<Clock />}>
          <Kv label="Start" value={fmtDate(booking.startAt)} />
          <Kv label="End" value={fmtDate(booking.endAt)} />
          <Kv label="Checkout" value={fmtDate(booking.checkoutAt)} />
          <Kv label="Checkin" value={fmtDate(booking.checkinAt)} />
        </Card>
        <Card title="Renter" icon={<User />}>
          <Kv label="Name" value={booking.renterName || "—"} />
          <Kv label="Email" value={booking.renterEmail || "—"} />
          <Kv label="Phone" value={booking.renterPhone || "—"} />
          <Kv
            label="License"
            value={
              booking.renterLicenseNumber
                ? `${booking.renterLicenseNumber}${booking.renterLicenseState ? ` (${booking.renterLicenseState})` : ""}${
                    booking.renterLicenseExpiry ? ` · exp ${booking.renterLicenseExpiry}` : ""
                  }`
                : "—"
            }
          />
          {booking.renterLicensePhotoUrl && (
            <a
              href={booking.renterLicensePhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red text-xs font-semibold hover:underline"
            >
              View license photo →
            </a>
          )}
          {booking.additionalDriverName && (
            <>
              <div className="border-t border-border my-2" />
              <Kv
                label="+ Additional"
                value={`${booking.additionalDriverName}${booking.additionalDriverLicense ? ` · ${booking.additionalDriverLicense}` : ""}`}
              />
            </>
          )}
        </Card>
        <Card title="Renter Insurance" icon={<Shield />}>
          {booking.declinedCollisionWaiver && (
            <p className="text-amber-700 bg-amber-50 rounded-lg px-3 py-2 text-xs font-semibold mb-2">
              Renter declined collision waiver — using own coverage
            </p>
          )}
          <Kv label="Provider" value={booking.renterInsuranceProvider || "—"} />
          <Kv label="Policy #" value={booking.renterInsurancePolicyNumber || "—"} />
          <Kv label="Expires" value={booking.renterInsuranceExpiry || "—"} />
          {booking.renterInsurancePhotoUrl && (
            <a
              href={booking.renterInsurancePhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red text-xs font-semibold hover:underline"
            >
              View insurance card →
            </a>
          )}
          {(booking.renterRegistrationNumber || booking.renterRegistrationExpiry) && (
            <>
              <div className="border-t border-border my-2" />
              <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">
                Renter's Vehicle Registration
              </p>
              <Kv
                label="Reg #"
                value={
                  booking.renterRegistrationNumber
                    ? `${booking.renterRegistrationNumber}${booking.renterRegistrationState ? ` (${booking.renterRegistrationState})` : ""}`
                    : "—"
                }
              />
              <Kv label="Expires" value={booking.renterRegistrationExpiry || "—"} />
            </>
          )}
        </Card>
        <Card title="Vehicle" icon={<Truck />}>
          <Kv label="Vehicle" value={vehicle?.name || "—"} />
          <Kv label="Plate" value={vehicle?.licensePlate || "—"} />
          <Kv label="Year/Make/Model" value={[vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ") || "—"} />
          <Kv label="Current Mileage" value={vehicle?.currentMileage?.toLocaleString() || "—"} />
        </Card>
        <Card title="Usage & Charges" icon={<DollarSign />}>
          <Kv label="Odometer Start" value={booking.odometerStart?.toLocaleString() || "—"} />
          <Kv label="Odometer End" value={booking.odometerEnd?.toLocaleString() || "—"} />
          <Kv label="Miles Driven" value={booking.mileageDriven?.toLocaleString() || "—"} />
          <Kv label="Fuel Start → End" value={`${booking.fuelStart || "—"} → ${booking.fuelEnd || "—"}`} />
          <div className="border-t border-border my-2" />
          <Kv label="Base Rate" value={dollars(booking.amountCents)} />
          <Kv label="Mileage Overage" value={dollars(booking.mileageOverageCents)} />
          <Kv label="Late Fee" value={dollars(booking.lateFeeCents)} />
          <Kv label="Fuel Charge" value={dollars(booking.fuelChargeCents)} />
          <Kv label="Damage Charge" value={dollars(booking.damageChargeCents)} />
          <Kv label="TOTAL" value={dollars(booking.totalCents ?? booking.amountCents)} bold />
        </Card>
      </div>

      {booking.notes && (
        <div className="bg-white border border-border rounded-2xl shadow-sm p-5 mt-4">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-2">Notes</h3>
          <p className="text-navy text-sm whitespace-pre-wrap">{booking.notes}</p>
        </div>
      )}
    </div>
  );
}

function HeroStat({ label, value, tone }: { label: string; value: string; tone?: "red" | "emerald" }) {
  const toneClass = tone === "red" ? "text-red" : tone === "emerald" ? "text-emerald-300" : "text-white";
  return (
    <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
      <p className={`font-heading text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1">{label}</p>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
      <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-4 h-4 text-red">{icon}</span>{title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Kv({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className={`text-right ${bold ? "text-navy font-bold text-base" : "text-navy font-semibold"}`}>{value}</span>
    </div>
  );
}
