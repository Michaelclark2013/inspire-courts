"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowUpRight, DollarSign } from "lucide-react";

type PnL = {
  month: { revenueCents: number; expenseCents: number; profitCents: number; marginPercent: number };
  thirtyDay: { revenueCents: number; expenseCents: number; profitCents: number };
};

function dollars(c: number): string {
  return `${c < 0 ? "-" : ""}$${Math.abs(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function PnLCard() {
  const [data, setData] = useState<PnL | null>(null);

  useEffect(() => {
    fetch("/api/admin/pnl")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const positive = data.month.profitCents >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <section aria-label="Profit and loss" className="mb-6">
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-red" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Profit & Loss</h2>
          </div>
          <Link href="/admin/expenses" className="text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1">
            Expenses <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Month Revenue</p>
            <p className="text-navy font-heading text-3xl font-bold tabular-nums mt-1">{dollars(data.month.revenueCents)}</p>
            <p className="text-text-muted text-xs mt-1">Rentals + tournament entries</p>
          </div>
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Month Expenses</p>
            <p className="text-red font-heading text-3xl font-bold tabular-nums mt-1">{dollars(data.month.expenseCents)}</p>
            <p className="text-text-muted text-xs mt-1">All categories</p>
          </div>
          <div className={`${positive ? "bg-emerald-50" : "bg-red/10"} rounded-2xl p-4`}>
            <p className={`text-[10px] uppercase tracking-widest font-bold ${positive ? "text-emerald-700" : "text-red"}`}>
              Month Profit
            </p>
            <p className={`font-heading text-3xl font-bold tabular-nums mt-1 flex items-center gap-1.5 ${positive ? "text-emerald-700" : "text-red"}`}>
              <TrendIcon className="w-6 h-6" />
              {dollars(data.month.profitCents)}
            </p>
            <p className={`text-xs mt-1 ${positive ? "text-emerald-700" : "text-red"}`}>
              {data.month.marginPercent}% margin
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border bg-off-white/40 flex items-center justify-between text-xs">
          <p className="text-text-muted">
            Last 30 days: <span className="font-bold text-navy">{dollars(data.thirtyDay.revenueCents)}</span> revenue
            {" · "}
            <span className="font-bold text-red">{dollars(data.thirtyDay.expenseCents)}</span> expenses
            {" · "}
            <span className={`font-bold ${data.thirtyDay.profitCents >= 0 ? "text-emerald-700" : "text-red"}`}>
              {dollars(data.thirtyDay.profitCents)}
            </span> profit
          </p>
        </div>
      </div>
    </section>
  );
}
