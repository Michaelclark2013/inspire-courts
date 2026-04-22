import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpsDashboard from "@/components/admin/OpsDashboard";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

const PushNotificationPrompt = dynamic(
  () => import("@/components/pwa/PushNotificationPrompt")
);

// Ops-first dashboard. Pulls everything (staff on the clock,
// pending time approvals, understaffed shifts, active rentals, 1099
// threshold alerts, pay periods, next tournaments) from a single
// /api/admin/ops-summary call. Client component does the polling +
// auto-refresh.
//
// The legacy Google-Sheets dashboard (teams/money/checkins charts)
// is kept at /admin/legacy-dashboard for the cutover window — link
// below. Remove after a couple weeks of parity.
export default async function AdminHome() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? null;

  return (
    <>
      <OpsDashboard userName={name} />
      <div className="px-3 sm:px-6 lg:px-8 pb-8">
        <Link
          href="/admin/legacy-dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-navy"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Legacy Sheets dashboard (charts + revenue from Google Sheets)
        </Link>
      </div>
      <PushNotificationPrompt />
    </>
  );
}
