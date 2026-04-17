// ── Revenue shared types ──────────────────────────────────────────────────────

export interface Transaction {
  date: string;
  description: string;
  cash: number;
  card: number;
  square: number;
  total: number;
  notes: string;
}

export interface RevenueSourceData {
  label: string;
  value: number;
}

export interface RevenueOverTimeEntry {
  label: string;
  value: number;
}

export type TimeRange = "7d" | "30d" | "90d" | "all";

export interface RevenueKPIData {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface RevenueTotals {
  grandTotal: number;
  totalCash: number;
  totalCard: number;
  totalSquare: number;
}
