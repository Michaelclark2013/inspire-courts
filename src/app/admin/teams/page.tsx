import { Users, ImageIcon } from "lucide-react";
import Link from "next/link";
import TeamsSheetClient from "@/components/admin/TeamsSheetClient";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

export const revalidate = 300;

const DIVISION_ORDER = [
  "17U", "16U", "15U", "14U", "13U", "12U", "11U", "10U",
];

export default async function TeamsPage() {
  if (!isGoogleConfigured()) {
    return <SetupPrompt />;
  }

  const { rows } = await fetchSheetWithHeaders(SHEETS.masterTeams);

  const TEAM_COLS = ["Team Name", "Team", "Club Name", "Organization"];
  const COACH_COLS = ["Coach", "Head Coach", "Contact Person", "Coach Name"];
  const EMAIL_COLS = ["Email", "Contact Email", "Email Address"];
  const PHONE_COLS = ["Phone", "Phone Number", "Cell", "Contact Phone"];
  const DIV_COLS = ["Division", "Age Group", "Age", "Grade", "Level"];
  const PAY_STATUS_COLS = ["Payment Status", "Paid", "Status", "Payment"];
  const AMOUNT_COLS = ["Amount", "Fee", "Total", "Cost", "$"];
  const NOTES_COLS = ["Notes", "Note", "Comments", "Additional Info"];

  const teams = rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => ({
      teamName: getCol(row, ...TEAM_COLS) || "Unnamed Team",
      coach: getCol(row, ...COACH_COLS) || "—",
      email: getCol(row, ...EMAIL_COLS) || "—",
      phone: getCol(row, ...PHONE_COLS) || "—",
      division: getCol(row, ...DIV_COLS) || "—",
      paymentStatus: getCol(row, ...PAY_STATUS_COLS) || "—",
      amount: getCol(row, ...AMOUNT_COLS) || "—",
      notes: getCol(row, ...NOTES_COLS) || "",
    }));

  // Count by division
  const divisionCounts: Record<string, number> = {};
  teams.forEach((t) => {
    divisionCounts[t.division] = (divisionCounts[t.division] || 0) + 1;
  });

  const divisionData = Object.entries(divisionCounts)
    .sort(([a], [b]) => {
      const ai = DIVISION_ORDER.indexOf(a);
      const bi = DIVISION_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([label, value]) => ({ label, value }));

  const paidCount = teams.filter((t) =>
    /paid|yes|complete/i.test(t.paymentStatus)
  ).length;
  const unpaidCount = teams.filter((t) =>
    /unpaid|no|pending|due/i.test(t.paymentStatus)
  ).length;

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-heading">
            Teams
          </h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">
            Master Teams & Payments — {teams.length} teams registered
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 items-center">
          <Link
            href="/admin/teams/logos"
            className="flex items-center gap-1.5 text-text-secondary hover:text-white border border-border hover:border-accent/40 rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Logos
          </Link>
          <div className="bg-success/10 border border-success/20 rounded-sm px-2.5 py-1.5 text-center min-w-[44px]">
            <p className="text-success font-bold text-base leading-none">{paidCount}</p>
            <p className="text-success/70 text-[10px] uppercase tracking-wider mt-0.5">Paid</p>
          </div>
          <div className="bg-danger/10 border border-danger/20 rounded-sm px-2.5 py-1.5 text-center min-w-[44px]">
            <p className="text-danger font-bold text-base leading-none">{unpaidCount}</p>
            <p className="text-danger/70 text-[10px] uppercase tracking-wider mt-0.5">Unpaid</p>
          </div>
        </div>
      </div>

      <TeamsSheetClient teams={teams} divisionData={divisionData} />
    </div>
  );
}

function SetupPrompt() {
  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-heading">Teams</h1>
        <p className="text-text-secondary text-sm mt-1 hidden md:block">Master Teams & Payments</p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-sm p-5 text-center">
        <Users className="w-10 h-10 text-text-secondary mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">Google Sheets not connected</p>
        <p className="text-text-secondary text-sm">Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local</p>
      </div>
    </div>
  );
}
