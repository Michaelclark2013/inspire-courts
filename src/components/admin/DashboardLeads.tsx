"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

type Lead = {
  name: string;
  status: string;
};

export default function DashboardLeads() {
  const [counts, setCounts] = useState<{ hot: number; warm: number; cold: number; total: number } | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch("/api/admin/leads");
        if (!res.ok) return;
        const leads: Lead[] = await res.json();
        const hot = leads.filter((l) => /hot/i.test(l.status)).length;
        const warm = leads.filter((l) => /warm/i.test(l.status)).length;
        const cold = leads.filter((l) => /cold/i.test(l.status)).length;
        setCounts({ hot, warm, cold, total: leads.length });
      } catch {}
    }
    fetchLeads();
  }, []);

  if (!counts || counts.total === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">
            Leads Pipeline
          </h3>
        </div>
        <Link
          href="/admin/leads"
          className="flex items-center gap-1 text-text-secondary hover:text-white text-xs transition-colors"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-6 mb-3">
          <div className="text-center">
            <span className="block text-2xl font-bold text-red tabular-nums">{counts.hot}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Hot</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold text-amber-400 tabular-nums">{counts.warm}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Warm</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold text-blue-400 tabular-nums">{counts.cold}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Cold</span>
          </div>
          <div className="ml-auto text-right">
            <span className="block text-2xl font-bold text-white tabular-nums">{counts.total}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Total</span>
          </div>
        </div>
        {/* Pipeline bar */}
        {counts.total > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
            {counts.hot > 0 && <div className="bg-red transition-all" style={{ width: `${(counts.hot / counts.total) * 100}%` }} />}
            {counts.warm > 0 && <div className="bg-amber-400 transition-all" style={{ width: `${(counts.warm / counts.total) * 100}%` }} />}
            {counts.cold > 0 && <div className="bg-blue-400 transition-all" style={{ width: `${(counts.cold / counts.total) * 100}%` }} />}
          </div>
        )}
      </div>
    </div>
  );
}
