import { TrendingUp, Target } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import ProspectsSheetClient from "@/components/admin/ProspectsSheetClient";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";
import { formatDateShort } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Prospects | Inspire Courts AZ" };

export const revalidate = 300;

export default async function ProspectsPage() {
  // Sheets is optional. Page renders with empty rows when unconfigured.
  const { rows } = isGoogleConfigured()
    ? await fetchSheetWithHeaders(SHEETS.prospectPipeline)
    : { rows: [] as Record<string, string>[] };

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
          ? (() => { try { return formatDateShort(rawDate); } catch { return rawDate; } })()
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
        <PageHeader
          title="Prospects"
          subtitle={`Team Prospect Pipeline — ${prospects.length} total`}
          icon={Target}
        />
        <div className="flex gap-2 flex-shrink-0">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center min-w-[52px]">
            <p className="text-emerald-700 font-bold text-base leading-none">{committed}</p>
            <p className="text-emerald-600/70 text-[10px] uppercase tracking-wider font-semibold mt-0.5">Committed</p>
          </div>
          <div className="bg-white border border-border rounded-xl px-3 py-2 text-center min-w-[52px]">
            <p className="text-navy font-bold text-base leading-none">{prospects.length - committed}</p>
            <p className="text-text-secondary text-[10px] uppercase tracking-wider font-semibold mt-0.5">Pipeline</p>
          </div>
        </div>
      </div>

      <ProspectsSheetClient prospects={prospects} funnelData={funnelData} divData={divData} />
    </div>
  );
}
