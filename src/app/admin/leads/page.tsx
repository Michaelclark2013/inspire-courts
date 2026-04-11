"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Loader2,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Tag,
  RefreshCw,
} from "lucide-react";

type Lead = {
  timestamp: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  source: string;
  status: string;
};

const SOURCE_STYLES: Record<string, string> = {
  "Contact Form": "bg-blue-500/20 text-blue-400",
  "Booking Form": "bg-emerald-500/20 text-emerald-400",
  "Newsletter Subscribe": "bg-purple-500/20 text-purple-400",
  "Chat Widget": "bg-cyan-500/20 text-cyan-400",
  "Website Registration": "bg-red/20 text-red",
  "Google OAuth": "bg-amber-500/20 text-amber-400",
};

const STATUS_STYLES: Record<string, string> = {
  Hot: "bg-red/20 text-red",
  Warm: "bg-amber-500/20 text-amber-400",
  Active: "bg-emerald-500/20 text-emerald-400",
  Cold: "bg-white/10 text-white/40",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const sources = [...new Set(leads.map((l) => l.source).filter(Boolean))];

  const filtered = leads.filter((l) => {
    if (sourceFilter && l.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
            Prospect Pipeline
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {leads.length} total leads from all sources
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Leads
          </p>
          <p className="text-white text-2xl font-bold font-heading">
            {leads.length}
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Hot
          </p>
          <p className="text-red text-2xl font-bold font-heading">
            {leads.filter((l) => l.status === "Hot").length}
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Warm
          </p>
          <p className="text-amber-400 text-2xl font-bold font-heading">
            {leads.filter((l) => l.status === "Warm").length}
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Sources
          </p>
          <p className="text-white text-2xl font-bold font-heading">
            {sources.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-card border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-card border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none focus:border-red cursor-pointer"
        >
          <option value="">All Sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Lead List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading leads...
        </div>
      ) : (
        <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/40 text-[10px] font-bold uppercase tracking-wider px-5 py-3">
                    Name
                  </th>
                  <th className="text-left text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-3">
                    Contact
                  </th>
                  <th className="text-left text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-3">
                    Interest
                  </th>
                  <th className="text-left text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-3">
                    Source
                  </th>
                  <th className="text-left text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-3">
                    Status
                  </th>
                  <th className="text-left text-white/40 text-[10px] font-bold uppercase tracking-wider px-3 py-3">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-white/30"
                    >
                      No leads found
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-white font-semibold">
                        {lead.name || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-0.5">
                          {lead.email && (
                            <div className="flex items-center gap-1 text-white/60 text-xs">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1 text-white/40 text-xs">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-white/50 text-xs">
                        {lead.interest || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${SOURCE_STYLES[lead.source] || "bg-white/10 text-white/40"}`}
                        >
                          {lead.source || "Unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[lead.status] || "bg-white/10 text-white/40"}`}
                        >
                          {lead.status || "New"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-white/30 text-xs whitespace-nowrap">
                        {lead.timestamp
                          ? new Date(lead.timestamp).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
