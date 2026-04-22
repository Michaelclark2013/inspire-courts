import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpsDashboard from "@/components/admin/OpsDashboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Ops Dashboard | Inspire Courts AZ",
  robots: "noindex, nofollow",
};

// Ops dashboard. Pulls staff on the clock, pending time approvals,
// understaffed shifts, active rentals, 1099 threshold alerts, pay
// periods, and next tournaments from /api/admin/ops-summary.
//
// Kept at /admin/ops so the main /admin page can continue to show
// the Sheets-backed dashboard (teams / revenue / recent games)
// admins are used to. Reachable from the sidebar + a banner on
// the main dashboard.
export default async function OpsPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? null;

  return (
    <>
      <div className="px-3 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-navy"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to main dashboard
        </Link>
      </div>
      <OpsDashboard userName={name} />
    </>
  );
}
