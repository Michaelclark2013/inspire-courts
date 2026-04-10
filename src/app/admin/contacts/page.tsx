import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const contacts = [
    { name: "Sarah J.", email: "sarah@example.com", phone: "(480) 555-0201", type: "Tournament Registration", status: "New", date: "Apr 15, 2025" },
    { name: "Marcus T.", email: "marcus@example.com", phone: "(480) 555-0202", type: "Facility Rental", status: "Reviewed", date: "Apr 14, 2025" },
    { name: "Lisa P.", email: "lisa@example.com", phone: "—", type: "General Question", status: "Responded", date: "Apr 13, 2025" },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "type", label: "Inquiry Type" },
    {
      key: "status",
      label: "Status",
      render: (val: string) => <StatusBadge status={val} />,
    },
    { key: "date", label: "Date" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Contact Submissions
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Messages from the contact form
        </p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-sm p-5">
        <DataTable columns={columns} data={contacts} searchKey="name" searchPlaceholder="Search submissions..." />
      </div>
    </div>
  );
}
