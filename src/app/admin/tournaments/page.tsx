import NotionFallback from "@/components/dashboard/NotionFallback";
import TournamentsClient from "@/components/admin/TournamentsClient";
import { getAllTournaments, getProperty, isNotionConfigured } from "@/lib/notion";

export const revalidate = 300;

export default async function TournamentsPage() {
  if (!isNotionConfigured()) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Tournaments</h1>
          <p className="text-text-secondary text-sm mt-1">Tournament Tracker — manage events and registration</p>
        </div>
        <NotionFallback type="no-key" entityName="tournaments" />
      </div>
    );
  }

  const data = await getAllTournaments();

  const tournaments = data.map((t: any) => {
    const fee = getProperty(t, "Registration Fee") || getProperty(t, "Fee") || getProperty(t, "Entry Fee") || 0;
    const revenue = getProperty(t, "Revenue") || getProperty(t, "Total Revenue") || 0;
    const teams = getProperty(t, "Teams Registered") || getProperty(t, "Teams") || getProperty(t, "Team Count") || 0;
    const divisions = getProperty(t, "Divisions") || getProperty(t, "Age Groups") || "";
    const date = getProperty(t, "Date") || getProperty(t, "Event Date") || "";
    const rawStatus = getProperty(t, "Status") || "—";
    const status = rawStatus === "Complete" ? "Completed" : rawStatus;

    return {
      name: getProperty(t, "Name") || getProperty(t, "Event Name") || "—",
      date: date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
      rawDate: date || "",
      divisions: Array.isArray(divisions) ? divisions.join(", ") : (divisions || "—"),
      status,
      teams: Number(teams) || 0,
      fee: fee ? `$${Number(fee).toLocaleString()}` : "—",
      rawFee: Number(fee) || 0,
      revenue: revenue ? `$${Number(revenue).toLocaleString()}` : "$0",
      rawRevenue: Number(revenue) || 0,
      description: getProperty(t, "Description") || getProperty(t, "Notes") || "",
      location: getProperty(t, "Location") || getProperty(t, "Venue") || "",
      organizer: getProperty(t, "Organizer") || getProperty(t, "Contact") || "",
    };
  });

  if (tournaments.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Tournaments</h1>
          <p className="text-text-secondary text-sm mt-1">Tournament Tracker — manage events and registration</p>
        </div>
        <NotionFallback type="empty" entityName="tournaments" />
      </div>
    );
  }

  // Compute chart data
  const statusCounts: Record<string, number> = {};
  tournaments.forEach((t: { status: string; rawRevenue: number; name: string }) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  const revenueData = tournaments
    .filter((t: { rawRevenue: number }) => t.rawRevenue > 0)
    .sort((a: { rawRevenue: number }, b: { rawRevenue: number }) => b.rawRevenue - a.rawRevenue)
    .slice(0, 8)
    .map((t: { name: string; rawRevenue: number }) => ({ label: t.name, value: t.rawRevenue }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Tournaments</h1>
        <p className="text-text-secondary text-sm mt-1">Tournament Tracker — manage events and registration</p>
      </div>
      <TournamentsClient
        tournaments={tournaments}
        statusData={statusData}
        revenueData={revenueData}
      />
    </div>
  );
}
