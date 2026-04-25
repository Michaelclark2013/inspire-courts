"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "@/components/ui/CountUp";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  valueColor?: string;
}

export default function KPICard({ title, value, icon: Icon, trend, trendUp, valueColor }: KPICardProps) {
  return (
    <div
      className="bg-white border border-light-gray shadow-sm rounded-xl p-3 lg:p-5 transition-all duration-200 hover:border-text-secondary/30 hover:shadow-md"
      role="group"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start justify-between mb-2 lg:mb-3">
        <p className="text-text-secondary text-[10px] lg:text-xs font-bold uppercase tracking-wider leading-tight">
          {title}
        </p>
        <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-text-secondary flex-shrink-0 ml-1" />
      </div>
      <p className={cn("text-xl lg:text-2xl font-bold", valueColor || "text-navy")}>
        {typeof value === "number" ? (
          <CountUp end={value} />
        ) : /^\$[\d,]+$/.test(String(value)) ? (
          <CountUp end={parseInt(String(value).replace(/[$,]/g, ""), 10)} prefix="$" />
        ) : (
          value
        )}
      </p>
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
    </div>
  );
}
