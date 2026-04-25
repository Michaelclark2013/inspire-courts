"use client";

import { Download, Printer } from "lucide-react";

export default function ExportBar({
  onExportCSV,
  csvLabel = "Export CSV",
}: {
  onExportCSV?: () => void;
  csvLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {onExportCSV && (
        <button
          type="button"
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-lg bg-off-white hover:bg-navy/[0.06] border border-light-gray transition-colors"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          {csvLabel}
        </button>
      )}
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-lg bg-off-white hover:bg-navy/[0.06] border border-light-gray transition-colors"
      >
        <Printer className="w-3.5 h-3.5" aria-hidden="true" />
        Print / PDF
      </button>
    </div>
  );
}
