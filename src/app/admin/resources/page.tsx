"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Truck,
  Plus,
  Package,
  Calendar,
  Edit,
  Archive,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Resource = {
  id: number;
  name: string;
  kind: "vehicle" | "equipment" | "court" | "room" | "other";
  description: string | null;
  dailyRateCents: number | null;
  hourlyRateCents: number | null;
  licensePlate: string | null;
  capacity: number | null;
  active: boolean;
  notes: string | null;
  nextBooking: {
    id: number;
    startAt: string;
    endAt: string;
    status: string;
    renterName: string | null;
  } | null;
};

type Booking = {
  id: number;
  resourceId: number;
  resourceName: string | null;
  resourceKind: string | null;
  renterUserId: number | null;
  renterUserName: string | null;
  renterName: string | null;
  renterEmail: string | null;
  renterPhone: string | null;
  startAt: string;
  endAt: string;
  status:
    | "tentative"
    | "confirmed"
    | "in_use"
    | "returned"
    | "cancelled"
    | "no_show";
  amountCents: number;
  paid: boolean;
  purpose: string | null;
  odometerStart: number | null;
  odometerEnd: number | null;
  notes: string | null;
};

const KIND_LABELS: Record<string, string> = {
  vehicle: "Vehicle",
  equipment: "Equipment",
  court: "Court",
  room: "Room",
  other: "Other",
};

const KIND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vehicle: Truck,
  equipment: Package,
  court: Package,
  room: Package,
  other: Package,
};

const STATUS_STYLES: Record<string, string> = {
  tentative: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  in_use: "bg-navy/10 text-navy",
  returned: "bg-cyan-50 text-cyan-700",
  cancelled: "bg-red/10 text-red",
  no_show: "bg-red/10 text-red",
};

