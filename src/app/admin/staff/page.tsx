import { UserCheck } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StaffSheetClient from "@/components/admin/StaffSheetClient";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";
import { formatDateShort } from "@/lib/utils";

export const revalidate = 300;

export default async function StaffPage() {
  if (!isGoogleConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Staff & Refs
          </h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">
            Staff Check-Out & Ref Check-Out from Google Sheets
          </p>
        </div>
        <div className="bg-off-white border border-border rounded-xl p-5 text-center">
          <UserCheck className="w-10 h-10 text-text-secondary mx-auto mb-3" aria-hidden="true" />
          <p className="text-navy font-semibold mb-1">Google Sheets not connected</p>
          <p className="text-text-secondary text-sm">
            Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local
          </p>
        </div>
      </div>
    );
  }

  // Use allSettled so one failing sheet doesn't crash the whole page
  const results = await Promise.allSettled([
    fetchSheetWithHeaders(SHEETS.staffCheckOut),
    fetchSheetWithHeaders(SHEETS.refCheckOut),
  ]);
  const staffData = results[0].status === "fulfilled" ? results[0].value : { rows: [], headers: [] };
  const refData = results[1].status === "fulfilled" ? results[1].value : { rows: [], headers: [] };

  const NAME_COLS = ["Name", "Full Name", "Staff Name", "Employee Name"];
  const ROLE_COLS = ["Role", "Job", "Position", "Title", "Job Title"];
  const HOURS_COLS = ["Hours", "Hours Worked", "Total Hours", "Hours Worked (decimal)"];
  const PAY_METHOD_COLS = ["Payment Method", "Pay Method", "Paid Via", "How Paid"];
  const PAY_RATE_COLS = ["Rate", "Pay Rate", "Hourly Rate", "$/hr"];
  const DATE_COLS = ["Timestamp", "Date", "Shift Date"];

  const staff = staffData.rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => {
      const hours = parseFloat(getCol(row, ...HOURS_COLS)) || 0;
      const rate = parseFloat(getCol(row, ...PAY_RATE_COLS).replace(/[$,]/g, "")) || 0;
      const rawDate = getCol(row, ...DATE_COLS);
      return {
        name: getCol(row, ...NAME_COLS) || "—",
        role: getCol(row, ...ROLE_COLS) || "—",
        hours,
        payMethod: getCol(row, ...PAY_METHOD_COLS) || "—",
        rate,
        date: rawDate ? formatDateShort(rawDate) : "—",
        pay: rate > 0 ? hours * rate : 0,
      };
    });

  const GAMES_COLS = ["Games", "Games Officiated", "# Games", "Number of Games", "Game Count"];
  const COURTS_COLS = ["Courts", "Court Numbers", "Assigned Courts", "Court"];
  const REF_PAY_COLS = ["Payment", "Total Pay", "Amount", "Pay", "Total Amount"];
  const REF_RATE_COLS = ["Rate", "Per Game Rate", "Game Rate", "$/game"];

  const refs = refData.rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => {
      const games = parseInt(getCol(row, ...GAMES_COLS)) || 0;
      const rawDate = getCol(row, ...DATE_COLS);
      const pay = parseFloat(getCol(row, ...REF_PAY_COLS).replace(/[$,]/g, "")) || 0;
      const rate = parseFloat(getCol(row, ...REF_RATE_COLS).replace(/[$,]/g, "")) || 0;
      return {
        name: getCol(row, ...NAME_COLS) || "—",
        games,
        courts: getCol(row, ...COURTS_COLS) || "—",
        payMethod: getCol(row, ...PAY_METHOD_COLS) || "—",
        rate,
        pay,
        date: rawDate ? formatDateShort(rawDate) : "—",
      };
    });

  const staffByName: Record<string, number> = {};
  staff.forEach((s) => { staffByName[s.name] = (staffByName[s.name] || 0) + s.hours; });
  const refsByName: Record<string, number> = {};
  refs.forEach((r) => { refsByName[r.name] = (refsByName[r.name] || 0) + r.games; });

  const staffHoursData = Object.entries(staffByName).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  const refGamesData = Object.entries(refsByName).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));

  const totalStaffHours = staff.reduce((s, r) => s + r.hours, 0);
  const totalRefGames = refs.reduce((s, r) => s + r.games, 0);
  const totalStaffPay = staff.reduce((s, r) => s + r.pay, 0);
  const totalRefPay = refs.reduce((s, r) => s + r.pay, 0);

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <PageHeader
        title="Staff & Refs"
        subtitle={`${staff.length} staff shifts \u00B7 ${refs.length} ref check-outs`}
        icon={UserCheck}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 md:mb-8">
        {[
          { label: "Staff Hours", value: totalStaffHours.toFixed(1) + "h" },
          { label: "Staff Pay", value: totalStaffPay > 0 ? `$${Math.round(totalStaffPay).toLocaleString()}` : "—" },
          { label: "Ref Games", value: totalRefGames.toString() },
          { label: "Ref Pay", value: totalRefPay > 0 ? `$${Math.round(totalRefPay).toLocaleString()}` : "—" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-border rounded-xl p-3 md:p-4 shadow-sm">
            <p className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-1">{k.label}</p>
            <p className="text-navy font-bold text-xl md:text-2xl">{k.value}</p>
          </div>
        ))}
      </div>

      <StaffSheetClient
        staff={staff}
        refs={refs}
        staffHoursData={staffHoursData}
        refGamesData={refGamesData}
      />
    </div>
  );
}
