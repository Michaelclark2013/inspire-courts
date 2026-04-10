import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function KPICard({ title, value, icon: Icon, trend, trendUp }: KPICardProps) {
  return (
    <div className="bg-bg-secondary border border-border rounded-sm p-5">
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
    </div>
  );
}
