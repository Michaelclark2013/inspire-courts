"use client";

import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";

// Sponsor row shape — matches the projection from /admin/sponsors/page.tsx.
export type Sponsor = {
  company: string;
  contact: string;
  status: string;
  tier: string;
  amount: string | number;
  amountDisplay: string;
  event: string;
  startDate: string;
};

// The columns array contains an inline `render` callback for the
// status cell. Render is a function — functions can't cross the RSC
// boundary, so the columns definition has to live inside a client
// component. The page passes plain `sponsors[]` data here.
export default function SponsorsTable({ sponsors }: { sponsors: Sponsor[] }) {
  const columns: {
    key: keyof Sponsor & string;
    label: string;
    render?: (val: Sponsor[keyof Sponsor], row: Sponsor) => React.ReactNode;
  }[] = [
    { key: "company", label: "Company" },
    { key: "contact", label: "Contact" },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={String(val ?? "")} />,
    },
    { key: "tier", label: "Tier" },
    { key: "amountDisplay", label: "Amount" },
    { key: "event", label: "Event" },
    { key: "startDate", label: "Start Date" },
  ];

  return (
    <DataTable
      columns={columns}
      data={sponsors}
      searchKey="company"
      searchPlaceholder="Search sponsors..."
    />
  );
}
