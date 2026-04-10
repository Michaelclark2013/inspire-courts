import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Users,
  Trophy,
  DollarSign,
  UserCheck,
  Handshake,
  Flame,
} from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";

export default async function AdminOverview() {
  const session = await getServerSession(authOptions);
  // Auth temporarily disabled

  // Placeholder KPIs — will be replaced with live Notion data
  const kpis = [
    { title: "Teams in Pipeline", value: "—", icon: Users, trend: "Connect Notion to see live data" },
    { title: "Hot Leads", value: "—", icon: Flame },
    { title: "Upcoming Events", value: "—", icon: Trophy },
    { title: "Last Event Revenue", value: "—", icon: DollarSign },
    { title: "Active Sponsors", value: "—", icon: Handshake },
    { title: "Staff on Roster", value: "—", icon: UserCheck },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Dashboard
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Inspire Courts AZ Operations Overview
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Notion Connection Notice */}
      <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center">
        <Trophy className="w-10 h-10 text-accent mx-auto mb-4" />
        <h3 className="text-white font-bold text-lg uppercase tracking-tight mb-2">
          Connect Your Notion Databases
        </h3>
        <p className="text-text-secondary text-sm max-w-lg mx-auto mb-4">
          Add your <code className="text-accent">NOTION_API_KEY</code> to your
          environment variables to see live data from your Notion databases
          across all dashboard pages.
        </p>
        <p className="text-text-secondary text-xs">
          See <code className="text-accent">.env.example</code> for all required
          variables.
        </p>
      </div>
    </div>
  );
}
