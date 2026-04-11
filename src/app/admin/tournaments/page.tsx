import NotionFallback from "@/components/dashboard/NotionFallback";
import TournamentsClient from "@/components/admin/TournamentsClient";
import { getAllTournaments, getProperty, isNotionConfigured } from "@/lib/notion";

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

    return {
      name: getProperty(t, "Name") || getProperty(t, "Event Name") || "—",
      date: date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
      divisions: Array.isArray(divisions) ? divisions.join(", ") : (divisions || "—"),
      status: getProperty(t, "Status") || "—",
      teams: Number(teams) || 0,
      fee: fee ? `$${Number(fee).toLocaleString()}` : "—",
      revenue: revenue ? `$${Number(revenue).toLocaleString()}` : "$0",
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

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Tournaments</h1>
        <p className="text-text-secondary text-sm mt-1">Tournament Tracker — manage events and registration</p>
      </div>
      <TournamentsClient tournaments={tournaments} />
    </div>
  );
}
