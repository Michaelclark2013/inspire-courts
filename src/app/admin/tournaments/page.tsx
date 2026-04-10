import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default async function TournamentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const tournaments = [
    { name: "OFF SZN Session 1", date: "May 2025", sport: "Basketball", status: "Registration Open", teams: 16, fee: "$400", revenue: "$6,400", net: "$4,200" },
    { name: "Hoopalooza Heroes", date: "June 2025", sport: "Basketball", status: "Planning", teams: 0, fee: "$400", revenue: "$0", net: "$0" },
    { name: "Red Rock Invitational", date: "April 2025", sport: "Basketball", status: "Completed", teams: 32, fee: "$450", revenue: "$14,400", net: "$10,800" },
  ];

  const columns = [
    { key: "name", label: "Tournament" },
    { key: "date", label: "Date" },
    { key: "sport", label: "Sport" },
    {
      key: "status",
      label: "Status",
      render: (val: string) => <StatusBadge status={val} />,
    },
    { key: "teams", label: "Teams" },
    { key: "fee", label: "Entry Fee" },
    { key: "revenue", label: "Revenue" },
    { key: "net", label: "Net Profit" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Tournaments
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Tournament Tracker from Notion
        </p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-sm p-5">
        <DataTable
          columns={columns}
          data={tournaments}
          searchKey="name"
          searchPlaceholder="Search tournaments..."
        />
      </div>
    </div>
  );
}
