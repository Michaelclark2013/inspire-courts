"use client";

import type { RevenueSourceData, RevenueOverTimeEntry } from "@/types/revenue";
import {
  AdminDonutChart,
  AdminBarChart,
  BRAND,
} from "@/components/dashboard/Charts";

interface Props {
  sourceData: RevenueSourceData[];
  revenueOverTime: RevenueOverTimeEntry[];
}

export function RevenueCharts({ sourceData, revenueOverTime }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-light-gray shadow-sm rounded-sm p-5">
        <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">
          Revenue by Source
        </h3>
        <p className="text-text-secondary text-xs mb-4">
          Cash vs Card vs Square/Digital
        </p>
        {sourceData.length > 0 ? (
          <AdminDonutChart
            data={sourceData.map((d, i) => ({
              ...d,
              color: [BRAND.red, BRAND.blue2, BRAND.green][i] || "#555",
            }))}
            height={220}
            valueFormatter={(v: number) => `$${v.toLocaleString()}`}
          />
        ) : (
          <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">
            No source breakdown data available
          </div>
        )}
      </div>
      <div className="bg-white border border-light-gray shadow-sm rounded-sm p-5">
        <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">
          Revenue by Entry
        </h3>
        <p className="text-text-secondary text-xs mb-4">
          Total per day/event
        </p>
        {revenueOverTime.length > 0 ? (
          <AdminBarChart
            data={revenueOverTime.map((d) => ({ ...d, color: BRAND.red }))}
            height={220}
            valueFormatter={(v: number) =>
              `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
            }
          />
        ) : (
          <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">
            Not enough dated entries for chart
          </div>
        )}
      </div>
    </div>
  );
}
