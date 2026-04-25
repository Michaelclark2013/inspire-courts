"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  ArrowLeft,
  Clock,
  ArrowUpRight,
  Search,
  Download,
} from "lucide-react";
import { exportCSV } from "@/lib/export";

type Row = {
  booking: {
    id: number;
    resourceId: number;
    renterName: string | null;
    startAt: string;
    endAt: string;
    status: string;
    amountCents: number;
    totalCents: number | null;
    paid: boolean;
    contractNumber: string | null;
  };
  vehicleName: string | null;
  vehiclePlate: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  tentative: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  in_use: "bg-red/10 text-red",
  returned: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-off-white text-text-muted",
  no_show: "bg-red/10 text-red",
};

function dollars(c: number | null): string {
  if (!c) return "$0";
  return `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
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

export default function RentalsListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setError(null);
      const url = filter === "all" ? "/api/admin/rentals" : `/api/admin/rentals?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`rentals ${res.status}`);
      setRows(await res.json());
    } catch (err) {
      setError((err as Error).message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Client-side text search across renter name, contract number, vehicle.
  const filteredRows = rows.filter((r) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      (r.booking.renterName || "").toLowerCase().includes(s) ||
      (r.booking.contractNumber || "").toLowerCase().includes(s) ||
      (r.vehicleName || "").toLowerCase().includes(s) ||
      (r.vehiclePlate || "").toLowerCase().includes(s)
    );
  });

  function exportCsv(records: Row[]) {
    const header = ["Contract", "Renter", "Vehicle", "Plate", "Status", "Paid", "Start", "End", "Base", "Total"];
    const rows = records.map(({ booking: b, vehicleName, vehiclePlate }) => [
      b.contractNumber || "",
      b.renterName || "",
      vehicleName || "",
      vehiclePlate || "",
      b.status,
      b.paid ? "yes" : "no",
      b.startAt,
      b.endAt,
      ((b.amountCents ?? 0) / 100).toFixed(2),
      (((b.totalCents ?? b.amountCents) ?? 0) / 100).toFixed(2),
    ]);
    exportCSV(`rentals-${new Date().toISOString().slice(0, 10)}`, header, rows);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin/resources" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Rental Contracts</p>
          <h1 className="text-navy text-3xl font-bold font-heading flex items-center gap-2">
            <FileText className="w-7 h-7 text-red" /> Rentals
          </h1>
        </div>
        <Link
          href="/admin/rentals/new"
          className="bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> New Rental
        </Link>
      </div>

      <div className="bg-white border border-border rounded-2xl p-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search renter, contract #, vehicle, plate"
            className="w-full bg-off-white border border-border rounded-xl pl-9 pr-4 py-2 text-navy text-sm focus:outline-none focus:border-red/60"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {["all", "confirmed", "in_use", "returned", "cancelled", "tentative"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filter === f ? "bg-navy text-white" : "bg-off-white text-text-muted hover:bg-border"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
          <button
            onClick={() => exportCsv(filteredRows)}
            className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap bg-white border border-border text-navy hover:bg-off-white flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center text-text-muted">Loading…</div>
      ) : error ? (
        <div className="bg-red/10 border border-red/20 rounded-2xl p-6 text-red text-sm">{error}</div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <p className="text-navy font-bold mb-1">No rentals yet</p>
          <p className="text-text-muted text-sm mb-4">Create your first rental contract.</p>
          <Link
            href="/admin/rentals/new"
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> New Rental
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-border">
            {filteredRows.map(({ booking, vehicleName, vehiclePlate }) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/rentals/${booking.id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-off-white transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_STYLES[booking.status] || "bg-off-white text-text-muted"}`}
                      >
                        {booking.status.replace(/_/g, " ")}
                      </span>
                      {booking.paid ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700">Paid</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-50 text-amber-700">Unpaid</span>
                      )}
                      <span className="text-text-muted text-[10px] font-mono">{booking.contractNumber}</span>
                    </div>
                    <p className="text-navy font-semibold text-sm truncate">
                      {booking.renterName || "Internal"} · {vehicleName || "—"}
                      {vehiclePlate ? ` (${vehiclePlate})` : ""}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fmtDate(booking.startAt)} → {fmtDate(booking.endAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-navy font-bold tabular-nums">
                      {dollars(booking.totalCents || booking.amountCents)}
                    </p>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider">Total</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
