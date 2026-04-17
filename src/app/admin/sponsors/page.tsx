import { Handshake, DollarSign, CheckCircle } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import NotionFallback from "@/components/dashboard/NotionFallback";
import { getAllSponsors, getProperty, isNotionConfigured } from "@/lib/notion";

export default async function SponsorsPage() {
  if (!isNotionConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy">Sponsorships</h1>
          <p className="text-text-secondary text-sm mt-1">Sponsorship Pipeline from Notion</p>
        </div>
        <NotionFallback type="no-key" entityName="sponsorships" />
      </div>
    );
  }

  const data = await getAllSponsors();

  if (data.length === 0) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy">Sponsorships</h1>
          <p className="text-text-secondary text-sm mt-1">Sponsorship Pipeline from Notion</p>
        </div>
        <NotionFallback type="empty" entityName="sponsors" />
      </div>
    );
  }

  const sponsors = data.map((s: any) => ({
    company: getProperty(s, "Company") || getProperty(s, "Name") || "—",
    contact: getProperty(s, "Contact") || getProperty(s, "Contact Name") || "—",
    status: getProperty(s, "Status") || "—",
    tier: getProperty(s, "Tier") || getProperty(s, "Level") || "—",
    amount: getProperty(s, "Amount") || getProperty(s, "Value") || 0,
    amountDisplay: (() => {
      const val = getProperty(s, "Amount") || getProperty(s, "Value");
      return val ? `$${Number(val).toLocaleString()}` : "—";
    })(),
    event: getProperty(s, "Event") || getProperty(s, "Events") || "—",
    startDate: (() => {
      const d = getProperty(s, "Start Date") || getProperty(s, "Date");
      return d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
    })(),
  }));

  const activeCount = sponsors.filter((s: any) => s.status === "Active").length;
  const totalValue = sponsors.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);

  const kpis = [
    { title: "Total Sponsors", value: sponsors.length.toString(), icon: Handshake },
    { title: "Active", value: activeCount.toString(), icon: CheckCircle },
    { title: "Total Value", value: `$${totalValue.toLocaleString()}`, icon: DollarSign },
  ];

  const columns = [
    { key: "company", label: "Company" },
    { key: "contact", label: "Contact" },
    {
      key: "status",
      label: "Status",
      render: (val: string) => <StatusBadge status={val} />,
    },
    { key: "tier", label: "Tier" },
    { key: "amountDisplay", label: "Amount" },
    { key: "event", label: "Event" },
    { key: "startDate", label: "Start Date" },
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy">Sponsorships</h1>
        <p className="text-text-secondary text-sm mt-1">Sponsorship Pipeline from Notion</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
        <DataTable columns={columns} data={sponsors} searchKey="company" searchPlaceholder="Search sponsors..." />
      </div>
    </div>
  );
}
