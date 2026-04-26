"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Receipt,
  ArrowUpRight,
  Filter,
  Download,
} from "lucide-react";
import { exportCSV } from "@/lib/export";
import { SkeletonRows } from "@/components/ui/SkeletonCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Expense = {
  id: number;
  description: string;
  category: string;
  amountCents: number;
  vendor: string | null;
  paymentMethod: string | null;
  incurredAt: string;
  receiptUrl: string | null;
  taxDeductible: boolean;
  notes: string | null;
};

type CategoryAgg = { category: string; totalCents: number; count: number };
type Data = { rows: Expense[]; byCategory: CategoryAgg[]; totalCents: number };

const CATEGORIES = [
  "rent", "utilities", "payroll", "marketing", "supplies",
  "maintenance", "insurance", "vehicle", "equipment", "software",
  "professional", "taxes", "other",
];

const CAT_STYLES: Record<string, string> = {
  rent: "bg-red/10 text-red",
  utilities: "bg-blue-50 text-blue-700",
  payroll: "bg-purple-50 text-purple-700",
  marketing: "bg-pink-50 text-pink-700",
  supplies: "bg-amber-50 text-amber-700",
  maintenance: "bg-amber-50 text-amber-700",
  insurance: "bg-emerald-50 text-emerald-700",
  vehicle: "bg-cyan-50 text-cyan-700",
  equipment: "bg-cyan-50 text-cyan-700",
  software: "bg-blue-50 text-blue-700",
  professional: "bg-navy/5 text-navy",
  taxes: "bg-red/10 text-red",
  other: "bg-off-white text-text-muted",
};

