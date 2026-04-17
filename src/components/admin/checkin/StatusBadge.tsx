"use client";

import { memo } from "react";

const ICON_PREFIX: Record<string, string> = {
  paid: "\u2713 ",
  unpaid: "\u23F3 ",
  checkedIn: "\u2713 ",
  notCheckedIn: "\u2715 ",
  pending: "\u23F3 ",
};

function StatusBadgeBase({
  variant,
  children,
}: {
  variant: "paid" | "unpaid" | "checkedIn" | "notCheckedIn" | "pending";
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    unpaid: "bg-amber-50 text-amber-700 border border-amber-200",
    checkedIn: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    notCheckedIn: "bg-red/10 text-red border border-red/20",
    pending: "bg-sky-50 text-sky-700 border border-sky-200",
  };
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${styles[variant]}`}
    >
      <span aria-hidden="true">{ICON_PREFIX[variant]}</span>{children}
    </span>
  );
}

export const StatusBadge = memo(StatusBadgeBase);
export default StatusBadge;
