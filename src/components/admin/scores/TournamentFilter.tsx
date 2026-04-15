"use client";

import { memo } from "react";
import type { TournamentOption } from "@/types/score-entry";

function TournamentFilterImpl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: TournamentOption[];
}) {
  if (options.length === 0) return null;
  return (
    <select
      value={value}
      aria-label="Filter by tournament"
      onChange={(e) => onChange(e.target.value)}
      className="bg-off-white border border-border rounded-lg px-3 py-2.5 text-navy text-xs focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus:border-red cursor-pointer"
    >
      <option value="">All Games</option>
      {options.map((t) => (
        <option key={t.id} value={t.name}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

export const TournamentFilter = memo(TournamentFilterImpl);
