"use client";

import type { Transaction, RevenueSourceData, RevenueOverTimeEntry } from "@/types/revenue";
import { RevenueCharts } from "@/components/admin/revenue/RevenueCharts";
import { TransactionList } from "@/components/admin/revenue/TransactionList";

interface Props {
  transactions: Transaction[];
  sourceData: RevenueSourceData[];
  revenueOverTime: RevenueOverTimeEntry[];
}

export default function RevenueSheetClient({
  transactions,
  sourceData,
  revenueOverTime,
}: Props) {
  return (
    <div className="space-y-6">
      <RevenueCharts sourceData={sourceData} revenueOverTime={revenueOverTime} />
      <TransactionList transactions={transactions} />
    </div>
  );
}
