"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Truck,
  DollarSign,
  AlertTriangle,
  Shield,
  Gauge,
  Fuel,
  Calendar,
  Plus,
  Clock,
  ArrowUpRight,
  Search,
  Filter,
} from "lucide-react";

type Vehicle = {
  id: number;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  licensePlate: string | null;
  vin: string | null;
  seats: number | null;
  capacity: number | null;
  transmission: string | null;
  fuelType: string | null;
  currentMileage: number | null;
  dailyRateCents: number | null;
  hourlyRateCents: number | null;
  weeklyRateCents: number | null;
  monthlyRateCents: number | null;
  vehicleStatus: "available" | "rented" | "maintenance" | "out_of_service" | "reserved";
  displayStatus: string;
  imageUrl: string | null;
  insuranceExpiry: string | null;
  registrationExpiry: string | null;
  nextOilChangeMileage: number | null;
  nextInspectionAt: string | null;
  alerts: string[];
  openDamageCount: number;
  revenue30Cents: number;
  activeBooking: Booking | null;
  nextBooking: Booking | null;
};

type Booking = {
  id: number;
  renterName: string | null;
  renterUserId: number | null;
  startAt: string;
  endAt: string;
  status: string;
};

type Totals = {
  vehicles: number;
  available: number;
  rented: number;
  reserved: number;
  maintenance: number;
  outOfService: number;
  revenue30Cents: number;
  alertCount: number;
  openDamage: number;
  upcomingBookings: number;
};

type FleetPayload = { vehicles: Vehicle[]; totals: Totals; asOf: string };

const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rented: "bg-red/10 text-red border-red/20",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  maintenance: "bg-blue-50 text-blue-700 border-blue-200",
  out_of_service: "bg-off-white text-text-muted border-border",
};

const ALERT_LABELS: Record<string, { label: string; tone: string }> = {
  insurance_expired: { label: "Insurance expired", tone: "text-red" },
  insurance_expiring: { label: "Insurance expires soon", tone: "text-amber-600" },
  registration_expired: { label: "Registration expired", tone: "text-red" },
  registration_expiring: { label: "Registration expires soon", tone: "text-amber-600" },
  service_due: { label: "Service due", tone: "text-amber-600" },
  inspection_overdue: { label: "Inspection overdue", tone: "text-red" },
  inspection_soon: { label: "Inspection soon", tone: "text-amber-600" },
};

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtRate(v: Vehicle): string {
  if (v.dailyRateCents) return `${dollars(v.dailyRateCents)}/day`;
  if (v.hourlyRateCents) return `${dollars(v.hourlyRateCents)}/hr`;
  if (v.weeklyRateCents) return `${dollars(v.weeklyRateCents)}/wk`;
  return "No rate";
}

