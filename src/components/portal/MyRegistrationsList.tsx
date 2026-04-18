"use client";

import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import type { Registration } from "@/types/portal";

export function MyRegistrationsList({ registrations }: { registrations: Registration[] }) {
  if (registrations.length === 0) {
    return (
      <div className="mb-6 bg-white shadow-sm border border-light-gray rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-off-white flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6 text-light-gray" aria-hidden="true" />
        </div>
        <h3 className="text-navy font-semibold text-sm mb-1">No Tournaments Yet</h3>
        <p className="text-text-muted text-xs mb-4 max-w-xs mx-auto">
          Register for an upcoming tournament to see your events here.
        </p>
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-1.5 text-red text-xs font-semibold hover:text-red-hover transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
        >
          Browse Tournaments <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white shadow-sm border border-light-gray rounded-2xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-red" aria-hidden="true" />
          </div>
          <h2 className="text-navy font-bold text-sm">My Tournaments</h2>
        </div>
        <Link
          href="/tournaments"
          className="text-red text-xs font-semibold hover:text-red-hover transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
        >
          Browse <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
      <div className="divide-y divide-light-gray">
        {registrations.map((reg) => {
          const paidLike = reg.paymentStatus === "paid" || reg.paymentStatus === "waived";
          const statusClass =
            reg.status === "approved"
              ? "bg-emerald-50 text-emerald-600"
              : reg.status === "rejected"
              ? "bg-red/10 text-red"
              : "bg-amber-50 text-amber-600";
          const payClass = paidLike ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600";
          return (
            <Link
              key={reg.id}
              href={`/tournaments/${reg.tournamentId}`}
              className="px-5 py-3 flex items-center justify-between hover:bg-off-white transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
            >
              <div className="min-w-0">
                <p className="text-navy text-sm font-semibold truncate">{reg.tournamentName}</p>
                <p className="text-text-muted text-xs">
                  {reg.teamName}
                  {reg.division ? ` · ${reg.division}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${payClass}`}>
                  {reg.paymentStatus}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass}`}>
                  {reg.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
