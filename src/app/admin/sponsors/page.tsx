import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default async function SponsorsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const sponsors = [
    { company: "AZ Sports Nutrition", contact: "Jake M.", status: "Active", tier: "Gold", amount: "$2,500", event: "All Events", startDate: "Jan 2025" },
    { company: "Gilbert Auto Group", contact: "Steve R.", status: "Pitched", tier: "Silver", amount: "$1,000", event: "OFF SZN Series", startDate: "—" },
    { company: "Desert Physical Therapy", contact: "Lisa K.", status: "Prospect", tier: "—", amount: "—", event: "—", startDate: "—" },
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
    { key: "amount", label: "Amount" },
    { key: "event", label: "Event" },
    { key: "startDate", label: "Start Date" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Sponsorships
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Sponsorship Pipeline from Notion
        </p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-sm p-5">
        <DataTable columns={columns} data={sponsors} searchKey="company" searchPlaceholder="Search sponsors..." />
      </div>
    </div>
  );
}
