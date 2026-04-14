"use client";

import { useState, useMemo } from "react";
import { Search, Download } from "lucide-react";
import { AdminDonutChart, AdminBarChart, BRAND } from "@/components/dashboard/Charts";

function downloadTransactionsCSV(rows: Transaction[], filename: string) {
  const headers = ["Date", "Description", "Cash", "Card", "Square/Digital", "Total", "Notes"];
  const lines = [
    headers.join(","),
    ...rows.map((t) =>
      [t.date, t.description, t.cash, t.card, t.square, t.total, t.notes]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface Transaction {
  date: string;
  description: string;
  cash: number;
  card: number;
  square: number;
  total: number;
  notes: string;
}

interface Props {
  transactions: Transaction[];
  sourceData: { label: string; value: number }[];
  revenueOverTime: { label: string; value: number }[];
}

type TimeRange = "7d" | "30d" | "90d" | "all";

const TIME_RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All", value: "all" },
];

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export default function RevenueSheetClient({ transactions, sourceData, revenueOverTime }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "total" | "description">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const filtered = useMemo(() => {
    let list = transactions;
    if (timeRange !== "all") {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter((t) => {
        const d = parseDate(t.date);
        return d && d >= cutoff;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(q) || t.date.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortKey === "total") return sortDir === "desc" ? b.total - a.total : a.total - b.total;
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
    });
  }, [transactions, search, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">Revenue by Source</h3>
          <p className="text-text-secondary text-xs mb-4">Cash vs Card vs Square/Digital</p>
          {sourceData.length > 0 ? (
            <AdminDonutChart
              data={sourceData.map((d, i) => ({ ...d, color: [BRAND.red, BRAND.blue2, BRAND.green][i] || "#555" }))}
              height={220}
              valueFormatter={(v) => `$${v.toLocaleString()}`}
            />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">
              No source breakdown data available
            </div>
          )}
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">Revenue by Entry</h3>
          <p className="text-text-secondary text-xs mb-4">Total per day/event</p>
          {revenueOverTime.length > 0 ? (
            <AdminBarChart
              data={revenueOverTime.map((d) => ({ ...d, color: BRAND.red }))}
              height={220}
              valueFormatter={(v) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">
              Not enough dated entries for chart
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
          {/* Time range pills */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {TIME_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                  timeRange === opt.value
                    ? "bg-accent text-white"
                    : "bg-bg border border-border text-text-secondary hover:text-navy hover:border-accent/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full bg-bg border border-border rounded-sm pl-8 pr-3 py-2 text-sm text-navy placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
          </div>
          <p className="text-text-secondary text-xs flex-shrink-0">
            {filtered.length} of {transactions.length} entries
          </p>
          <button
            onClick={() => downloadTransactionsCSV(filtered, "revenue.csv")}
            title="Download CSV"
            className="flex items-center gap-1.5 bg-bg border border-border rounded-sm px-3 py-2 text-text-secondary hover:text-navy hover:border-accent/50 text-xs transition-colors flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-text-secondary text-sm">No transactions found.</p>
          ) : (
            <>
              {filtered.map((t, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-navy text-sm font-medium truncate">{t.description || "—"}</p>
                      <p className="text-text-secondary text-xs mt-0.5">{t.date}</p>
                    </div>
                    <span className="font-mono font-bold text-navy text-sm flex-shrink-0">
                      {t.total > 0 ? `$${t.total.toFixed(0)}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {t.cash > 0 && <span className="text-xs text-success font-mono">Cash ${t.cash.toFixed(0)}</span>}
                    {t.card > 0 && <span className="text-xs text-blue-400 font-mono">Card ${t.card.toFixed(0)}</span>}
                    {t.square > 0 && <span className="text-xs text-purple-400 font-mono">Square ${t.square.toFixed(0)}</span>}
                  </div>
                </div>
              ))}
              {/* Mobile totals */}
              <div className="px-4 py-3 bg-bg/30 border-t-2 border-border">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total ({filtered.length})</span>
                  <span className="font-mono font-bold text-navy">${filtered.reduce((s, t) => s + t.total, 0).toFixed(0)}</span>
                </div>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs text-success font-mono">Cash ${filtered.reduce((s, t) => s + t.cash, 0).toFixed(0)}</span>
                  <span className="text-xs text-blue-400 font-mono">Card ${filtered.reduce((s, t) => s + t.card, 0).toFixed(0)}</span>
                  <span className="text-xs text-purple-400 font-mono">Square ${filtered.reduce((s, t) => s + t.square, 0).toFixed(0)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {(["date", "description", "cash", "card", "square", "total"] as const).map((k) => (
                  <th
                    key={k}
                    onClick={() => (k === "date" || k === "total" || k === "description") && toggleSort(k as any)}
                    className={`px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider ${
                      k === "date" || k === "total" || k === "description" ? "cursor-pointer hover:text-navy transition-colors" : ""
                    }`}
                  >
                    {k === "square" ? "Square/Digital" : k.charAt(0).toUpperCase() + k.slice(1)}
                    {(k === "date" || k === "total" || k === "description") && sortKey === k && (
                      <span className="ml-1 text-accent">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">No transactions found.</td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <tr key={i} className="hover:bg-bg/40 transition-colors">
                    <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 text-navy max-w-[200px] truncate" title={t.description}>{t.description}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {t.cash > 0 ? <span className="text-success">${t.cash.toFixed(0)}</span> : <span className="text-text-secondary/30">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {t.card > 0 ? <span className="text-blue-400">${t.card.toFixed(0)}</span> : <span className="text-text-secondary/30">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {t.square > 0 ? <span className="text-purple-400">${t.square.toFixed(0)}</span> : <span className="text-text-secondary/30">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-navy">
                      {t.total > 0 ? `$${t.total.toFixed(0)}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-bg/30">
                  <td colSpan={2} className="px-4 py-3 text-text-secondary text-xs font-bold uppercase tracking-wider">Totals</td>
                  <td className="px-4 py-3 font-mono font-bold text-success">
                    ${filtered.reduce((s, t) => s + t.cash, 0).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-400">
                    ${filtered.reduce((s, t) => s + t.card, 0).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-purple-400">
                    ${filtered.reduce((s, t) => s + t.square, 0).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-navy text-base">
                    ${filtered.reduce((s, t) => s + t.total, 0).toFixed(0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