function fmtCents(c: number | null): string {
  if (c == null) return "—";
  return `$${Math.floor(c / 100).toLocaleString()}.${String(c % 100).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
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

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (!isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ResourcesPage() {
  const { data: session, status } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"catalog" | "bookings">("catalog");
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showBookingForm, setShowBookingForm] = useState<Resource | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, bRes] = await Promise.all([
        fetch("/api/admin/resources"),
        fetch("/api/admin/resources/bookings"),
      ]);
      if (rRes.ok) setResources((await rRes.json()).data || []);
      if (bRes.ok) setBookings((await bRes.json()).data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Resources & Rentals
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Team van, equipment, rentals. Admin-only — not shown on the public site.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setView("catalog")}
              className={`px-3 py-1.5 text-sm ${
                view === "catalog"
                  ? "bg-navy text-white"
                  : "bg-white text-text-secondary hover:text-navy"
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => setView("bookings")}
              className={`px-3 py-1.5 text-sm ${
                view === "bookings"
                  ? "bg-navy text-white"
                  : "bg-white text-text-secondary hover:text-navy"
              }`}
            >
              Bookings
            </button>
          </div>
          {view === "catalog" ? (
            <button
              onClick={() => setShowResourceForm(true)}
              className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90"
            >
              <Plus className="w-4 h-4" /> Resource
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary text-sm">Loading…</div>
      ) : view === "catalog" ? (
        resources.length === 0 ? (
          <div className="bg-off-white border border-border rounded-xl p-8 text-center">
            <Truck className="w-10 h-10 text-text-secondary mx-auto mb-3" />
            <p className="text-navy font-semibold mb-1">No resources yet</p>
            <p className="text-text-secondary text-sm">
              Add your team van, rental equipment, or court blocks.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const Icon = KIND_ICONS[r.kind] || Package;
              const busyNow =
                r.nextBooking &&
                new Date(r.nextBooking.startAt).getTime() <= Date.now() &&
                new Date(r.nextBooking.endAt).getTime() > Date.now();
              return (
                <div
                  key={r.id}
                  className="bg-white border border-border rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-navy/60" />
                      <div>
                        <div className="font-semibold text-navy">{r.name}</div>
                        <div className="text-xs text-text-secondary">
                          {KIND_LABELS[r.kind]}
                          {r.licensePlate ? ` · ${r.licensePlate}` : ""}
                          {r.capacity ? ` · ${r.capacity} seats` : ""}
                        </div>
                      </div>
                    </div>
                    {!r.active && (
                      <span className="text-xs bg-navy/10 text-navy/70 rounded px-2 py-0.5">
                        archived
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary mt-2 space-y-0.5">
                    {r.hourlyRateCents != null && (
                      <div>
                        <DollarSign className="inline w-3 h-3" /> {fmtCents(r.hourlyRateCents)} / hr
                      </div>
                    )}
                    {r.dailyRateCents != null && (
                      <div>
                        <DollarSign className="inline w-3 h-3" /> {fmtCents(r.dailyRateCents)} / day
                      </div>
                    )}
                  </div>
                  {r.nextBooking ? (
                    <div
                      className={`mt-3 rounded p-2 text-xs ${
                        busyNow ? "bg-navy/10 text-navy" : "bg-off-white text-text-secondary"
                      }`}
                    >
                      <Clock className="inline w-3 h-3 mr-1" />
                      {busyNow ? "In use until " : "Next: "}
                      {fmtDate(r.nextBooking.endAt)}
                      <br />
                      <span className="text-text-secondary">
                        {r.nextBooking.renterName}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 rounded p-2 text-xs bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="inline w-3 h-3 mr-1" /> Available
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setShowBookingForm(r)}
                      disabled={!r.active}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 text-white rounded-md py-1.5 text-xs hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Calendar className="w-3 h-3" /> Book
                    </button>
                    <button
                      onClick={() => setEditingResource(r)}
                      className="inline-flex items-center gap-1 text-xs text-text-secondary border border-border rounded-md px-2 py-1.5 hover:text-navy"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    {r.active && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Archive "${r.name}"? History stays intact.`)) return;
                          await fetch(`/api/admin/resources?id=${r.id}`, { method: "DELETE" });
                          load();
                        }}
                        className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-red border border-border rounded-md px-2 py-1.5"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <BookingsTable
          bookings={bookings}
          onEdit={(b) => setEditingBooking(b)}
          onRefresh={load}
        />
      )}

      {showResourceForm && (
        <ResourceFormModal
          onClose={() => setShowResourceForm(false)}
          onSaved={() => {
            setShowResourceForm(false);
            load();
          }}
        />
      )}
      {editingResource && (
        <ResourceFormModal
          resource={editingResource}
          onClose={() => setEditingResource(null)}
          onSaved={() => {
            setEditingResource(null);
            load();
          }}
        />
      )}
      {showBookingForm && (
        <BookingFormModal
          resource={showBookingForm}
          onClose={() => setShowBookingForm(null)}
          onSaved={() => {
            setShowBookingForm(null);
            load();
          }}
        />
      )}
      {editingBooking && (
        <BookingFormModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSaved={() => {
            setEditingBooking(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function BookingsTable({
  bookings,
  onEdit,
  onRefresh,
}: {
  bookings: Booking[];
  onEdit: (b: Booking) => void;
  onRefresh: () => void;
}) {
  if (bookings.length === 0) {
    return (
      <div className="bg-off-white border border-border rounded-xl p-8 text-center">
        <Calendar className="w-10 h-10 text-text-secondary mx-auto mb-3" />
        <p className="text-navy font-semibold">No bookings in this window</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto bg-white border border-border rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-off-white border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-4 py-3">Resource</th>
            <th className="px-4 py-3">Renter</th>
            <th className="px-4 py-3">Start</th>
            <th className="px-4 py-3">End</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr
              key={b.id}
              className="border-b border-border last:border-0 hover:bg-off-white/50"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-navy">{b.resourceName}</div>
                <div className="text-xs text-text-secondary">{b.resourceKind}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-navy">
                  {b.renterUserName || b.renterName || <span className="italic">—</span>}
                </div>
                <div className="text-xs text-text-secondary">
                  {b.renterEmail || b.renterPhone}
                </div>
              </td>
              <td className="px-4 py-3 text-xs">{fmtDate(b.startAt)}</td>
              <td className="px-4 py-3 text-xs">{fmtDate(b.endAt)}</td>
              <td className="px-4 py-3 font-mono">
                {fmtCents(b.amountCents)}
                {b.paid && (
                  <span className="ml-1 text-xs text-emerald-700">paid</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}
                >
                  {b.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  onClick={() => onEdit(b)}
                  className="inline-flex items-center gap-1 text-xs text-navy hover:text-red mr-2"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
                {b.status !== "cancelled" && (
                  <button
                    onClick={async () => {
                      if (!confirm("Cancel this booking?")) return;
                      await fetch(`/api/admin/resources/bookings?id=${b.id}`, {
                        method: "DELETE",
                      });
                      onRefresh();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-red"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResourceFormModal({
  resource,
  onClose,
  onSaved,
}: {
  resource?: Resource;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: resource?.name ?? "",
    kind: resource?.kind ?? ("vehicle" as const),
    description: resource?.description ?? "",
    dailyRate: resource?.dailyRateCents != null ? (resource.dailyRateCents / 100).toFixed(2) : "",
    hourlyRate:
      resource?.hourlyRateCents != null ? (resource.hourlyRateCents / 100).toFixed(2) : "",
    licensePlate: resource?.licensePlate ?? "",
    capacity: resource?.capacity ?? "",
    active: resource?.active ?? true,
    notes: resource?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        kind: form.kind,
        description: form.description || null,
        dailyRateCents: form.dailyRate ? Math.round(parseFloat(form.dailyRate) * 100) : null,
        hourlyRateCents: form.hourlyRate ? Math.round(parseFloat(form.hourlyRate) * 100) : null,
        licensePlate: form.licensePlate || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        active: form.active,
        notes: form.notes || null,
      };
      const res = resource
        ? await fetch("/api/admin/resources", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: resource.id, ...body }),
          })
        : await fetch("/api/admin/resources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-navy mb-4">
          {resource ? "Edit Resource" : "New Resource"}
        </h2>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="block col-span-2">
              <span className="block text-xs text-text-secondary mb-1">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Team Van #1"
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Kind</span>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as Resource["kind"] })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              >
                <option value="vehicle">Vehicle</option>
                <option value="equipment">Equipment</option>
                <option value="court">Court</option>
                <option value="room">Room</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Active</span>
              <select
                value={form.active ? "yes" : "no"}
                onChange={(e) => setForm({ ...form, active: e.target.value === "yes" })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              >
                <option value="yes">Active</option>
                <option value="no">Archived</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Hourly Rate ($)</span>
              <input
                type="number"
                step="0.01"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Daily Rate ($)</span>
              <input
                type="number"
                step="0.01"
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">License Plate</span>
              <input
                value={form.licensePlate}
                onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                placeholder="ABC-1234"
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Capacity</span>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="15"
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">
              Internal Notes (insurance policy, maint. schedule…)
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          {err && <div className="text-red text-xs">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 bg-navy text-white rounded-md text-sm hover:bg-navy/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingFormModal({
  booking,
  resource,
  onClose,
  onSaved,
}: {
  booking?: Booking;
  resource?: Resource;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!booking;
  const [form, setForm] = useState({
    renterName: booking?.renterName ?? "",
    renterEmail: booking?.renterEmail ?? "",
    renterPhone: booking?.renterPhone ?? "",
    startAt: booking ? toLocalInput(booking.startAt) : "",
    endAt: booking ? toLocalInput(booking.endAt) : "",
    status: booking?.status ?? ("tentative" as const),
    purpose: booking?.purpose ?? "",
    amountDollars:
      booking?.amountCents != null ? (booking.amountCents / 100).toFixed(2) : "",
    paid: booking?.paid ?? false,
    odometerStart:
      booking?.odometerStart != null ? String(booking.odometerStart) : "",
    odometerEnd: booking?.odometerEnd != null ? String(booking.odometerEnd) : "",
    notes: booking?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [overlaps, setOverlaps] = useState<{ id: number; startAt: string; endAt: string }[]>([]);

  async function save(force = false) {
    setSaving(true);
    setErr("");
    setOverlaps([]);
    try {
      const body: Record<string, unknown> = {
        renterName: form.renterName || null,
        renterEmail: form.renterEmail || null,
        renterPhone: form.renterPhone || null,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        status: form.status,
        purpose: form.purpose || null,
        amountCents: form.amountDollars
          ? Math.round(parseFloat(form.amountDollars) * 100)
          : undefined,
        paid: form.paid,
        odometerStart: form.odometerStart ? Number(form.odometerStart) : null,
        odometerEnd: form.odometerEnd ? Number(form.odometerEnd) : null,
        notes: form.notes || null,
      };
      const url = `/api/admin/resources/bookings${force ? "?force=true" : ""}`;
      const res = isEdit
        ? await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: booking!.id, ...body }),
          })
        : await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resourceId: resource!.id, ...body }),
          });
      if (res.status === 409) {
        const j = await res.json();
        if (j.overlaps) {
          setOverlaps(j.overlaps);
          setErr(
            "This window overlaps existing bookings. Review them below or force the save."
          );
          return;
        }
        throw new Error(j.error || "Conflict");
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const title = isEdit
    ? `Edit Booking · ${booking?.resourceName}`
    : `New Booking · ${resource?.name}`;

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-navy mb-4">{title}</h2>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="block col-span-2">
              <span className="block text-xs text-text-secondary mb-1">Renter Name</span>
              <input
                value={form.renterName}
                onChange={(e) => setForm({ ...form, renterName: e.target.value })}
                placeholder="Coach Smith / Acme Co."
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Email</span>
              <input
                type="email"
                value={form.renterEmail}
                onChange={(e) => setForm({ ...form, renterEmail: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Phone</span>
              <input
                value={form.renterPhone}
                onChange={(e) => setForm({ ...form, renterPhone: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Start</span>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">End</span>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Status</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Booking["status"] })
                }
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              >
                <option value="tentative">Tentative</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_use">In Use</option>
                <option value="returned">Returned</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Amount ($)</span>
              <input
                type="number"
                step="0.01"
                value={form.amountDollars}
                onChange={(e) => setForm({ ...form, amountDollars: e.target.value })}
                placeholder="auto from rate if blank"
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.paid}
                onChange={(e) => setForm({ ...form, paid: e.target.checked })}
              />
              <span className="text-xs text-text-secondary">Paid</span>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Odom Start</span>
              <input
                type="number"
                value={form.odometerStart}
                onChange={(e) => setForm({ ...form, odometerStart: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Odom End</span>
              <input
                type="number"
                value={form.odometerEnd}
                onChange={(e) => setForm({ ...form, odometerEnd: e.target.value })}
                className="w-full bg-off-white border border-border rounded px-2 py-1.5"
              />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Purpose</span>
            <input
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="Memorial Day Tournament team transport"
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-off-white border border-border rounded px-2 py-1.5"
            />
          </label>
          {err && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-2 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{err}</div>
            </div>
          )}
          {overlaps.length > 0 && (
            <div className="text-xs">
              <div className="font-medium text-amber-800 mb-1">Overlapping bookings:</div>
              <ul className="list-disc pl-5 text-text-secondary">
                {overlaps.map((o) => (
                  <li key={o.id}>
                    #{o.id}: {fmtDate(o.startAt)} → {fmtDate(o.endAt)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy"
          >
            Cancel
          </button>
          {overlaps.length > 0 && (
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="px-4 py-1.5 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 disabled:opacity-50"
            >
              Force Save
            </button>
          )}
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="px-4 py-1.5 bg-navy text-white rounded-md text-sm hover:bg-navy/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
