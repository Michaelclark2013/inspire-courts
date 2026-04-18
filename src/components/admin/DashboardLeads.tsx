"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

type Lead = {
  name: string;
  status: string;
};

export default function DashboardLeads() {
  const [counts, setCounts] = useState<{ hot: number; warm: number; cold: number; total: number } | null>(null);
  const [error, setError] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/leads");
      if (!res.ok) return;
      const leads: Lead[] = await res.json();
      const hot = leads.filter((l) => /hot/i.test(l.status)).length;
      const warm = leads.filter((l) => /warm/i.test(l.status)).length;
      const cold = leads.filter((l) => /cold/i.test(l.status)).length;
      setCounts({ hot, warm, cold, total: leads.length });
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  if (error) {
    return (
      <div className="bg-off-white border border-border rounded-sm p-5 text-center">
        <p className="text-text-secondary text-xs mb-2">Unable to load leads</p>
        <button onClick={() => { setError(false); fetchLeads(); }} className="text-red text-xs font-bold uppercase tracking-wider hover:text-red-hover transition-colors">Retry</button>
      </div>
    );
  }

  if (!counts || counts.total === 0) return null;

  return (
    <div className="bg-off-white border border-border rounded-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-600" aria-hidden="true" />
          <h3 className="text-navy font-bold text-xs uppercase tracking-wider">
            Leads Pipeline
          </h3>
        </div>
        <Link
          href="/admin/leads"
          className="flex items-center gap-1 text-text-secondary hover:text-navy text-xs transition-colors"
        >
          View All <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-6 mb-3">
          <Link href="/admin/leads?status=hot" className="text-center group">
            <span className="block text-2xl font-bold text-red tabular-nums group-hover:scale-110 transition-transform inline-block">{counts.hot}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Hot</span>
          </Link>
          <Link href="/admin/leads?status=warm" className="text-center group">
            <span className="block text-2xl font-bold text-amber-600 tabular-nums group-hover:scale-110 transition-transform inline-block">{counts.warm}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Warm</span>
          </Link>
          <Link href="/admin/leads?status=cold" className="text-center group">
            <span className="block text-2xl font-bold text-blue-600 tabular-nums group-hover:scale-110 transition-transform inline-block">{counts.cold}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Cold</span>
          </Link>
          <div className="ml-auto text-right">
            <span className="block text-2xl font-bold text-navy tabular-nums">{counts.total}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Total</span>
          </div>
        </div>
        {/* Pipeline bar */}
        {counts.total > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden bg-light-gray">
            {counts.hot > 0 && <div className="bg-red transition-all" style={{ width: `${(counts.hot / counts.total) * 100}%` }} />}
            {counts.warm > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${(counts.warm / counts.total) * 100}%` }} />}
            {counts.cold > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${(counts.cold / counts.total) * 100}%` }} />}
          </div>
        )}
      </div>
    </div>
  );
}
