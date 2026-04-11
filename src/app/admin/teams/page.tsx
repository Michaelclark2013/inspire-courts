import NotionFallback from "@/components/dashboard/NotionFallback";
import TeamsClient from "@/components/admin/TeamsClient";
import { getAllTeams, getProperty, isNotionConfigured } from "@/lib/notion";

export default async function TeamsPage() {
  if (!isNotionConfigured()) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Teams & Pipeline</h1>
          <p className="text-text-secondary text-sm mt-1">Coach & Team Database — track leads and registrations</p>
        </div>
        <NotionFallback type="no-key" entityName="teams" />
      </div>
    );
  }

  const data = await getAllTeams();

  const teams = data.map((t: any) => ({
    teamName: getProperty(t, "Team Name") || getProperty(t, "Name") || "—",
    coach: getProperty(t, "Coach") || getProperty(t, "Head Coach") || "—",
    phone: getProperty(t, "Phone") || "—",
    age: getProperty(t, "Age Group") || getProperty(t, "Age") || getProperty(t, "Division") || "—",
    gender: getProperty(t, "Gender") || "—",
    status: getProperty(t, "Status") || "—",
    outreach: getProperty(t, "Outreach") || getProperty(t, "Outreach Status") || "—",
    source: getProperty(t, "Source") || "—",
  }));

  if (teams.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Teams & Pipeline</h1>
          <p className="text-text-secondary text-sm mt-1">Coach & Team Database — track leads and registrations</p>
        </div>
        <NotionFallback type="empty" entityName="teams" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Teams & Pipeline</h1>
        <p className="text-text-secondary text-sm mt-1">Coach & Team Database — track leads and registrations</p>
      </div>
      <TeamsClient teams={teams} />
    </div>
  );
}
