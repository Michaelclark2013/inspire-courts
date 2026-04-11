import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";
import NotionFallback from "@/components/dashboard/NotionFallback";
import { getMoneyLog, getProperty, isNotionConfigured } from "@/lib/notion";

export default async function RevenuePage() {
  if (!isNotionConfigured()) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Revenue</h1>
          <p className="text-text-secondary text-sm mt-1">Game Day Money Log from Notion</p>
        </div>
        <NotionFallback type="no-key" entityName="revenue" />
      </div>
    );
  }

  const entries = await getMoneyLog();

  if (entries.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Revenue</h1>
          <p className="text-text-secondary text-sm mt-1">Game Day Money Log from Notion</p>
        </div>
        <NotionFallback type="empty" entityName="transactions" />
      </div>
    );
  }

  // Map Notion entries to table rows
  const transactions = entries.map((entry: any) => {
    const amount = Number(getProperty(entry, "Amount")) || 0;
    const direction = getProperty(entry, "Direction") || getProperty(entry, "Type") || "—";
    const event = getProperty(entry, "Event") || getProperty(entry, "Event Name") || "—";
    const category = getProperty(entry, "Category") || "—";
    const date = getProperty(entry, "Date") || entry.created_time || "—";

    return {
      date: date !== "—" ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
      event,
      category,
      direction: direction === "In" || direction === "Money In" || direction === "Revenue" ? "In" : "Out",
      amount,
      amountDisplay: `$${Math.abs(amount).toLocaleString()}`,
    };
  });

  // Compute KPIs
  const totalIn = transactions.filter((t: any) => t.direction === "In").reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalOut = transactions.filter((t: any) => t.direction === "Out").reduce((sum: number, t: any) => sum + t.amount, 0);
  const net = totalIn - totalOut;
  const uniqueEvents = new Set(transactions.map((t: any) => t.event).filter((e: string) => e !== "—"));
  const avgPerEvent = uniqueEvents.size > 0 ? Math.round(net / uniqueEvents.size) : 0;

  const kpis = [
    { title: "Total In", value: `$${totalIn.toLocaleString()}`, icon: TrendingUp, trend: `${transactions.filter((t: any) => t.direction === "In").length} transactions`, trendUp: true },
    { title: "Total Out", value: `$${totalOut.toLocaleString()}`, icon: TrendingDown },
    { title: "Net Revenue", value: `$${net.toLocaleString()}`, icon: Wallet },
    { title: "Avg Per Event", value: `$${avgPerEvent.toLocaleString()}`, icon: DollarSign },
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
    { key: "amountDisplay", label: "Amount" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Revenue</h1>
        <p className="text-text-secondary text-sm mt-1">Game Day Money Log from Notion</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="bg-bg-secondary border border-border rounded-sm p-5">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">All Transactions</h3>
        <DataTable columns={columns} data={transactions} searchKey="event" searchPlaceholder="Search by event..." />
      </div>
    </div>
  );
}
