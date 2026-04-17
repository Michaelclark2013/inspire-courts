"use client";

import { memo } from "react";
import type { Transaction } from "@/types/revenue";
import { formatCurrency } from "@/lib/utils";

interface Props {
  transaction: Transaction;
}

function TransactionRowInner({ transaction: t }: Props) {
  return (
    <tr className="hover:bg-off-white transition-colors">
      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
        {t.date}
      </td>
      <td
        className="px-4 py-3 text-navy max-w-[200px] truncate"
        title={t.description}
      >
        {t.description}
      </td>
      <td className="px-4 py-3 font-mono text-sm">
        {t.cash > 0 ? (
          <span className="text-emerald-700">{formatCurrency(t.cash)}</span>
        ) : (
          <span className="text-text-secondary/30" aria-label="none">
            &mdash;
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-sm">
        {t.card > 0 ? (
          <span className="text-blue-700">{formatCurrency(t.card)}</span>
        ) : (
          <span className="text-text-secondary/30" aria-label="none">
            &mdash;
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-sm">
        {t.square > 0 ? (
          <span className="text-purple-700">{formatCurrency(t.square)}</span>
        ) : (
          <span className="text-text-secondary/30" aria-label="none">
            &mdash;
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-mono font-bold text-navy">
        {t.total > 0 ? formatCurrency(t.total) : "\u2014"}
      </td>
    </tr>
  );
}

export const TransactionRow = memo(TransactionRowInner);
