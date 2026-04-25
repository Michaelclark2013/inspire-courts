"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Package,
  Plus,
  AlertTriangle,
  Minus,
  Truck,
  ShoppingCart,
  Wrench,
  Shirt,
  Volume2,
  LifeBuoy,
  Archive,
  Search,
  Filter,
  Clock,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react";
import { exportCSV } from "@/lib/export";
import { SkeletonRows } from "@/components/ui/SkeletonCard";

type Item = {
  id: number;
  name: string;
  sku: string | null;
  category: "sports" | "av" | "safety" | "janitorial" | "concessions" | "office" | "other";
  location: string | null;
  onHand: number;
  minQuantity: number;
  unitCostCents: number | null;
  supplier: string | null;
  supplierSku: string | null;
  lastRestockedAt: string | null;
  notes: string | null;
  active: boolean;
};

type CategoryAgg = {
  category: Item["category"];
  items: number;
  onHand: number;
  valueCents: number;
  lowStock: number;
};

type MovementAgg = {
  type: "restock" | "usage" | "adjustment" | "transfer" | "damage";
  count: number;
  totalDelta: number;
};

type Movement = {
  id: number;
  equipmentId: number;
  type: string;
  delta: number;
  balanceAfter: number;
  occurredAt: string;
  notes: string | null;
  equipmentName: string | null;
  equipmentCategory: string | null;
};

type Summary = {
  items: Item[];
  categoryAgg: CategoryAgg[];
  movementAgg: MovementAgg[];
  recentMovements: Movement[];
  needsReorder: Item[];
  totals: { items: number; onHand: number; valueCents: number; needsReorder: number };
};

const CATEGORIES: Array<{
  k: Item["category"];
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  iconBg: string;
  iconFg: string;
}> = [
  { k: "sports", label: "Sports", blurb: "Balls, cones, pinnies", icon: Shirt, tint: "red", iconBg: "bg-red/10", iconFg: "text-red" },
  { k: "av", label: "AV", blurb: "Scoreboards, cameras", icon: Volume2, tint: "blue", iconBg: "bg-blue-50", iconFg: "text-blue-600" },
  { k: "safety", label: "Safety", blurb: "First aid, AEDs, ice", icon: LifeBuoy, tint: "emerald", iconBg: "bg-emerald-50", iconFg: "text-emerald-600" },
  { k: "janitorial", label: "Janitorial", blurb: "TP, cleaning supplies", icon: Wrench, tint: "amber", iconBg: "bg-amber-50", iconFg: "text-amber-600" },
  { k: "concessions", label: "Concessions", blurb: "Snack bar stock", icon: ShoppingCart, tint: "purple", iconBg: "bg-purple-50", iconFg: "text-purple-600" },
  { k: "office", label: "Office", blurb: "Front-desk supplies", icon: Archive, tint: "navy", iconBg: "bg-navy/5", iconFg: "text-navy" },
  { k: "other", label: "Other", blurb: "Uncategorized", icon: Package, tint: "navy", iconBg: "bg-off-white", iconFg: "text-text-muted" },
];

