"use client";

import { memo, forwardRef } from "react";
import { Search, Users } from "lucide-react";
import type { FilterStatus } from "@/types/checkin";

type Props = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterStatus: FilterStatus;
  onFilterChange: (v: FilterStatus) => void;
  divisionFilter: string;
  onDivisionChange: (v: string) => void;
  divisions: string[];
  onClear: () => void;
};

const CheckInFilters = memo(
  forwardRef<HTMLInputElement, Props>(function CheckInFilters(
    {
      searchQuery,
      onSearchChange,
      filterStatus,
      onFilterChange,
      divisionFilter,
      onDivisionChange,
      divisions,
      onClear,
    },
    ref
  ) {
    return (
      <div className="px-4 sm:px-5 py-4 border-b border-light-gray flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Users className="w-4 h-4 text-red" aria-hidden="true" />
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
            Team Status
          </h2>
        </div>
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy/30 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={ref}
              type="search"
              placeholder="Search players, teams, coaches..."
              aria-label="Search players, teams, or coaches"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-off-white border border-border rounded-lg pl-9 pr-3 py-2.5 text-navy text-xs focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red/40 transition-all placeholder:text-text-muted/60 min-h-[44px] sm:min-h-0"
            />
          </div>
          <select
            value={filterStatus}
            aria-label="Filter by check-in status"
            onChange={(e) => onFilterChange(e.target.value as FilterStatus)}
            className="bg-off-white border border-border rounded-lg px-3 py-2.5 text-navy text-xs cursor-pointer focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red/40 min-h-[44px] sm:min-h-0"
          >
            <option value="all">All</option>
            <option value="checked">Checked In</option>
            <option value="not">Not Checked In</option>
          </select>
          <select
            value={divisionFilter}
            aria-label="Filter by division"
            onChange={(e) => onDivisionChange(e.target.value)}
            className="bg-off-white border border-border rounded-lg px-3 py-2.5 text-navy text-xs cursor-pointer focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red/40 min-h-[44px] sm:min-h-0"
          >
            <option value="">All Divisions</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {(searchQuery ||
            filterStatus !== "all" ||
            divisionFilter) && (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] text-red hover:text-red-hover font-semibold uppercase tracking-wider px-2 py-2 focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
              aria-label="Clear all filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  })
);

export default CheckInFilters;
