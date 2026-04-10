import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DataTable from "@/components/dashboard/DataTable";

export default async function SchoolsPage() {
  const session = await getServerSession(authOptions);
  // Auth temporarily disabled

  const schools = [
    { school: "Gilbert High School", city: "Gilbert", state: "AZ", classification: "6A", headCoach: "Mike S.", status: "Active", programs: "Varsity, JV" },
    { school: "Highland High School", city: "Gilbert", state: "AZ", classification: "6A", headCoach: "Tom B.", status: "Active", programs: "Varsity, JV, Freshman" },
    { school: "Mesquite High School", city: "Gilbert", state: "AZ", classification: "5A", headCoach: "Ray L.", status: "Contacted", programs: "Varsity, JV" },
  ];

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
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Schools
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          School Basketball Programs from Notion
        </p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-sm p-5">
        <DataTable columns={columns} data={schools} searchKey="school" searchPlaceholder="Search schools..." />
      </div>
    </div>
  );
}
