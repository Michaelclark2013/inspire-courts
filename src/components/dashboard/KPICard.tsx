"use client";

import {
  type LucideIcon,
  Users,
  DollarSign,
  UserCheck,
  ClipboardList,
  Handshake,
  CheckCircle,
  GraduationCap,
  Trophy,
  Activity,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "@/components/ui/CountUp";

// Server components can't pass a LucideIcon function reference across
// the RSC boundary ("Functions cannot be passed directly to Client
// Components"). Instead they pass `iconName` and we resolve it here.
// Client callers can keep passing `icon` directly — both supported.
const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  dollar: DollarSign,
  "user-check": UserCheck,
  "clipboard-list": ClipboardList,
  handshake: Handshake,
  "check-circle": CheckCircle,
  "graduation-cap": GraduationCap,
  trophy: Trophy,
  activity: Activity,
  calendar: Calendar,
  "trending-up": TrendingUp,
};

export type KPIIconName = keyof typeof ICON_MAP;

type KPICardProps = {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  valueColor?: string;
} & (
  | { icon: LucideIcon; iconName?: never }
  | { iconName: KPIIconName | string; icon?: never }
);

export default function KPICard({ title, value, icon, iconName, trend, trendUp, valueColor }: KPICardProps) {
  const Icon: LucideIcon = icon ?? ICON_MAP[iconName ?? ""] ?? Activity;
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
