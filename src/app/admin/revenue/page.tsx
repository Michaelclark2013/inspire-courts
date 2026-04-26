import { DollarSign } from "lucide-react";
import RevenueSheetClient from "@/components/admin/RevenueSheetClient";
import { RevenueKPIs } from "@/components/admin/revenue/RevenueKPIs";
import { RevenueEmptyState } from "@/components/admin/revenue/EmptyState";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";
import { formatCurrency } from "@/lib/utils";
import type { Transaction, RevenueKPIData } from "@/types/revenue";

export const revalidate = 300;

export default async function RevenuePage() {
  if (!isGoogleConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8 hidden md:block">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Revenue
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Mom Money &mdash; Revenue Tracking
          </p>
        </div>
        <div className="bg-white border border-light-gray shadow-sm rounded-xl p-5 text-center">
          <DollarSign
            className="w-10 h-10 text-text-secondary mx-auto mb-3"
            aria-hidden="true"
          />
          <p className="text-navy font-semibold mb-1">
            Google Sheets not connected
          </p>
          <p className="text-text-secondary text-sm">
            Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local
          </p>
        </div>
      </div>
    );
  }

  const { rows } = await fetchSheetWithHeaders(SHEETS.momMoney);

  const DATE_COLS = ["Timestamp", "Date", "Date/Time", "Event Date"];
  const DESC_COLS = [
    "Description",
    "Event",
    "Event Name",
    "Item",
    "For",
  ];
  const CASH_COLS = ["Cash", "Cash Amount", "Cash $", "Cash Total"];
  const CARD_COLS = [
    "Card",
    "Credit Card",
    "Card Amount",
    "Debit",
    "Credit/Debit",
  ];
  const SQUARE_COLS = [
    "Square",
    "Square Amount",
    "Venmo",
    "Zelle",
    "CashApp",
    "Digital",
  ];
  const TOTAL_COLS = ["Total", "Amount", "Total $", "Grand Total", "Revenue"];
  const NOTES_COLS = ["Notes", "Comments", "Note"];

  const transactions: Transaction[] = rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => {
      const rawDate = getCol(row, ...DATE_COLS);
      const cash =
        parseFloat(getCol(row, ...CASH_COLS).replace(/[$,]/g, "")) || 0;
      const card =
        parseFloat(getCol(row, ...CARD_COLS).replace(/[$,]/g, "")) || 0;
      const square =
        parseFloat(getCol(row, ...SQUARE_COLS).replace(/[$,]/g, "")) || 0;
      const totalRaw =
        parseFloat(getCol(row, ...TOTAL_COLS).replace(/[$,]/g, "")) || 0;
      const total = totalRaw || cash + card + square;

      return {
        date: rawDate
          ? (() => {
              try {
                return new Date(rawDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              } catch {
                return rawDate;
              }
            })()
          : "\u2014",
        description: getCol(row, ...DESC_COLS) || "\u2014",
        cash,
        card,
        square,
        total,
        notes: getCol(row, ...NOTES_COLS) || "",
      };
    });

  // Early return for empty data (area 15)
  if (transactions.length === 0) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8 hidden md:block">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Revenue
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Mom Money &mdash; Revenue Tracking
          </p>
        </div>
        <RevenueEmptyState />
      </div>
    );
  }

  const totalCash = transactions.reduce((s, t) => s + t.cash, 0);
  const totalCard = transactions.reduce((s, t) => s + t.card, 0);
  const totalSquare = transactions.reduce((s, t) => s + t.square, 0);
  const grandTotal = transactions.reduce((s, t) => s + t.total, 0);

  // Revenue over time for chart
  const byDate: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.date !== "\u2014" && t.total > 0) {
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

  const kpis: RevenueKPIData[] = [
    {
      label: "Grand Total",
      value: formatCurrency(grandTotal),
      highlight: true,
    },
    { label: "Cash", value: formatCurrency(totalCash) },
    { label: "Card", value: formatCurrency(totalCard) },
    { label: "Square / Digital", value: formatCurrency(totalSquare) },
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-[env(safe-area-inset-bottom)]">
      <div className="mb-4 md:mb-8 hidden md:block">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
          Revenue
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Mom Money &mdash; {transactions.length} entries
        </p>
      </div>

      {/* KPI row (area 3 - extracted component) */}
      <RevenueKPIs kpis={kpis} />

      <RevenueSheetClient
        transactions={transactions}
        sourceData={sourceData}
        revenueOverTime={revenueOverTime}
      />
    </div>
  );
}
