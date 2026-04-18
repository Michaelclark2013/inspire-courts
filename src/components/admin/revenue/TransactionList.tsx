"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, Download, ChevronUp, ChevronDown } from "lucide-react";
import type { Transaction, TimeRange } from "@/types/revenue";
import { TransactionRow } from "./TransactionRow";
import { formatCurrency } from "@/lib/utils";

const TIME_RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "All Time", value: "all" },
];

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "\u2014") return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function downloadTransactionsCSV(rows: Transaction[], filename: string) {
  const headers = [
    "Date",
    "Description",
    "Cash",
    "Card",
    "Square/Digital",
    "Total",
    "Notes",
  ];
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

type SortKey = "date" | "total" | "description";

interface Props {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input (area 18)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Memoized filtering + sorting (area 7)
  const filtered = useMemo(() => {
    let list = transactions;

    // Time range filter
    if (timeRange !== "all") {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter((t) => {
        const d = parseDate(t.date);
        return d && d >= cutoff;
      });
    }

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.date.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortKey === "total")
        return sortDir === "desc" ? b.total - a.total : a.total - b.total;
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
    });
  }, [transactions, debouncedSearch, sortKey, sortDir, timeRange]);

  // Memoized totals (area 7)
  const totals = useMemo(
    () => ({
      cash: filtered.reduce((s, t) => s + t.cash, 0),
      card: filtered.reduce((s, t) => s + t.card, 0),
      square: filtered.reduce((s, t) => s + t.square, 0),
      total: filtered.reduce((s, t) => s + t.total, 0),
    }),
    [filtered]
  );

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey]
  );

  const SortIcon = ({
    column,
  }: {
    column: SortKey;
  }) => {
    if (sortKey !== column) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline w-3 h-3 ml-0.5 text-red" aria-hidden="true" />
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-0.5 text-red" aria-hidden="true" />
    );
  };

  return (
    <div className="bg-white border border-light-gray shadow-sm rounded-sm overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-light-gray flex flex-wrap items-center gap-3">
        {/* Time range pills (area 12) */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          role="group"
          aria-label="Time range filter"
        >
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimeRange(opt.value)}
              aria-pressed={timeRange === opt.value}
              className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1 ${
                timeRange === opt.value
                  ? "bg-red text-white"
                  : "bg-off-white border border-border text-text-secondary hover:text-navy hover:border-red/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search (area 18 - debounced) */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            aria-label="Search transactions"
            className="w-full bg-off-white border border-border rounded-sm pl-8 pr-3 py-2 text-sm text-navy placeholder:text-text-secondary focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1 min-h-[44px] sm:min-h-0"
          />
        </div>

        <p className="text-text-secondary text-xs flex-shrink-0" aria-live="polite">
          {filtered.length} of {transactions.length} entries
        </p>

        {/* CSV export (area 17) */}
        <button
          type="button"
          onClick={() => downloadTransactionsCSV(filtered, "revenue.csv")}
          title="Download CSV"
          className="flex items-center gap-1.5 bg-off-white border border-border rounded-sm px-3 py-2 text-text-secondary hover:text-navy hover:border-red/50 text-xs transition-colors flex-shrink-0 min-h-[44px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> CSV
        </button>
      </div>

      {/* Mobile card view (area 20) */}
      <div className="sm:hidden divide-y divide-light-gray">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-text-secondary text-sm">
            No transactions found.
          </p>
        ) : (
          <>
            {filtered.map((t, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-navy text-sm font-medium truncate">
                      {t.description || "\u2014"}
                    </p>
                    <p className="text-text-secondary text-xs mt-0.5">
                      {t.date}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-navy text-sm flex-shrink-0">
                    {t.total > 0 ? formatCurrency(t.total) : "\u2014"}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {t.cash > 0 && (
                    <span className="text-xs text-emerald-700 font-mono">
                      Cash {formatCurrency(t.cash)}
                    </span>
                  )}
                  {t.card > 0 && (
                    <span className="text-xs text-blue-700 font-mono">
                      Card {formatCurrency(t.card)}
                    </span>
                  )}
                  {t.square > 0 && (
                    <span className="text-xs text-purple-700 font-mono">
                      Square {formatCurrency(t.square)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {/* Mobile totals */}
            <div className="px-4 py-3 bg-off-white border-t-2 border-light-gray">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                  Total ({filtered.length})
                </span>
                <span className="font-mono font-bold text-navy">
                  {formatCurrency(totals.total)}
                </span>
              </div>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-emerald-700 font-mono">
                  Cash {formatCurrency(totals.cash)}
                </span>
                <span className="text-xs text-blue-700 font-mono">
                  Card {formatCurrency(totals.card)}
                </span>
                <span className="text-xs text-purple-700 font-mono">
                  Square {formatCurrency(totals.square)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop table view (area 13 - proper table semantics, area 20 - scrollable) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <caption className="sr-only">Transaction history</caption>
          <thead>
            <tr className="border-b border-light-gray">
              {(
                [
                  { key: "date", label: "Date", sortable: true },
                  { key: "description", label: "Description", sortable: true },
                  { key: "cash", label: "Cash", sortable: false },
                  { key: "card", label: "Card", sortable: false },
                  { key: "square", label: "Square/Digital", sortable: false },
                  { key: "total", label: "Total", sortable: true },
                ] as const
              ).map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  onClick={() =>
                    col.sortable && toggleSort(col.key as SortKey)
                  }
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={`px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider ${
                    col.sortable
                      ? "cursor-pointer hover:text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1"
                      : ""
                  }`}
                  tabIndex={col.sortable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (
                      col.sortable &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      toggleSort(col.key as SortKey);
                    }
                  }}
                >
                  {col.label}
                  {col.sortable && <SortIcon column={col.key as SortKey} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-light-gray">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-text-secondary"
                >
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => (
                <TransactionRow key={i} transaction={t} />
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-light-gray bg-off-white">
                <td
                  colSpan={2}
                  className="px-4 py-3 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Totals
                </td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                  {formatCurrency(totals.cash)}
                </td>
                <td className="px-4 py-3 font-mono font-bold text-blue-700">
                  {formatCurrency(totals.card)}
                </td>
                <td className="px-4 py-3 font-mono font-bold text-purple-700">
                  {formatCurrency(totals.square)}
                </td>
                <td className="px-4 py-3 font-mono font-bold text-navy text-base">
                  {formatCurrency(totals.total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