function dollars(c: number): string {
  return `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }); }
  catch { return iso; }
}

function fmtRel(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch { return iso; }
}

export default function EquipmentPage() {
  const { status } = useSession();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showMovements, setShowMovements] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/equipment/summary");
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  async function movement(item: Item, delta: number, type: "restock" | "usage" | "adjustment") {
    await fetch("/api/admin/equipment/movement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: item.id, type, delta }),
    });
    load();
  }

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    return data.items.filter((i) => {
      if (filter === "reorder") {
        if (i.onHand > i.minQuantity) return false;
      } else if (filter !== "all" && i.category !== filter) return false;
      if (!s) return true;
      return (
        i.name.toLowerCase().includes(s) ||
        (i.sku || "").toLowerCase().includes(s) ||
        (i.supplier || "").toLowerCase().includes(s) ||
        (i.location || "").toLowerCase().includes(s)
      );
    });
  }, [data, filter, search]);

  const categoryLookup = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c.k, c])),
    []
  );

  const aggByCategory = useMemo(() => {
    const map: Record<string, CategoryAgg> = {};
    (data?.categoryAgg || []).forEach((a) => { map[a.category] = a; });
    return map;
  }, [data]);

  function exportReorderCsv() {
    if (!data) return;
    const header = ["Name", "SKU", "Category", "On Hand", "Min Qty", "To Order", "Supplier", "Supplier SKU", "Unit Cost"];
    const rows = data.needsReorder.map((i) => [
      i.name,
      i.sku || "",
      i.category,
      String(i.onHand),
      String(i.minQuantity),
      String(Math.max(0, i.minQuantity - i.onHand + i.minQuantity)),
      i.supplier || "",
      i.supplierSku || "",
      String((i.unitCostCents || 0) / 100),
    ]);
    exportCSV(`reorder-${new Date().toISOString().slice(0, 10)}`, header, rows);
  }

  if (status === "loading") return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Facility · Inventory</p>
              <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
                <Package className="w-8 h-8 text-red" aria-hidden="true" />
                Inventory Command
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-xl">
                Scoreboards, toilet paper, first-aid kits, snack-bar stock — every item tracked with restock alerts and full audit trail.
              </p>
            </div>
            <div className="flex gap-2 self-start">
              <button
                onClick={() => setShowCreate(true)}
                className="bg-red hover:bg-red-hover rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red/30"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
              <button
                onClick={() => setShowMovements((v) => !v)}
                className="bg-white/10 hover:bg-white/20 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Clock className="w-3.5 h-3.5" /> {showMovements ? "Hide" : "Movements"}
              </button>
            </div>
          </div>

          {/* KPI bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeroStat label="Items" value={data?.totals.items ?? 0} />
            <HeroStat label="Units" value={(data?.totals.onHand ?? 0).toLocaleString()} />
            <HeroStat label="Value on Hand" value={dollars(data?.totals.valueCents ?? 0)} display />
            <HeroStat
              label="Reorder"
              value={data?.totals.needsReorder ?? 0}
              tone={data?.totals.needsReorder ? "red" : undefined}
            />
          </div>
        </div>
      </section>

      {/* Reorder banner */}
      {data && data.needsReorder.length > 0 && (
        <div className="bg-white border border-red/20 rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="bg-red/5 border-b border-red/10 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red" aria-hidden="true" />
              <p className="text-navy font-bold text-sm uppercase tracking-wider">
                Reorder List <span className="text-red">({data.needsReorder.length})</span>
              </p>
            </div>
            <button
              onClick={exportReorderCsv}
              className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white border border-border text-navy hover:bg-off-white flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
          <ul className="divide-y divide-border">
            {data.needsReorder.slice(0, 5).map((i) => (
              <li key={i.id} className="px-5 py-2.5 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-red/10 text-red text-xs font-bold flex items-center justify-center">
                  {i.minQuantity - i.onHand}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-semibold text-sm truncate">{i.name}</p>
                  <p className="text-text-muted text-xs truncate">
                    {i.onHand} on hand · min {i.minQuantity}
                    {i.supplier ? ` · ${i.supplier}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const qty = prompt(`Restock — how many ${i.name}?`, String(i.minQuantity));
                    if (qty) movement(i, Number(qty), "restock");
                  }}
                  className="text-red text-xs font-bold hover:underline whitespace-nowrap"
                >
                  Restock
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-category tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        {CATEGORIES.map((c) => {
          const agg = aggByCategory[c.k];
          const count = agg?.items || 0;
          const low = agg?.lowStock || 0;
          return (
            <button
              key={c.k}
              onClick={() => setFilter(c.k === filter ? "all" : c.k)}
              className={`text-left bg-white border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${
                filter === c.k ? "border-navy" : "border-border"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center mb-3`}>
                <c.icon className={`w-4 h-4 ${c.iconFg}`} />
              </div>
              <p className="text-navy font-bold text-sm">{c.label}</p>
              <p className="text-text-muted text-xs">{count} item{count === 1 ? "" : "s"}</p>
              {low > 0 && (
                <p className="text-red text-[10px] font-bold uppercase tracking-wider mt-1">
                  {low} low
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-3 sm:p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, supplier, location"
            aria-label="Search equipment by name, SKU, supplier, or location"
            className="w-full bg-off-white border border-border rounded-xl pl-9 pr-4 py-2 text-navy text-sm focus:outline-none focus:border-red/60"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden="true" />
          {["all", "reorder", ...CATEGORIES.map((c) => c.k)].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filter === f ? "bg-navy text-white" : "bg-off-white text-text-muted hover:bg-border"
              }`}
            >
              {f === "all" ? "All" : f === "reorder" ? "Reorder" : categoryLookup[f as Item["category"]]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {/* Recent movements */}
      {showMovements && data && (
        <div className="bg-white border border-border rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Recent Movements</h2>
          </div>
          <ul className="divide-y divide-border max-h-96 overflow-y-auto">
            {data.recentMovements.length === 0 ? (
              <li className="p-6 text-center text-text-muted text-sm">No movements yet</li>
            ) : (
              data.recentMovements.map((m) => (
                <li key={m.id} className="px-5 py-2.5 flex items-center gap-3">
                  {m.delta > 0 ? (
                    <ArrowUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-navy text-sm font-semibold truncate">
                      {m.delta > 0 ? "+" : ""}
                      {m.delta} {m.equipmentName}
                      <span className="text-text-muted text-xs font-normal ml-1">({m.type})</span>
                    </p>
                    <p className="text-text-muted text-xs">
                      Balance: {m.balanceAfter} · {fmtRel(m.occurredAt)}
                      {m.notes ? ` · ${m.notes}` : ""}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Item grid */}
      {loading ? (
        <SkeletonRows count={6} />
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <Package className="w-10 h-10 text-text-muted mx-auto mb-3" aria-hidden="true" />
          <p className="text-navy font-bold mb-1">
            {data?.items.length === 0 ? "No inventory yet" : "No items match"}
          </p>
          {data?.items.length === 0 && (
            <>
              <p className="text-text-muted text-sm mb-4">Add your first inventory item — toilet paper, scoreboards, anything.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((i) => {
            const cat = categoryLookup[i.category];
            const low = i.onHand <= i.minQuantity;
            return (
              <div
                key={i.id}
                className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                  low ? "border-red/30" : "border-border"
                }`}
              >
                <div className="px-5 py-4 border-b border-border flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cat?.iconBg || "bg-off-white"} flex items-center justify-center flex-shrink-0`}>
                    {cat && <cat.icon className={`w-5 h-5 ${cat.iconFg}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-navy font-bold text-base truncate">{i.name}</p>
                    <p className="text-text-muted text-xs truncate">
                      {cat?.label}
                      {i.sku ? ` · ${i.sku}` : ""}
                      {i.location ? ` · ${i.location}` : ""}
                    </p>
                  </div>
                  {low && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red/10 text-red uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      Low
                    </span>
                  )}
                </div>

                <div className="px-5 py-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className={`font-heading text-3xl font-bold tabular-nums ${low ? "text-red" : "text-navy"}`}>
                      {i.onHand}
                    </p>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider">On Hand</p>
                  </div>
                  <div>
                    <p className="text-navy font-bold text-xl tabular-nums">{i.minQuantity}</p>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider">Min Qty</p>
                  </div>
                  <div>
                    <p className="text-navy font-bold text-xl tabular-nums">
                      {i.unitCostCents ? dollars(i.unitCostCents * i.onHand) : "—"}
                    </p>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider">Value</p>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-border flex flex-wrap gap-1.5">
                  <button
                    onClick={() => movement(i, -1, "usage")}
                    disabled={i.onHand === 0}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-off-white text-navy hover:bg-border disabled:opacity-40 flex items-center gap-1"
                  >
                    <Minus className="w-3 h-3" /> 1
                  </button>
                  <button
                    onClick={() => movement(i, -5, "usage")}
                    disabled={i.onHand < 5}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-off-white text-navy hover:bg-border disabled:opacity-40"
                  >
                    −5
                  </button>
                  <button
                    onClick={() => movement(i, 1, "restock")}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 1
                  </button>
                  <button
                    onClick={() => movement(i, 10, "restock")}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => {
                      const qty = prompt("Restock how many?", "0");
                      if (qty) movement(i, Number(qty), "restock");
                    }}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red text-white hover:bg-red-hover flex items-center gap-1 ml-auto"
                  >
                    <Truck className="w-3 h-3" /> Restock
                  </button>
                </div>

                {(i.supplier || i.lastRestockedAt) && (
                  <div className="px-5 py-2 border-t border-border text-[10px] text-text-muted flex justify-between">
                    <span>{i.supplier || "—"}</span>
                    <span>Last in {fmtDate(i.lastRestockedAt)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      {showCreate && <CreateForm onClose={() => { setShowCreate(false); load(); }} />}
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
  tone?: "red" | "emerald";
  display?: boolean;
}) {
  const toneClass = tone === "red" ? "text-red" : tone === "emerald" ? "text-emerald-300" : "text-white";
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4 border border-white/10">
      <p className={`font-heading ${display ? "text-2xl" : "text-3xl"} font-bold tracking-tight tabular-nums ${toneClass}`}>
        {value}
      </p>
      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1.5 font-semibold">{label}</p>
    </div>
  );
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    category: "janitorial",
    sku: "",
    location: "",
    onHand: "0",
    minQuantity: "0",
    unitCostCents: "",
    supplier: "",
    supplierSku: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const toCents = (v: string) => v ? Math.round(Number(v) * 100) : null;
      const body = {
        ...form,
        onHand: Number(form.onHand) || 0,
        minQuantity: Number(form.minQuantity) || 0,
        unitCostCents: toCents(form.unitCostCents),
      };
      const res = await fetch("/api/admin/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed");
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={save}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-navy font-bold text-lg font-heading">Add Inventory Item</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-navy">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Name *">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={ipt} placeholder="Toilet paper (12pk)" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={ipt}>
                {CATEGORIES.map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="SKU">
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={ipt} />
            </Field>
          </div>
          <Field label="Location">
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={ipt} placeholder="Storage room A, Front desk, etc." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="On Hand">
              <input type="number" value={form.onHand} onChange={(e) => setForm({ ...form, onHand: e.target.value })} className={ipt} />
            </Field>
            <Field label="Min Quantity (reorder alert)">
              <input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} className={ipt} />
            </Field>
          </div>
          <Field label="Unit Cost ($)">
            <input value={form.unitCostCents} onChange={(e) => setForm({ ...form, unitCostCents: e.target.value })} className={ipt} placeholder="2.99" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier">
              <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className={ipt} placeholder="Costco, Amazon, etc." />
            </Field>
            <Field label="Supplier SKU">
              <input value={form.supplierSku} onChange={(e) => setForm({ ...form, supplierSku: e.target.value })} className={ipt} />
            </Field>
          </div>
          {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-4 py-2.5 text-sm">{error}</div>}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 text-navy font-semibold text-sm py-2.5 rounded-xl border border-border hover:bg-off-white">Cancel</button>
          <button type="submit" disabled={busy} className="flex-1 bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl uppercase tracking-wider">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

const ipt = "w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
