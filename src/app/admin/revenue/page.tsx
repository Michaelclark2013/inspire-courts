import { DollarSign } from "lucide-react";
import RevenueSheetClient from "@/components/admin/RevenueSheetClient";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

export const revalidate = 300;

export default async function RevenuePage() {
  if (!isGoogleConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-heading">Revenue</h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">Mom Money — Revenue Tracking</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-5 text-center">
          <DollarSign className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Google Sheets not connected</p>
          <p className="text-text-secondary text-sm">Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local</p>
        </div>
      </div>
    );
  }

  const { headers, rows } = await fetchSheetWithHeaders(SHEETS.momMoney);

  const DATE_COLS = ["Timestamp", "Date", "Date/Time", "Event Date"];
  const DESC_COLS = ["Description", "Event", "Event Name", "Item", "For"];
  const CASH_COLS = ["Cash", "Cash Amount", "Cash $", "Cash Total"];
  const CARD_COLS = ["Card", "Credit Card", "Card Amount", "Debit", "Credit/Debit"];
  const SQUARE_COLS = ["Square", "Square Amount", "Venmo", "Zelle", "CashApp", "Digital"];
  const TOTAL_COLS = ["Total", "Amount", "Total $", "Grand Total", "Revenue"];
  const NOTES_COLS = ["Notes", "Comments", "Note"];

  const transactions = rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => {
      const rawDate = getCol(row, ...DATE_COLS);
      const cash = parseFloat(getCol(row, ...CASH_COLS).replace(/[$,]/g, "")) || 0;
      const card = parseFloat(getCol(row, ...CARD_COLS).replace(/[$,]/g, "")) || 0;
      const square = parseFloat(getCol(row, ...SQUARE_COLS).replace(/[$,]/g, "")) || 0;
      const totalRaw = parseFloat(getCol(row, ...TOTAL_COLS).replace(/[$,]/g, "")) || 0;
      const total = totalRaw || cash + card + square;

      return {
        date: rawDate
          ? (() => { try { return new Date(rawDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return rawDate; } })()
          : "—",
        description: getCol(row, ...DESC_COLS) || "—",
        cash,
        card,
        square,
        total,
        notes: getCol(row, ...NOTES_COLS) || "",
      };
    });

  const totalCash = transactions.reduce((s, t) => s + t.cash, 0);
  const totalCard = transactions.reduce((s, t) => s + t.card, 0);
  const totalSquare = transactions.reduce((s, t) => s + t.square, 0);
  const grandTotal = transactions.reduce((s, t) => s + t.total, 0);

  // Revenue over time for chart
  const byDate: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.date !== "—" && t.total > 0) {
      byDate[t.date] = (byDate[t.date] || 0) + t.total;
    }
  });
  const revenueOverTime = Object.entries(byDate)
    .slice(-12)
    .map(([label, value]) => ({ label, value }));

  const sourceData = [
    { label: "Cash", value: Math.round(totalCash) },
    { label: "Card", value: Math.round(totalCard) },
    { label: "Square/Digital", value: Math.round(totalSquare) },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-heading">
          Revenue
        </h1>
        <p className="text-text-secondary text-sm mt-1 hidden md:block">
          Mom Money — {transactions.length} entries
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 md:mb-8">
        {[
          { label: "Grand Total", value: `$${Math.round(grandTotal).toLocaleString()}`, highlight: true },
          { label: "Cash", value: `$${Math.round(totalCash).toLocaleString()}` },
          { label: "Card", value: `$${Math.round(totalCard).toLocaleString()}` },
          { label: "Square / Digital", value: `$${Math.round(totalSquare).toLocaleString()}` },
        ].map((k) => (
          <div
            key={k.label}
            className={`border rounded-sm p-3 md:p-4 ${
              k.highlight
                ? "bg-accent/10 border-accent/30"
                : "bg-bg-secondary border-border"
            }`}
          >
            <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`font-bold text-xl md:text-2xl ${k.highlight ? "text-accent" : "text-white"}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <RevenueSheetClient
        transactions={transactions}
        sourceData={sourceData}
        revenueOverTime={revenueOverTime}
      />
    </div>
  );
}
