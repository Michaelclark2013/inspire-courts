import { GraduationCap } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";
import NotionFallback from "@/components/dashboard/NotionFallback";
import { getAllSchools, getProperty, isNotionConfigured } from "@/lib/notion";

export default async function SchoolsPage() {
  if (!isNotionConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Schools</h1>
          <p className="text-text-secondary text-sm mt-1">School Basketball Programs from Notion</p>
        </div>
        <NotionFallback type="no-key" entityName="schools" />
      </div>
    );
  }

  const data = await getAllSchools();

  if (data.length === 0) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Schools</h1>
          <p className="text-text-secondary text-sm mt-1">School Basketball Programs from Notion</p>
        </div>
        <NotionFallback type="empty" entityName="schools" />
      </div>
    );
  }

  const schools = data.map((s: any) => ({
    school: getProperty(s, "School") || getProperty(s, "Name") || "—",
    city: getProperty(s, "City") || "—",
    state: getProperty(s, "State") || "AZ",
    classification: getProperty(s, "Classification") || getProperty(s, "Class") || "—",
    headCoach: getProperty(s, "Head Coach") || getProperty(s, "Coach") || "—",
    status: getProperty(s, "Status") || "—",
    programs: getProperty(s, "Programs") || "—",
  }));

  const columns = [
    { key: "school", label: "School" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "classification", label: "Class" },
    { key: "headCoach", label: "Head Coach" },
    { key: "status", label: "Status" },
    { key: "programs", label: "Programs" },
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Schools</h1>
        <p className="text-text-secondary text-sm mt-1">School Basketball Programs from Notion</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <KPICard title="Total Schools" value={schools.length.toString()} icon={GraduationCap} />
      </div>

      <div className="bg-bg-secondary border border-border rounded-sm p-5">
        <DataTable columns={columns} data={schools} searchKey="school" searchPlaceholder="Search schools..." />
      </div>
    </div>
  );
}
