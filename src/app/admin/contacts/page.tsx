"use client";

import { useState } from "react";
import { Search, MessageSquare, Mail, Clock, CheckCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  name: string;
  email: string;
  phone: string;
  type: string;
  message: string;
  status: "New" | "Reviewed" | "Responded";
  date: string;
}

const CONTACTS: Contact[] = [
  { name: "No submissions yet", email: "—", phone: "—", type: "—", message: "Contact form submissions will appear here once the site is live and people start reaching out.", status: "New", date: "—" },
];

const STATUS_COLORS: Record<string, string> = {
  New: "bg-red-500/10 text-red-400 border-red-500/20",
  Reviewed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Responded: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  const statuses = ["All", "New", "Reviewed", "Responded"];

  const filtered = CONTACTS.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.message.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Contact Submissions
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Messages from the website contact form
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-secondary border border-red-500/20 rounded-sm p-4 text-center">
          <MessageSquare className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{CONTACTS.filter((c) => c.status === "New").length}</p>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">New</p>
        </div>
        <div className="bg-bg-secondary border border-yellow-500/20 rounded-sm p-4 text-center">
          <Eye className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{CONTACTS.filter((c) => c.status === "Reviewed").length}</p>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Reviewed</p>
        </div>
        <div className="bg-bg-secondary border border-green-500/20 rounded-sm p-4 text-center">
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{CONTACTS.filter((c) => c.status === "Responded").length}</p>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Responded</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or message..."
            className="w-full bg-bg border border-border rounded-sm pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/50"
          />
        </div>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider border transition-colors",
                statusFilter === s
                  ? "bg-accent/10 text-accent border-accent/30"
                  : "bg-bg border-border text-text-secondary hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions */}
      <div className="space-y-2">
        {filtered.map((c, i) => (
          <div
            key={i}
            className="bg-bg-secondary border border-border rounded-sm overflow-hidden hover:border-border/80 transition-colors cursor-pointer"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-white font-medium">{c.name}</p>
                  <span className={cn("inline-block px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider border", STATUS_COLORS[c.status])}>
                    {c.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                  {c.phone !== "—" && <span>{c.phone}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.date}</span>
                </div>
              </div>
              <div className="text-xs text-text-secondary">
                <span className="bg-bg border border-border px-2 py-1 rounded-sm">{c.type}</span>
              </div>
            </div>
            {expanded === i && (
              <div className="px-4 pb-4 border-t border-border/50 pt-3">
                <p className="text-sm text-text-secondary leading-relaxed">{c.message}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State Info */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-sm p-6 text-center">
        <MessageSquare className="w-8 h-8 text-accent mx-auto mb-3" />
        <h3 className="text-white font-bold uppercase tracking-tight mb-2">Contact Form Ready</h3>
        <p className="text-text-secondary text-sm max-w-md mx-auto">
          When visitors submit the contact form on your site, their messages will appear here. Connect your Notion API to store submissions permanently.
        </p>
      </div>
    </div>
  );
}
