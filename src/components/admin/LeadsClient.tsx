"use client";

import { useState } from "react";
import { Search, MessageSquare, Mail, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  name: string;
  email: string;
  phone: string;
  interest: string;
  urgency: string;
  status: string;
  summary: string;
  source: string;
  transcript: string;
  date: string;
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-red-500/10 text-red-400 border-red-500/20",
  Reviewed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Responded: "bg-green-500/10 text-green-400 border-green-500/20",
  Contacted: "bg-green-500/10 text-green-400 border-green-500/20",
  Converted: "bg-accent/10 text-accent border-accent/20",
};

const STATUS_TITLES: Record<string, string> = {
  New: "New lead — not yet reviewed",
  Reviewed: "Lead has been reviewed but not yet contacted",
  Responded: "Lead has responded to outreach",
  Contacted: "Lead has been contacted",
  Converted: "Lead converted to registered team",
};

const URGENCY_COLORS: Record<string, string> = {
  Hot: "bg-red-500/10 text-red-400 border-red-500/20",
  Warm: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Cold: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const URGENCY_TITLES: Record<string, string> = {
  Hot: "Hot — contact immediately, high interest",
  Warm: "Warm — interested, follow up soon",
  Cold: "Cold — low priority or unresponsive",
};

export default function LeadsClient({ leads }: { leads: Lead[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  const statuses = ["All", ...new Set(leads.map((l) => l.status).filter(Boolean))];
  const sources = ["All", ...new Set(leads.map((l) => l.source).filter(Boolean))];

  const filtered = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || l.summary.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || l.status === statusFilter;
    const matchSource = sourceFilter === "All" || l.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  });

  const newCount = leads.filter((l) => l.status === "New").length;
  const chatCount = leads.filter((l) => l.source === "Chat Widget").length;
  const formCount = leads.filter((l) => l.source === "Contact Form").length;

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Leads</span>
          <p className="text-2xl font-bold text-navy mt-2">{leads.length}</p>
        </div>
        <div className="bg-bg-secondary border border-red-500/20 rounded-sm p-4">
          <span className="text-red-400 text-xs font-bold uppercase tracking-wider">New</span>
          <p className="text-2xl font-bold text-red-400 mt-2">{newCount}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Chat</span>
          </div>
          <p className="text-2xl font-bold text-navy mt-2">{chatCount}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Contact Form</span>
          </div>
          <p className="text-2xl font-bold text-navy mt-2">{formCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="w-full bg-bg border border-border rounded-sm pl-10 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/50" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-bg border border-border rounded-sm px-3 py-2.5 text-navy text-sm focus:outline-none focus:border-accent">
          {statuses.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-bg border border-border rounded-sm px-3 py-2.5 text-navy text-sm focus:outline-none focus:border-accent">
          {sources.map((s) => <option key={s} value={s}>{s === "All" ? "All Sources" : s}</option>)}
        </select>
      </div>

      {/* Leads List */}
      <div className="space-y-2">
        {filtered.map((lead, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-bg/50 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                {lead.source === "Contact Form" ? <Mail className="w-3.5 h-3.5 text-accent" /> : <MessageSquare className="w-3.5 h-3.5 text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-navy font-medium truncate">{lead.name}</p>
                <p className="text-text-secondary text-xs truncate">{lead.email} {lead.phone && lead.phone !== "—" ? `• ${lead.phone}` : ""}</p>
              </div>
              <span title={STATUS_TITLES[lead.status]} className={cn("text-xs px-2 py-0.5 rounded-sm border font-bold uppercase tracking-wider flex-shrink-0 cursor-help", STATUS_COLORS[lead.status] || "bg-bg text-text-secondary border-border")}>
                {lead.status}
              </span>
              <span title={URGENCY_TITLES[lead.urgency]} className={cn("text-xs px-2 py-0.5 rounded-sm border font-bold uppercase tracking-wider flex-shrink-0 cursor-help", URGENCY_COLORS[lead.urgency] || "bg-bg text-text-secondary border-border")}>
                {lead.urgency}
              </span>
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-sm flex-shrink-0 hidden sm:block">
                {lead.interest}
              </span>
              <span className="text-text-secondary text-xs flex-shrink-0 hidden md:block">{lead.date}</span>
              {expanded === i ? <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />}
            </button>
            {expanded === i && (
              <div className="px-5 py-4 border-t border-border bg-bg/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Email</p>
                    <p className="text-navy">{lead.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-navy">{lead.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Source</p>
                    <p className="text-navy">{lead.source}</p>
                  </div>
                </div>
                {lead.summary && lead.summary !== "—" && (
                  <div>
                    <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Summary</p>
                    <p className="text-navy text-sm">{lead.summary}</p>
                  </div>
                )}
                {lead.transcript && lead.transcript !== "—" && (
                  <div>
                    <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">Chat Transcript</p>
                    <pre className="text-navy/80 text-xs bg-bg rounded-sm p-3 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{lead.transcript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center text-text-secondary">No leads found</div>
        )}
      </div>

      <p className="text-text-secondary text-xs mt-3">Showing {filtered.length} of {leads.length} leads</p>
    </>
  );
}
