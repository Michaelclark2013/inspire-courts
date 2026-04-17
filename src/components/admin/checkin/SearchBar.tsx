"use client";

import { Search } from "lucide-react";
import type { FilterStatus } from "@/types/checkin";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterStatus: FilterStatus;
  onFilterChange: (v: FilterStatus) => void;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
}: SearchBarProps) {
  return (
    <div
      className="flex flex-1 items-center gap-2 w-full sm:w-auto"
      role="search"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy/30" />
        <input
          type="text"
          placeholder="Search teams..."
          aria-label="Search teams"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-off-white border border-border rounded-lg pl-9 pr-3 py-2.5 min-h-[44px] text-navy text-sm focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none transition-all placeholder:text-text-muted/50"
        />
      </div>
      <select
        value={filterStatus}
        aria-label="Filter by check-in status"
        onChange={(e) => onFilterChange(e.target.value as FilterStatus)}
        className="bg-off-white border border-border rounded-lg px-3 py-2.5 min-h-[44px] text-navy text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
      >
        <option value="all">All</option>
        <option value="checked">Checked In</option>
        <option value="not">Not Checked In</option>
      </select>
    </div>
  );
}
