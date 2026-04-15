"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  sparklineData?: number[];
  valueColor?: string;
}

export default function KPICard({ title, value, icon: Icon, trend, trendUp, sparklineData, valueColor }: KPICardProps) {
  return (
    <div
      className="bg-white border border-light-gray shadow-sm rounded-sm p-3 lg:p-5 transition-colors hover:border-text-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red"
      role="article"
      aria-label={`${title}: ${value}`}
      tabIndex={0}
    >
      <div className="flex items-start justify-between mb-2 lg:mb-3">
        <p className="text-text-secondary text-[10px] lg:text-xs font-bold uppercase tracking-wider leading-tight">
          {title}
        </p>
        <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-text-secondary flex-shrink-0 ml-1" />
      </div>
      <p className={cn("text-xl lg:text-2xl font-bold", valueColor || "text-navy")}>{value}</p>
      {trend && (
        <p
          className={cn(
            "text-xs font-semibold mt-1",
            trendUp ? "text-success" : "text-danger"
          )}
        >
          {trend}
        </p>
      )}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2 -mx-1">
          <ResponsiveContainer width="100%" height={32}>
            <AreaChart data={sparklineData.map((v, i) => ({ v, i }))}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={trendUp !== false ? "#22C55E" : "#EF4444"}
                fill={trendUp !== false ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)"}
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
