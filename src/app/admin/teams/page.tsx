import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);
  // Auth temporarily disabled

  // Placeholder data — will be replaced with Notion API data
  const teams = [
    { teamName: "AZ Scorpions", coach: "D. Williams", email: "dwilliams@email.com", phone: "(480) 555-0101", sport: "Basketball", gender: "Boys", age: "15U", status: "Hot", outreach: "Registered" },
    { teamName: "East Valley Elite", coach: "R. Martinez", email: "rmartinez@email.com", phone: "(480) 555-0102", sport: "Basketball", gender: "Boys", age: "12U", status: "Warm", outreach: "Contacted" },
    { teamName: "Gilbert Lady Ballers", coach: "S. Thompson", email: "sthompson@email.com", phone: "(480) 555-0103", sport: "Basketball", gender: "Girls", age: "14U", status: "Cold", outreach: "Not Contacted" },
  ];

  const columns = [
    { key: "teamName", label: "Team" },
    { key: "coach", label: "Coach" },
    { key: "email", label: "Email" },
    { key: "sport", label: "Sport" },
    { key: "gender", label: "Gender" },
    { key: "age", label: "Age" },
    {
      key: "status",
      label: "Lead Status",
      render: (val: string) => <StatusBadge status={val} />,
    },
    { key: "outreach", label: "Outreach" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Teams & Pipeline
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Coach & Team Database from Notion
        </p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-sm p-5">
        <DataTable
          columns={columns}
          data={teams}
          searchKey="teamName"
          searchPlaceholder="Search teams or coaches..."
        />
      </div>
    </div>
  );
}
