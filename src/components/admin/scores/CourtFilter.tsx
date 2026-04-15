"use client";

import { memo } from "react";

function CourtFilterImpl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  if (options.length === 0) return null;
  return (
    <select
      value={value}
      aria-label="Filter by court"
      onChange={(e) => onChange(e.target.value)}
      className="bg-off-white border border-border rounded-lg px-3 py-2.5 text-navy text-xs focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus:border-red cursor-pointer"
    >
      <option value="">All Courts</option>
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

export const CourtFilter = memo(CourtFilterImpl);
