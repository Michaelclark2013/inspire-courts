"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  ArrowLeft,
  Wrench,
  Shield,
  Plus,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

type Vehicle = {
  id: number; name: string; make: string | null; model: string | null;
  year: number | null; color: string | null; licensePlate: string | null;
  vin: string | null; seats: number | null; fuelType: string | null;
  currentMileage: number | null; dailyRateCents: number | null;
  weeklyRateCents: number | null; monthlyRateCents: number | null;
  hourlyRateCents: number | null; securityDepositCents: number | null;
  insuranceProvider: string | null; insuranceExpiry: string | null;
  registrationExpiry: string | null; nextOilChangeMileage: number | null;
  nextInspectionAt: string | null; imageUrl: string | null;
  vehicleStatus: string; notes: string | null;
};
type Booking = {
  id: number; renterName: string | null; startAt: string; endAt: string;
  status: string; amountCents: number; totalCents: number | null;
};
type Maint = {
  id: number; type: string; description: string; mileageAt: number | null;
  costCents: number | null; vendor: string | null; performedAt: string;
};
type Damage = {
  id: number; severity: string; description: string; location: string | null;
  repaired: boolean; reportedAt: string; repairCostCents: number | null;
};
type Dossier = {
  vehicle: Vehicle; upcoming: Booking[]; past: Booking[];
  maintenance: Maint[]; damage: Damage[];
};

