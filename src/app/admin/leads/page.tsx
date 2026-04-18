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
import { SELECT_CLASS } from "@/lib/form-styles";

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
  "Contact Form": "bg-blue-50 text-blue-600",
  "Booking Form": "bg-emerald-50 text-emerald-600",
  "Newsletter Subscribe": "bg-purple-50 text-purple-600",
  "Chat Widget": "bg-cyan-50 text-cyan-600",
  "Website Registration": "bg-red/10 text-red",
  "Google OAuth": "bg-amber-50 text-amber-600",
};

const STATUS_STYLES: Record<string, string> = {
  Hot: "bg-red/10 text-red",
  Warm: "bg-amber-50 text-amber-600",
  Active: "bg-emerald-50 text-emerald-600",
  Cold: "bg-slate-100 text-slate-500",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/admin/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
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
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Prospect Pipeline
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {leads.length} total leads from all sources
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLeads}
          className="flex items-center gap-2 text-navy/50 hover:text-navy text-xs font-semibold uppercase tracking-wider px-4 py-2 border border-border rounded-lg hover:border-navy/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-navy/20">
          <p className="text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Leads
          </p>
          <p className="text-navy text-2xl font-bold font-heading">
            {leads.length}
          </p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-navy/20">
          <p className="text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1">
            Hot
          </p>
          <p className="text-red text-2xl font-bold font-heading">
            {leads.filter((l) => l.status === "Hot").length}
          </p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-navy/20">
          <p className="text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1">
            Warm
          </p>
          <p className="text-amber-600 text-2xl font-bold font-heading">
            {leads.filter((l) => l.status === "Warm").length}
          </p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-navy/20">
          <p className="text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1">
            Sources
          </p>
          <p className="text-navy text-2xl font-bold font-heading">
            {sources.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            aria-label="Search leads"
            className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-gray-400"
          />
        </div>
        <select
          value={sourceFilter}
          aria-label="Filter by lead source"
          onChange={(e) => setSourceFilter(e.target.value)}
          className={SELECT_CLASS}
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
        <div className="flex items-center justify-center py-16 text-navy/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading leads...
        </div>
      ) : fetchError ? (
        <div className="bg-red/10 border border-red/20 rounded-xl p-8 text-center">
          <TrendingUp className="w-10 h-10 text-red/40 mx-auto mb-3" />
          <h3 className="text-navy font-semibold mb-1">Failed to Load Leads</h3>
          <p className="text-text-secondary text-sm mb-4">Could not fetch lead data. Check your connection or try again.</p>
          <button
            type="button"
            onClick={fetchLeads}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Prospect pipeline leads</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left text-navy/60 text-[10px] font-bold uppercase tracking-wider px-5 py-3">
                    Name
                  </th>
                  <th scope="col" className="text-left text-navy/60 text-[10px] font-bold uppercase tracking-wider px-3 py-3">
                    Contact
                  </th>
                  <th scope="col" className="text-left text-navy/60 text-[10px] font-bold uppercase tracking-wider px-3 py-3 hidden md:table-cell">
                    Interest
                  </th>
                  <th scope="col" className="text-left text-navy/60 text-[10px] font-bold uppercase tracking-wider px-3 py-3">
                    Source
                  </th>
                  <th scope="col" className="text-left text-navy/60 text-[10px] font-bold uppercase tracking-wider px-3 py-3 hidden lg:table-cell">
                    Status
                  </th>
                  <th scope="col" className="text-left text-navy/60 text-[10px] font-bold uppercase tracking-wider px-3 py-3 hidden md:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-navy/30"
                    >
                      No leads found
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead, i) => (
                    <tr key={i} className="hover:bg-off-white cursor-pointer" tabIndex={0} onClick={() => setExpandedLead(expandedLead === i ? null : i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedLead(expandedLead === i ? null : i); } }}>
                      <td className="px-5 py-3 text-navy font-semibold">
                        {lead.name || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-0.5">
                          {lead.email && (
                            <div className="flex items-center gap-1 text-navy/60 text-xs">
                              <Mail className="w-3 h-3" />
                              <span className="hidden sm:inline">{lead.email}</span>
                              <span className="sm:hidden">Email</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1 text-navy/40 text-xs">
                              <Phone className="w-3 h-3" />
                              <span className="hidden sm:inline">{lead.phone}</span>
                              <span className="sm:hidden">Phone</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-navy/50 text-xs hidden md:table-cell">
                        {lead.interest || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${SOURCE_STYLES[lead.source] || "bg-slate-100 text-slate-500"}`}
                        >
                          {lead.source || "Unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[lead.status] || "bg-slate-100 text-slate-500"}`}
                        >
                          {lead.status || "New"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-navy/30 text-xs whitespace-nowrap hidden md:table-cell">
                        {lead.timestamp
                          ? new Date(lead.timestamp).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )
                          : "—"}
                      </td>
                    </tr>
                  )).flatMap((row, i) => {
                    const lead = filtered[i];
                    if (expandedLead !== i) return [row];
                    return [row, (
                      <tr key={`${i}-detail`} className="bg-off-white">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <p className="text-navy/60 uppercase tracking-wider mb-1">Email</p>
                              <p className="text-navy">{lead.email || "—"}</p>
                            </div>
                            <div>
                              <p className="text-navy/60 uppercase tracking-wider mb-1">Phone</p>
                              <p className="text-navy">{lead.phone || "—"}</p>
                            </div>
                            <div>
                              <p className="text-navy/60 uppercase tracking-wider mb-1">Date</p>
                              <p className="text-navy">{lead.timestamp ? new Date(lead.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</p>
                            </div>
                            <div>
                              <p className="text-navy/60 uppercase tracking-wider mb-1">Interest</p>
                              <p className="text-navy">{lead.interest || "—"}</p>
                            </div>
                            <div>
                              <p className="text-navy/60 uppercase tracking-wider mb-1">Source</p>
                              <p className="text-navy">{lead.source || "Unknown"}</p>
                            </div>
                            <div>
                              <p className="text-navy/60 uppercase tracking-wider mb-1">Status</p>
                              <p className="text-navy">{lead.status || "New"}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )];
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