export default function ResourcesFleetPage() {
  const [data, setData] = useState<FleetPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/fleet");
      if (!res.ok) throw new Error(`fleet ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError((err as Error).message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredVehicles = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    return data.vehicles.filter((v) => {
      if (filter === "alerts") {
        if (v.alerts.length === 0) return false;
      } else if (filter !== "all" && v.displayStatus !== filter) return false;
      if (!s) return true;
      return (
        v.name.toLowerCase().includes(s) ||
        (v.licensePlate || "").toLowerCase().includes(s) ||
        (v.make || "").toLowerCase().includes(s) ||
        (v.model || "").toLowerCase().includes(s)
      );
    });
  }, [data, filter, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl"
        />
        <div className="relative p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">
                Resources · Rental Fleet
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
                <Truck className="w-8 h-8 text-red" aria-hidden="true" />
                Fleet Command
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-xl">
                Every vehicle, rental, maintenance record, and compliance alert in one view.
              </p>
            </div>
            <div className="flex gap-2 self-start">
              <Link
                href="/admin/rentals/new"
                className="bg-red hover:bg-red-hover rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red/30"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                New Rental
              </Link>
              <Link
                href="/admin/resources/new"
                className="bg-white/10 hover:bg-white/20 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                Add Vehicle
              </Link>
            </div>
          </div>

          {/* KPI bento */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <HeroStat label="Vehicles" value={data?.totals.vehicles ?? 0} />
            <HeroStat label="Available" value={data?.totals.available ?? 0} tone="emerald" />
            <HeroStat label="Rented" value={data?.totals.rented ?? 0} tone="red" />
            <HeroStat label="Reserved" value={data?.totals.reserved ?? 0} tone="amber" />
            <HeroStat
              label="Alerts"
              value={data?.totals.alertCount ?? 0}
              tone={data?.totals.alertCount ? "red" : undefined}
            />
            <HeroStat
              label="30d Revenue"
              value={dollars(data?.totals.revenue30Cents ?? 0)}
              display
            />
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-3 sm:p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, plate, make, model"
            aria-label="Search vehicles by name, plate, make, or model"
            className="w-full bg-off-white border border-border rounded-xl pl-9 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden="true" />
          {[
            { k: "all", label: "All" },
            { k: "available", label: "Available" },
            { k: "rented", label: "Rented" },
            { k: "reserved", label: "Reserved" },
            { k: "maintenance", label: "Maintenance" },
            { k: "alerts", label: "Alerts" },
          ].map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filter === k
                  ? "bg-navy text-white"
                  : "bg-off-white text-text-muted hover:bg-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet grid */}
      {loading ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center text-text-muted">
          Loading fleet…
        </div>
      ) : error ? (
        <div className="bg-red/10 border border-red/20 rounded-2xl p-6 text-red text-sm">
          {error}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <Truck className="w-10 h-10 text-text-muted mx-auto mb-3" aria-hidden="true" />
          <p className="text-navy font-bold mb-1">No vehicles match</p>
          <p className="text-text-muted text-sm mb-4">
            {data?.vehicles.length === 0
              ? "Add your first vehicle to start renting."
              : "Try a different filter or search term."}
          </p>
          {data?.vehicles.length === 0 && (
            <Link
              href="/admin/resources/new"
              className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Vehicle
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVehicles.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroStat({
  label,
  value,
  tone,
  display,
}: {
  label: string;
  value: string | number;
  tone?: "emerald" | "red" | "amber";
  display?: boolean;
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "red"
      ? "text-red"
      : tone === "amber"
      ? "text-amber-300"
      : "text-white";
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4 border border-white/10">
      <p
        className={`font-heading ${display ? "text-2xl" : "text-3xl"} font-bold tracking-tight tabular-nums ${toneClass}`}
      >
        {value}
      </p>
      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1.5 font-semibold">
        {label}
      </p>
    </div>
  );
}

function VehicleCard({ v }: { v: Vehicle }) {
  const statusClass = STATUS_STYLES[v.displayStatus] ?? STATUS_STYLES.out_of_service;

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-5 py-4 border-b border-border flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-off-white flex items-center justify-center flex-shrink-0 overflow-hidden">
          {v.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
          ) : (
            <Truck className="w-6 h-6 text-navy/60" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-navy font-bold text-base truncate">{v.name}</p>
          <p className="text-text-muted text-xs truncate">
            {[v.year, v.make, v.model].filter(Boolean).join(" ") || "—"}
            {v.licensePlate ? ` · ${v.licensePlate}` : ""}
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${statusClass}`}
        >
          {v.displayStatus.replace(/_/g, " ")}
        </span>
      </div>

      <div className="px-5 py-3 border-b border-border grid grid-cols-4 gap-2 text-center">
        <Spec icon={<Calendar className="w-3.5 h-3.5" />} value={v.seats ? `${v.seats}` : "—"} label="Seats" />
        <Spec icon={<Gauge className="w-3.5 h-3.5" />} value={v.currentMileage ? v.currentMileage.toLocaleString() : "—"} label="Miles" />
        <Spec icon={<Fuel className="w-3.5 h-3.5" />} value={v.fuelType || "—"} label="Fuel" />
        <Spec icon={<DollarSign className="w-3.5 h-3.5" />} value={fmtRate(v)} label="Rate" />
      </div>

      {v.activeBooking && (
        <div className="px-5 py-3 border-b border-border bg-red/5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-red" aria-hidden="true" />
            <p className="text-red text-[10px] font-bold uppercase tracking-widest">Currently Out</p>
          </div>
          <p className="text-navy text-sm font-semibold">{v.activeBooking.renterName || "Internal"}</p>
          <p className="text-text-muted text-xs">Due back {fmtDate(v.activeBooking.endAt)}</p>
        </div>
      )}
      {!v.activeBooking && v.nextBooking && (
        <div className="px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <p className="text-amber-600 text-[10px] font-bold uppercase tracking-widest">Next Out</p>
          </div>
          <p className="text-navy text-sm font-semibold truncate">{v.nextBooking.renterName || "Internal"}</p>
          <p className="text-text-muted text-xs">
            {fmtDate(v.nextBooking.startAt)} → {fmtDate(v.nextBooking.endAt)}
          </p>
        </div>
      )}

      {v.alerts.length > 0 && (
        <div className="px-5 py-3 border-b border-border space-y-1">
          {v.alerts.slice(0, 3).map((a) => {
            const info = ALERT_LABELS[a] || { label: a, tone: "text-text-muted" };
            return (
              <div key={a} className="flex items-center gap-2 text-xs">
                <AlertTriangle className={`w-3.5 h-3.5 ${info.tone}`} aria-hidden="true" />
                <span className={info.tone}>{info.label}</span>
              </div>
            );
          })}
          {v.openDamageCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Shield className="w-3.5 h-3.5 text-red" aria-hidden="true" />
              <span className="text-red">
                {v.openDamageCount} open damage report{v.openDamageCount === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="px-5 py-3 flex items-center justify-between gap-2">
        <p className="text-text-muted text-[10px] uppercase tracking-widest">
          30d · <span className="text-emerald-600 font-bold">{dollars(v.revenue30Cents)}</span>
        </p>
        <Link
          href={`/admin/resources/${v.id}`}
          className="text-red text-xs font-bold hover:text-red-hover flex items-center gap-1"
        >
          Detail <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function Spec({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-text-muted">{icon}</div>
      <p className="text-navy font-bold text-xs mt-0.5 truncate">{value}</p>
      <p className="text-text-muted text-[9px] uppercase tracking-wider">{label}</p>
    </div>
  );
}
