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
}

export default function KPICard({ title, value, icon: Icon, trend, trendUp, sparklineData }: KPICardProps) {
  return (
    <div
      className="bg-bg-secondary border border-border rounded-sm p-5 transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50"
      role="article"
      aria-label={`${title}: ${value}`}
      tabIndex={0}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
          {title}
        </p>
        <Icon className="w-4 h-4 text-text-secondary" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
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
