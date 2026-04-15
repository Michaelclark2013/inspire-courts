"use client";

import { memo } from "react";
import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import type { AdminLeadCounts } from "@/types/admin-dashboard";

function LeadsSummary({ counts }: { counts: AdminLeadCounts }) {
  if (counts.total === 0) return null;

  return (
    <section
      className="bg-white border border-light-gray shadow-sm rounded-sm overflow-hidden"
      aria-labelledby="leads-summary-heading"
    >
      <div className="px-5 py-3 border-b border-light-gray flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <h3
            id="leads-summary-heading"
            className="text-navy font-bold text-xs uppercase tracking-wider"
          >
            Leads Pipeline
          </h3>
        </div>
        <Link
          href="/admin/leads"
          prefetch
          className="flex items-center gap-1 text-text-secondary hover:text-navy text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded"
        >
          View All <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-6 mb-3">
          <Link
            href="/admin/leads?status=hot"
            prefetch
            className="text-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded"
          >
            <span className="block text-2xl font-bold text-red tabular-nums group-hover:scale-110 transition-transform">
              {counts.hot}
            </span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Hot
            </span>
          </Link>
          <Link
            href="/admin/leads?status=warm"
            prefetch
            className="text-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded"
          >
            <span className="block text-2xl font-bold text-amber-500 tabular-nums group-hover:scale-110 transition-transform">
              {counts.warm}
            </span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Warm
            </span>
          </Link>
          <Link
            href="/admin/leads?status=cold"
            prefetch
            className="text-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded"
          >
            <span className="block text-2xl font-bold text-blue-500 tabular-nums group-hover:scale-110 transition-transform">
              {counts.cold}
            </span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Cold
            </span>
          </Link>
          <div className="ml-auto text-right">
            <span className="block text-2xl font-bold text-navy tabular-nums">
              {counts.total}
            </span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Total
            </span>
          </div>
        </div>
        <div
          className="flex h-2 rounded-full overflow-hidden bg-light-gray"
          role="progressbar"
          aria-label="Leads pipeline breakdown"
          aria-valuemin={0}
          aria-valuemax={counts.total}
          aria-valuenow={counts.total}
        >
          {counts.hot > 0 && (
            <div
              className="bg-red transition-all"
              style={{ width: `${(counts.hot / counts.total) * 100}%` }}
            />
          )}
          {counts.warm > 0 && (
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${(counts.warm / counts.total) * 100}%` }}
            />
          )}
          {counts.cold > 0 && (
            <div
              className="bg-blue-500 transition-all"
              style={{ width: `${(counts.cold / counts.total) * 100}%` }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(LeadsSummary);
