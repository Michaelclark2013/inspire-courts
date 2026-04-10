import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";

export default async function RevenuePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const kpis = [
    { title: "Total In", value: "$20,800", icon: TrendingUp, trend: "+$6,400 this month", trendUp: true },
    { title: "Total Out", value: "$7,200", icon: TrendingDown },
    { title: "Net Revenue", value: "$13,600", icon: Wallet },
    { title: "Avg Per Event", value: "$6,933", icon: DollarSign },
  ];

  const transactions = [
    { date: "Apr 12, 2025", event: "Red Rock Invitational", category: "Registration", direction: "In", amount: "$14,400" },
    { date: "Apr 12, 2025", event: "Red Rock Invitational", category: "Admission", direction: "In", amount: "$3,200" },
    { date: "Apr 12, 2025", event: "Red Rock Invitational", category: "Refs", direction: "Out", amount: "$2,400" },
    { date: "Apr 12, 2025", event: "Red Rock Invitational", category: "Staff", direction: "Out", amount: "$1,200" },
    { date: "May 1, 2025", event: "OFF SZN Session 1", category: "Registration", direction: "In", amount: "$3,200" },
  ];

  const columns = [
    { key: "date", label: "Date" },
    { key: "event", label: "Event" },
    { key: "category", label: "Category" },
    {
      key: "direction",
      label: "Direction",
      render: (val: string) => (
        <span className={val === "In" ? "text-success" : "text-danger"}>
          {val === "In" ? "Money In" : "Money Out"}
        </span>
      ),
    },
    { key: "amount", label: "Amount" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Revenue
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Game Day Money Log from Notion
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="bg-bg-secondary border border-border rounded-sm p-5">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
          All Transactions
        </h3>
        <DataTable columns={columns} data={transactions} searchKey="event" searchPlaceholder="Search by event..." />
      </div>
    </div>
  );
}