function dollars(c: number | null): string {
  return `$${((c ?? 0) / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const [data, setData] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "bookings" | "maintenance" | "damage">("overview");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await fetch(`/api/admin/fleet/${id}`);
      if (!res.ok) throw new Error(`load ${res.status}`);
      setData(await res.json());
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-8 text-text-muted">Loading…</div>;
  if (error || !data) return <div className="p-8 text-red">{error || "Not found"}</div>;
  const v = data.vehicle;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin/resources" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Fleet
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8 flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            {v.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover rounded-2xl" />
            ) : <Truck className="w-10 h-10 text-white/80" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1">{v.vehicleStatus.replace(/_/g, " ")}</p>
            <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight">{v.name}</h1>
            <p className="text-white/70 text-sm mt-1">
              {[v.year, v.make, v.model].filter(Boolean).join(" ")} {v.licensePlate ? `· ${v.licensePlate}` : ""}
            </p>
          </div>
          <Link href={`/admin/rentals/new?vehicle=${v.id}`} className="bg-red hover:bg-red-hover rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start">
            <Plus className="w-3.5 h-3.5" /> Rent Out
          </Link>
        </div>
        <div className="relative px-6 sm:px-8 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeroStat label="Miles" value={v.currentMileage?.toLocaleString() || "—"} />
          <HeroStat label="Seats" value={v.seats || "—"} />
          <HeroStat label="Daily Rate" value={v.dailyRateCents ? dollars(v.dailyRateCents) : "—"} />
          <HeroStat label="Deposit" value={v.securityDepositCents ? dollars(v.securityDepositCents) : "—"} />
        </div>
      </section>

      {/* Tabs */}
      <div className="bg-white border border-border rounded-2xl p-1 mb-6 flex gap-1 overflow-x-auto no-scrollbar">
        {[
          { k: "overview", l: "Overview" },
          { k: "bookings", l: `Bookings (${data.upcoming.length + data.past.length})` },
          { k: "maintenance", l: `Maintenance (${data.maintenance.length})` },
          { k: "damage", l: `Damage (${data.damage.length})` },
        ].map(({ k, l }) => (
          <button
            key={k}
            onClick={() => setTab(k as typeof tab)}
            className={`flex-1 whitespace-nowrap text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-xl transition-colors ${
              tab === k ? "bg-navy text-white" : "text-text-muted hover:bg-off-white"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Identity" icon={<Truck />}>
            <Kv label="VIN" value={v.vin || "—"} />
            <Kv label="Color" value={v.color || "—"} />
            <Kv label="Fuel" value={v.fuelType || "—"} />
          </Card>
          <Card title="Rates" icon={<DollarSign />}>
            <Kv label="Hourly" value={v.hourlyRateCents ? dollars(v.hourlyRateCents) : "—"} />
            <Kv label="Daily" value={v.dailyRateCents ? dollars(v.dailyRateCents) : "—"} />
            <Kv label="Weekly" value={v.weeklyRateCents ? dollars(v.weeklyRateCents) : "—"} />
            <Kv label="Monthly" value={v.monthlyRateCents ? dollars(v.monthlyRateCents) : "—"} />
          </Card>
          <Card title="Compliance" icon={<Shield />}>
            <Kv label="Insurance" value={v.insuranceProvider || "—"} />
            <Kv label="Insurance Expires" value={fmtDate(v.insuranceExpiry)} />
            <Kv label="Registration Expires" value={fmtDate(v.registrationExpiry)} />
          </Card>
          <Card title="Service" icon={<Wrench />}>
            <Kv label="Current Mileage" value={v.currentMileage?.toLocaleString() || "—"} />
            <Kv label="Next Oil Change" value={v.nextOilChangeMileage?.toLocaleString() || "—"} />
            <Kv label="Next Inspection" value={fmtDate(v.nextInspectionAt)} />
          </Card>
          {v.notes && (
            <Card title="Notes" icon={<AlertTriangle />}>
              <p className="text-navy text-sm whitespace-pre-wrap">{v.notes}</p>
            </Card>
          )}
        </div>
      )}

      {tab === "bookings" && (
        <div className="space-y-4">
          <Section title="Upcoming" rows={data.upcoming} />
          <Section title="Past" rows={data.past} />
        </div>
      )}

      {tab === "maintenance" && (
        <MaintenanceTab vehicleId={v.id} rows={data.maintenance} onChange={load} />
      )}
      {tab === "damage" && (
        <DamageTab vehicleId={v.id} rows={data.damage} onChange={load} />
      )}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 border border-white/10">
      <p className="text-white font-heading text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1">{label}</p>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
      <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-4 h-4 text-red">{icon}</span>
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-navy font-semibold text-right">{value}</span>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: Booking[] }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-navy font-bold text-sm uppercase tracking-wider">{title} ({rows.length})</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-text-muted text-sm text-center">None</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((b) => (
            <li key={b.id}>
              <Link href={`/admin/rentals/${b.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-off-white">
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-semibold text-sm">{b.renterName || "Internal"}</p>
                  <p className="text-text-muted text-xs">{fmtDate(b.startAt)} → {fmtDate(b.endAt)}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-off-white text-text-muted">
                  {b.status.replace(/_/g, " ")}
                </span>
                <span className="text-navy font-bold tabular-nums">{dollars(b.totalCents || b.amountCents)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MaintenanceTab({ vehicleId, rows, onChange }: { vehicleId: number; rows: Maint[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ type: "oil_change", description: "", mileageAt: "", costCents: "", vendor: "", nextServiceMileage: "" });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const toCents = (v: string) => v ? Math.round(Number(v) * 100) : 0;
      const toNum = (v: string) => v ? Number(v) : null;
      const res = await fetch(`/api/admin/fleet/${vehicleId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          mileageAt: toNum(f.mileageAt),
          nextServiceMileage: toNum(f.nextServiceMileage),
          costCents: toCents(f.costCents),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setF({ type: "oil_change", description: "", mileageAt: "", costCents: "", vendor: "", nextServiceMileage: "" });
      setOpen(false);
      onChange();
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
      >
        <Plus className="w-3.5 h-3.5" /> Log Service
      </button>
      {open && (
        <form onSubmit={save} className="bg-white border border-border rounded-2xl shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={ipt}>
            <option value="oil_change">Oil change</option>
            <option value="tire_rotation">Tire rotation</option>
            <option value="brake_service">Brake service</option>
            <option value="inspection">Inspection</option>
            <option value="repair">Repair</option>
            <option value="cleaning">Cleaning</option>
            <option value="other">Other</option>
          </select>
          <input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} className={ipt} placeholder="Vendor" />
          <input required value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={`${ipt} sm:col-span-2`} placeholder="Description *" />
          <input type="number" value={f.mileageAt} onChange={(e) => setF({ ...f, mileageAt: e.target.value })} className={ipt} placeholder="Mileage at service" />
          <input value={f.costCents} onChange={(e) => setF({ ...f, costCents: e.target.value })} className={ipt} placeholder="Cost ($)" />
          <input type="number" value={f.nextServiceMileage} onChange={(e) => setF({ ...f, nextServiceMileage: e.target.value })} className={ipt} placeholder="Next service (mileage)" />
          <button disabled={busy} className="bg-navy text-white rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider sm:col-span-2">
            {busy ? "Saving…" : "Save"}
          </button>
        </form>
      )}
      <div className="bg-white border border-border rounded-2xl shadow-sm divide-y divide-border">
        {rows.length === 0 ? <p className="p-6 text-center text-text-muted text-sm">No maintenance records</p> :
          rows.map((m) => (
            <div key={m.id} className="px-5 py-3">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="text-navy font-semibold text-sm">{m.description}</p>
                  <p className="text-text-muted text-xs">
                    {m.type.replace(/_/g, " ")} · {fmtDate(m.performedAt)}
                    {m.vendor ? ` · ${m.vendor}` : ""}
                    {m.mileageAt ? ` · ${m.mileageAt.toLocaleString()} mi` : ""}
                  </p>
                </div>
                {m.costCents ? <span className="text-navy font-bold tabular-nums">{dollars(m.costCents)}</span> : null}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function DamageTab({ vehicleId, rows, onChange }: { vehicleId: number; rows: Damage[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ severity: "cosmetic", description: "", location: "", repairCostCents: "" });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const toCents = (v: string) => v ? Math.round(Number(v) * 100) : null;
      const res = await fetch(`/api/admin/fleet/${vehicleId}/damage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, repairCostCents: toCents(f.repairCostCents) }),
      });
      if (!res.ok) throw new Error("save failed");
      setF({ severity: "cosmetic", description: "", location: "", repairCostCents: "" });
      setOpen(false);
      onChange();
    } finally { setBusy(false); }
  }

  async function markRepaired(damageId: number) {
    try {
      const res = await fetch(`/api/admin/fleet/${vehicleId}/damage?damageId=${damageId}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || `Couldn't mark damage repaired (${res.status}).`);
        return;
      }
      onChange();
    } catch {
      alert("Network error. Try again.");
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setOpen(!open)} className="bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
        <Plus className="w-3.5 h-3.5" /> Report Damage
      </button>
      {open && (
        <form onSubmit={save} className="bg-white border border-border rounded-2xl shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })} className={ipt}>
            <option value="cosmetic">Cosmetic</option>
            <option value="minor">Minor</option>
            <option value="major">Major</option>
            <option value="total_loss">Total loss</option>
          </select>
          <input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} className={ipt} placeholder="Location (rear bumper, etc.)" />
          <input required value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={`${ipt} sm:col-span-2`} placeholder="Description *" />
          <input value={f.repairCostCents} onChange={(e) => setF({ ...f, repairCostCents: e.target.value })} className={`${ipt} sm:col-span-2`} placeholder="Est. repair cost ($)" />
          <button disabled={busy} className="bg-navy text-white rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider sm:col-span-2">
            {busy ? "Saving…" : "Report"}
          </button>
        </form>
      )}
      <div className="bg-white border border-border rounded-2xl shadow-sm divide-y divide-border">
        {rows.length === 0 ? <p className="p-6 text-center text-text-muted text-sm">No damage reports</p> :
          rows.map((d) => (
            <div key={d.id} className="px-5 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    d.severity === "total_loss" || d.severity === "major"
                      ? "bg-red/10 text-red"
                      : d.severity === "minor"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-off-white text-text-muted"
                  }`}>{d.severity.replace(/_/g, " ")}</span>
                  {d.repaired ? <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Repaired</span> : null}
                </div>
                <p className="text-navy font-semibold text-sm">{d.description}</p>
                <p className="text-text-muted text-xs">
                  {d.location ? `${d.location} · ` : ""}{fmtDate(d.reportedAt)}
                  {d.repairCostCents ? ` · ${dollars(d.repairCostCents)}` : ""}
                </p>
              </div>
              {!d.repaired && (
                <button onClick={() => markRepaired(d.id)} className="text-xs font-bold text-emerald-600 hover:underline">
                  Mark repaired
                </button>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}

const ipt = "w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60";
