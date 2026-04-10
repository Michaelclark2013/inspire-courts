import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DataTable from "@/components/dashboard/DataTable";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const staff = [
    { name: "James P.", role: "Court Manager", shifts: 12, totalPay: "$960", lastShift: "Apr 12, 2025" },
    { name: "Maria G.", role: "Front Desk", shifts: 8, totalPay: "$480", lastShift: "Apr 12, 2025" },
    { name: "Alex T.", role: "Snack Bar", shifts: 6, totalPay: "$360", lastShift: "Apr 12, 2025" },
  ];

  const refs = [
    { name: "David R.", games: 24, totalPay: "$1,440", payMethod: "Venmo", lastGame: "Apr 12, 2025" },
    { name: "Chris W.", games: 18, totalPay: "$1,080", payMethod: "Cash", lastGame: "Apr 12, 2025" },
    { name: "Tony M.", games: 12, totalPay: "$720", payMethod: "Zelle", lastGame: "Apr 11, 2025" },
  ];

  const staffColumns = [
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "shifts", label: "Shifts" },
    { key: "totalPay", label: "Total Pay" },
    { key: "lastShift", label: "Last Shift" },
  ];

  const refColumns = [
    { key: "name", label: "Name" },
    { key: "games", label: "Games" },
    { key: "totalPay", label: "Total Pay" },
    { key: "payMethod", label: "Pay Method" },
    { key: "lastGame", label: "Last Game" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Staff & Refs
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Event Staff & Referee databases from Notion
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
            Event Staff
          </h3>
          <DataTable columns={staffColumns} data={staff} searchKey="name" searchPlaceholder="Search staff..." />
        </div>

        <div className="bg-bg-secondary border border-border rounded-sm p-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
            Referees
          </h3>
          <DataTable columns={refColumns} data={refs} searchKey="name" searchPlaceholder="Search referees..." />
        </div>
      </div>
    </div>
  );
}
