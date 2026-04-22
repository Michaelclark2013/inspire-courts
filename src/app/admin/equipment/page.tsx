"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Package, Plus, AlertTriangle, Minus, RefreshCw } from "lucide-react";

type Item = {
  id: number;
  name: string;
  sku: string | null;
  category: string;
  location: string | null;
  onHand: number;
  minQuantity: number;
  unitCostCents: number | null;
  supplier: string | null;
  lastRestockedAt: string | null;
  active: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  sports: "Sports", av: "AV", safety: "Safety", janitorial: "Janitorial",
  concessions: "Concessions", office: "Office", other: "Other",
};

export default function EquipmentPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [belowOnly, setBelowOnly] = useState(false);
  const [category, setCategory] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (belowOnly) params.set("belowThreshold", "true");
      const res = await fetch(`/api/admin/equipment?${params}`);
      if (res.ok) setItems((await res.json()).data || []);
    } finally { setLoading(false); }
  }, [category, belowOnly]);
  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  async function movement(item: Item, delta: number, type: "restock" | "usage" | "adjustment") {
    await fetch("/api/admin/equipment/movement", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: item.id, type, delta }),
    });
    load();
  }

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  const belowThreshold = items.filter((i) => i.onHand <= i.minQuantity).length;

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Equipment Inventory
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {items.length} items · {belowThreshold > 0 ? (
              <span className="text-red font-semibold">{belowThreshold} need reorder</span>
            ) : (
              <span>all stock levels healthy</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-off-white border border-border rounded-md px-3 py-1.5 text-sm">
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
          </select>
          <label className="inline-flex items-center gap-1.5 text-sm text-navy">
            <input type="checkbox" checked={belowOnly} onChange={(e) => setBelowOnly(e.target.checked)} />
            Reorder only
          </label>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90">
            <Plus className="w-4 h-4" /> New Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Package className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No equipment items yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-off-white border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-3 py-3">Item</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3 text-center">On Hand</th>
                <th className="px-3 py-3 text-center">Min</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const low = item.onHand <= item.minQuantity;
                return (
                  <tr key={item.id} className={`border-b border-border last:border-0 ${low ? "bg-red/5" : "hover:bg-off-white/50"}`}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-navy">{item.name}</div>
                      <div className="text-xs text-text-secondary">
                        {item.sku && <>SKU {item.sku} · </>}
                        {item.supplier}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">{CATEGORY_LABELS[item.category]}</td>
                    <td className="px-3 py-2 text-xs text-text-secondary">{item.location || "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-mono font-semibold ${low ? "text-red" : "text-navy"}`}>
                        {item.onHand}
                      </span>
                      {low && <AlertTriangle className="inline w-3 h-3 text-red ml-1" />}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-text-secondary">{item.minQuantity}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => { const n = prompt("How many used?"); if (n) movement(item, -Math.abs(Number(n)), "usage"); }}
                          title="Record usage"
                          className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded px-2 py-1 inline-flex items-center gap-1">
                          <Minus className="w-3 h-3" /> Used
                        </button>
                        <button onClick={() => { const n = prompt("Restock qty"); if (n) movement(item, Math.abs(Number(n)), "restock"); }}
                          title="Restock"
                          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded px-2 py-1 inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Restock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <EquipmentModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }} />
      )}
    </div>
  );
}

function EquipmentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", sku: "", category: "sports", location: "", onHand: "0", minQuantity: "0", supplier: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/admin/equipment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku || null,
          category: form.category,
          location: form.location || null,
          onHand: Number(form.onHand) || 0,
          minQuantity: Number(form.minQuantity) || 0,
          supplier: form.supplier || null,
        }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-navy mb-4">New Equipment</h2>
        <div className="space-y-3 text-sm">
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">SKU</span>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">On Hand</span>
              <input type="number" value={form.onHand} onChange={(e) => setForm({ ...form, onHand: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Min Reorder</span>
              <input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block col-span-2"><span className="block text-xs text-text-secondary mb-1">Location</span>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Storage room A" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block col-span-2"><span className="block text-xs text-text-secondary mb-1">Supplier</span>
              <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          </div>
          {err && <div className="text-red text-xs">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-navy text-white rounded-md text-sm hover:bg-navy/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
