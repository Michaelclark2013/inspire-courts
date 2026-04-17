"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  searchKey?: string;
  searchPlaceholder?: string;
}

export default function DataTable({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
}: DataTableProps) {
  const [search, setSearch] = useState("");

  const filtered = searchKey
    ? data.filter((row) =>
        String(row[searchKey] || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : data;

  return (
    <div>
      {searchKey && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-bg border border-border rounded-sm pl-10 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/50"
          />
        </div>
      )}

      <div className="overflow-x-auto scroll-shadow-x rounded-xl border border-border min-h-[200px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-off-white border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3 sticky top-0 bg-off-white z-10 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-text-secondary align-middle"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-5 h-5 text-text-secondary/40" />
                    <span>No data found</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/50 hover:bg-off-white transition-colors ${i % 2 === 1 ? "bg-bg-secondary/30" : ""}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-navy">
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
