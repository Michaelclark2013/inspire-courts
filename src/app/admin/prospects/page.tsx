import { TrendingUp } from "lucide-react";
import ProspectsSheetClient from "@/components/admin/ProspectsSheetClient";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

export const revalidate = 300;

export default async function ProspectsPage() {
  if (!isGoogleConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-heading">Prospects</h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">Team Prospect Pipeline</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-5 text-center">
          <TrendingUp className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Google Sheets not connected</p>
          <p className="text-text-secondary text-sm">Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local</p>
        </div>
      </div>
    );
  }

  const { rows } = await fetchSheetWithHeaders(SHEETS.prospectPipeline);

  const TEAM_COLS = ["Team Name", "Team", "Club", "Organization", "School"];
  const COACH_COLS = ["Coach", "Head Coach", "Contact", "Coach Name"];
  const PHONE_COLS = ["Phone", "Cell", "Contact Phone", "Phone Number"];
  const EMAIL_COLS = ["Email", "Contact Email"];
  const STATUS_COLS = ["Status", "Outreach Status", "Stage", "Pipeline Status"];
  const DIV_COLS = ["Division", "Age Group", "Age", "Grade", "Level"];
  const NOTES_COLS = ["Notes", "Comments", "Note", "Next Steps"];
  const DATE_COLS = ["Date", "Timestamp", "Last Contact", "Date Added"];

  const prospects = rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => {
      const rawDate = getCol(row, ...DATE_COLS);
      return {
        team: getCol(row, ...TEAM_COLS) || "—",
        coach: getCol(row, ...COACH_COLS) || "—",
        phone: getCol(row, ...PHONE_COLS) || "—",
        email: getCol(row, ...EMAIL_COLS) || "—",
        status: getCol(row, ...STATUS_COLS) || "Unknown",
        division: getCol(row, ...DIV_COLS) || "—",
        notes: getCol(row, ...NOTES_COLS) || "",
        date: rawDate
          ? (() => { try { return new Date(rawDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return rawDate; } })()
          : "—",
      };
    });

  // Status funnel counts
  const statusOrder = [
    "Committed",
    "Registered",
    "Interested",
    "Texted",
    "Contacted",
    "No Response",
    "No Go",
    "Unknown",
  ];
  const statusCounts: Record<string, number> = {};
  prospects.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  const funnelData = Object.entries(statusCounts)
    .sort(([a], [b]) => {
      const ai = statusOrder.findIndex((s) => a.toLowerCase().includes(s.toLowerCase()));
      const bi = statusOrder.findIndex((s) => b.toLowerCase().includes(s.toLowerCase()));
      if (ai === -1 && bi === -1) return b.valueOf() > a.valueOf() ? 1 : -1;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([label, value]) => ({ label, value }));

  const divCounts: Record<string, number> = {};
  prospects.forEach((p) => { if (p.division !== "—") divCounts[p.division] = (divCounts[p.division] || 0) + 1; });
  const divData = Object.entries(divCounts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  // Committed count
  const committed = prospects.filter((p) =>
    /commit|register|paid|yes/i.test(p.status)
  ).length;

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-heading">
            Prospects
          </h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">
            Team Prospect Pipeline — {prospects.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-success/10 border border-success/20 rounded-sm px-2.5 py-1.5 text-center min-w-[44px]">
            <p className="text-success font-bold text-base leading-none">{committed}</p>
            <p className="text-success/70 text-[10px] uppercase tracking-wider mt-0.5">Committed</p>
          </div>
          <div className="bg-bg-secondary border border-border rounded-sm px-2.5 py-1.5 text-center min-w-[44px]">
            <p className="text-white font-bold text-base leading-none">{prospects.length - committed}</p>
            <p className="text-text-secondary text-[10px] uppercase tracking-wider mt-0.5">Pipeline</p>
          </div>
        </div>
      </div>

      <ProspectsSheetClient prospects={prospects} funnelData={funnelData} divData={divData} />
    </div>
  );
}
