export const revalidate = 300;

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sponsors | Inspire Courts AZ" };

import KPICard from "@/components/dashboard/KPICard";
import SponsorsTable, { type Sponsor } from "@/components/admin/SponsorsTable";
import NotionFallback from "@/components/dashboard/NotionFallback";
import { getAllSponsors, getProperty, isNotionConfigured } from "@/lib/notion";
import { formatCurrency } from "@/lib/utils";

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

  const sponsors: Sponsor[] = data.map((s: Record<string, unknown>) => ({
    company: getProperty(s, "Company") || getProperty(s, "Name") || "—",
    contact: getProperty(s, "Contact") || getProperty(s, "Contact Name") || "—",
    status: getProperty(s, "Status") || "—",
    tier: getProperty(s, "Tier") || getProperty(s, "Level") || "—",
    amount: getProperty(s, "Amount") || getProperty(s, "Value") || 0,
    amountDisplay: (() => {
      const val = getProperty(s, "Amount") || getProperty(s, "Value");
      return val ? formatCurrency(Number(val)) : "—";
    })(),
    event: getProperty(s, "Event") || getProperty(s, "Events") || "—",
    startDate: (() => {
      const d = getProperty(s, "Start Date") || getProperty(s, "Date");
      return d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
    })(),
  }));

  const activeCount = sponsors.filter((s) => s.status === "Active").length;
  const totalValue = sponsors.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  // iconName (not icon) — lucide function refs can't cross the RSC
  // boundary into KPICard ("use client").
  const kpis = [
    { title: "Total Sponsors", value: sponsors.length.toLocaleString(), iconName: "handshake" as const },
    { title: "Active", value: activeCount.toLocaleString(), iconName: "check-circle" as const },
    { title: "Total Value", value: `$${totalValue.toLocaleString()}`, iconName: "dollar" as const },
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
        <SponsorsTable sponsors={sponsors} />
      </div>
    </div>
  );
}