function dollars(c: number): string {
  return `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

export default function ExpensesPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [composerOpen, setComposerOpen] = useState(false);

  useDocumentTitle(
    data ? `Expenses (${data.rows.length})` : "Expenses"
  );

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      const res = await fetch(`/api/admin/expenses?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  async function remove(e: Expense) {
    if (!confirm(`Delete "${e.description}"?`)) return;
    await fetch(`/api/admin/expenses?id=${e.id}`, { method: "DELETE" });
    load();
  }

  function exportCsv() {
    if (!data) return;
    const header = ["Date", "Description", "Category", "Vendor", "Payment", "Amount", "Deductible", "Receipt URL", "Notes"];
    const rows = data.rows.map((r) => [
      r.incurredAt.slice(0, 10),
      r.description,
      r.category,
      r.vendor || "",
      r.paymentMethod || "",
      (r.amountCents / 100).toFixed(2),
      r.taxDeductible ? "yes" : "no",
      r.receiptUrl || "",
      r.notes || "",
    ]);
    exportCSV(`expenses-${new Date().toISOString().slice(0, 10)}`, header, rows);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Finance</p>
              <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
                <Receipt className="w-8 h-8 text-red" />
                Expenses
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-xl">
                Running costs tracked against revenue so the dashboard shows real P&L.
              </p>
            </div>
            <div className="flex gap-2 self-start">
              <button
                onClick={exportCsv}
                className="bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={() => setComposerOpen(true)}
                className="bg-red hover:bg-red-hover rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red/30"
              >
                <Plus className="w-3.5 h-3.5" /> Log Expense
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeroStat label="Total" value={dollars(data?.totalCents ?? 0)} display />
            <HeroStat label="Entries" value={String(data?.rows.length ?? 0)} />
            <HeroStat label="Categories" value={String(data?.byCategory.length ?? 0)} />
            <Link
              href="/admin/revenue"
              className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl px-4 py-4 border border-white/10 flex items-center justify-between"
            >
              <div>
                <p className="font-heading text-xl font-bold">Revenue</p>
                <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1 font-semibold">Compare</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/70" />
            </Link>
          </div>
        </div>
      </section>

      {/* Category rollup */}
      {data && data.byCategory.length > 0 && (
        <div className="bg-white border border-border rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">By Category</h2>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.byCategory
              .sort((a, b) => b.totalCents - a.totalCents)
              .map((c) => (
                <div key={c.category} className="bg-off-white rounded-xl p-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${CAT_STYLES[c.category] || "bg-off-white text-text-muted"}`}>
                    {c.category}
                  </span>
                  <p className="text-navy font-heading text-xl font-bold tabular-nums mt-2">{dollars(c.totalCents)}</p>
                  <p className="text-text-muted text-[11px]">{c.count} entry{c.count === 1 ? "" : "s"}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
        <Filter className="w-4 h-4 text-text-muted flex-shrink-0" />
        <button
          onClick={() => setCategory("all")}
          className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap ${
            category === "all" ? "bg-navy text-white" : "bg-off-white text-text-muted hover:bg-border"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap ${
              category === c ? "bg-navy text-white" : "bg-off-white text-text-muted hover:bg-border"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <SkeletonRows count={6} />
      ) : !data || data.rows.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <Receipt className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-navy font-bold mb-1">No expenses logged yet</p>
          <button
            onClick={() => setComposerOpen(true)}
            className="mt-3 inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> Log first expense
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-border">
            {data.rows.map((e) => (
              <li key={e.id} className="px-5 py-3 flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${CAT_STYLES[e.category] || "bg-off-white text-text-muted"} flex-shrink-0`}>
                  {e.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-semibold text-sm truncate">{e.description}</p>
                  <p className="text-text-muted text-xs truncate">
                    {fmtDate(e.incurredAt)}
                    {e.vendor ? ` · ${e.vendor}` : ""}
                    {e.paymentMethod ? ` · ${e.paymentMethod}` : ""}
                    {!e.taxDeductible && " · non-deductible"}
                  </p>
                </div>
                {e.receiptUrl && (
                  <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-red text-xs font-semibold hover:underline flex-shrink-0">
                    Receipt
                  </a>
                )}
                <p className="text-navy font-bold font-heading text-lg tabular-nums flex-shrink-0">{dollars(e.amountCents)}</p>
                <button
                  onClick={() => remove(e)}
                  aria-label="Delete"
                  className="p-2 rounded-lg text-text-muted hover:bg-red/5 hover:text-red flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {composerOpen && <Composer onClose={() => { setComposerOpen(false); load(); }} />}
    </div>
  );
}

function HeroStat({ label, value, display }: { label: string; value: string; display?: boolean }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4 border border-white/10">
      <p className={`font-heading ${display ? "text-2xl" : "text-3xl"} font-bold tabular-nums tracking-tight text-white`}>{value}</p>
      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1.5 font-semibold">{label}</p>
    </div>
  );
}

function Composer({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({
    description: "", category: "supplies", amount: "", vendor: "",
    paymentMethod: "card", incurredAt: new Date().toISOString().slice(0, 10),
    receiptUrl: "", notes: "", taxDeductible: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const amountCents = Math.round(Number(f.amount.replace(/[$,]/g, "")) * 100);
      if (!Number.isFinite(amountCents) || amountCents <= 0) throw new Error("Amount required");
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: f.description,
          category: f.category,
          amountCents,
          vendor: f.vendor,
          paymentMethod: f.paymentMethod,
          incurredAt: new Date(f.incurredAt + "T12:00:00").toISOString(),
          receiptUrl: f.receiptUrl,
          notes: f.notes,
          taxDeductible: f.taxDeductible,
        }),
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
      <form onSubmit={save} className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-navy font-bold text-lg font-heading">Log Expense</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-navy p-1">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Description *</label>
            <input required value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={ipt} placeholder="Costco supplies run" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Amount *</label>
              <input required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={ipt} placeholder="245.67" />
            </div>
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Date</label>
              <input type="date" value={f.incurredAt} onChange={(e) => setF({ ...f, incurredAt: e.target.value })} className={ipt} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Category</label>
              <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={ipt}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Method</label>
              <select value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })} className={ipt}>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="ach">ACH</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Vendor</label>
            <input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} className={ipt} placeholder="Costco" />
          </div>
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Receipt URL</label>
            <input value={f.receiptUrl} onChange={(e) => setF({ ...f, receiptUrl: e.target.value })} className={ipt} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} className={`${ipt} resize-none`} />
          </div>
          <label className="flex items-center gap-2 bg-off-white border border-border rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={f.taxDeductible} onChange={(e) => setF({ ...f, taxDeductible: e.target.checked })} className="w-4 h-4" />
            <span className="text-navy text-sm font-semibold">Tax-deductible</span>
          </label>
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
