import { DollarSign } from "lucide-react";

export function RevenueEmptyState() {
  return (
    <div className="bg-white border border-light-gray shadow-sm rounded-sm p-8 text-center">
      <DollarSign
        className="w-10 h-10 text-text-secondary mx-auto mb-3"
        aria-hidden="true"
      />
      <p className="text-navy font-semibold mb-1">No revenue data yet</p>
      <p className="text-text-secondary text-sm max-w-md mx-auto">
        Revenue entries will appear here once transactions are recorded in the
        Mom Money spreadsheet. Make sure the Google Sheet is connected and has
        at least one row of data.
      </p>
    </div>
  );
}
