"use client";

import { memo } from "react";
import {
  ClipboardList,
  AlertTriangle,
  DollarSign,
  Radio,
} from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import type { AdminRegistrationStats } from "@/types/admin-dashboard";

function RegistrationKPIs({
  stats,
  liveGames,
}: {
  stats: AdminRegistrationStats;
  liveGames: number;
}) {
  const revenue = stats.paidRevenueCents / 100;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <KPICard
        title="Registrations"
        value={stats.total.toString()}
        icon={ClipboardList}
        trend={`${stats.approvalRate}% approved`}
        trendUp={stats.approvalRate > 50}
      />
      <KPICard
        title="Pending Payments"
        value={stats.pendingPayments.toString()}
        icon={AlertTriangle}
        trend={stats.pendingPayments > 0 ? "Action needed" : "All clear"}
        trendUp={stats.pendingPayments === 0}
        valueColor={stats.pendingPayments > 0 ? "text-danger" : undefined}
      />
      <KPICard
        title="Registration Revenue"
        value={`$${revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        icon={DollarSign}
        trend="From paid registrations"
        trendUp={true}
      />
      <KPICard
        title="Live Games"
        value={liveGames.toString()}
        icon={Radio}
        trend={liveGames > 0 ? "In progress now" : "None active"}
        trendUp={liveGames > 0}
      />
    </div>
  );
}

export default memo(RegistrationKPIs);
