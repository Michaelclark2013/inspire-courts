"use client";

import { useState } from "react";
import { Search, Users, Flame, Phone, Mail, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const TEAMS = [
  { teamName: "Downtown Bang", coach: "—", phone: "—", age: "16U", gender: "Boys", status: "Registered", outreach: "Registered", source: "Returning" },
  { teamName: "Downtown Bang Blue", coach: "—", phone: "—", age: "16U", gender: "Boys", status: "Registered", outreach: "Registered", source: "Returning" },
  { teamName: "Downtown Bang White", coach: "—", phone: "—", age: "16U", gender: "Boys", status: "Registered", outreach: "Registered", source: "Returning" },
  { teamName: "NDO", coach: "—", phone: "—", age: "17U", gender: "Boys", status: "Hot", outreach: "Contacted", source: "Returning" },
  { teamName: "NDO Elite", coach: "—", phone: "—", age: "16U", gender: "Boys", status: "Hot", outreach: "Contacted", source: "Returning" },
  { teamName: "Monstarz", coach: "—", phone: "—", age: "17U", gender: "Boys", status: "Registered", outreach: "Registered", source: "Returning" },
  { teamName: "Monstarz 13U", coach: "—", phone: "—", age: "13U", gender: "Boys", status: "Registered", outreach: "Registered", source: "Returning" },
  { teamName: "Hoop Dreams", coach: "—", phone: "—", age: "16U", gender: "Boys", status: "Warm", outreach: "Contacted", source: "Referral" },
  { teamName: "QC Elite", coach: "—", phone: "—", age: "17U", gender: "Boys", status: "Warm", outreach: "Contacted", source: "Referral" },
  { teamName: "Santan Dawgs", coach: "—", phone: "—", age: "17U", gender: "Boys", status: "Registered", outreach: "Registered", source: "Returning" },
  { teamName: "Showtime", coach: "—", phone: "—", age: "13U", gender: "Boys", status: "Warm", outreach: "Contacted", source: "Cold Outreach" },
  { teamName: "All-AZ", coach: "—", phone: "—", age: "13U", gender: "Boys", status: "Registered", outreach: "Registered", source: "Returning" },
  { teamName: "Southside Yucky Buckets", coach: "—", phone: "—", age: "13U", gender: "Boys", status: "Warm", outreach: "Contacted", source: "Cold Outreach" },
  { teamName: "Reach", coach: "—", phone: "—", age: "16U", gender: "Boys", status: "Warm", outreach: "Contacted", source: "Cold Outreach" },
  { teamName: "Hoop & Bat", coach: "—", phone: "—", age: "17U", gender: "Boys", status: "Warm", outreach: "Contacted", source: "Cold Outreach" },
  { teamName: "Inspire 16U", coach: "—", phone: "—", age: "16U", gender: "Boys", status: "Registered", outreach: "Registered", source: "Internal" },
  { teamName: "Inspire 17U", coach: "—", phone: "—", age: "17U", gender: "Boys", status: "Registered", outreach: "Registered", source: "Internal" },
];

const STATUS_COLORS: Record<string, string> = {
  Hot: "bg-red-500/10 text-red-400 border-red-500/20",
  Warm: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Cold: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Registered: "bg-green-500/10 text-green-400 border-green-500/20",
  "Not Contacted": "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");

  const statuses = ["All", ...new Set(TEAMS.map((t) => t.status))];
  const ages = ["All", ...new Set(TEAMS.map((t) => t.age).sort())];

  const filtered = TEAMS.filter((t) => {
    const matchSearch = t.teamName.toLowerCase().includes(search.toLowerCase()) || t.coach.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchAge = ageFilter === "All" || t.age === ageFilter;
    return matchSearch && matchStatus && matchAge;
  });

  const hotCount = TEAMS.filter((t) => t.status === "Hot").length;
  const warmCount = TEAMS.filter((t) => t.status === "Warm").length;
  const registeredCount = TEAMS.filter((t) => t.status === "Registered").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Teams & Pipeline
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Coach & Team Database — track leads and registrations
        </p>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total</span>
            <Users className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-white">{TEAMS.length}</p>
        </div>
        <div className="bg-bg-secondary border border-red-500/20 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Hot</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{hotCount}</p>
        </div>
        <div className="bg-bg-secondary border border-yellow-500/20 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Warm</span>
            <Phone className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">{warmCount}</p>
        </div>
        <div className="bg-bg-secondary border border-green-500/20 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Registered</span>
            <Mail className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{registeredCount}</p>
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
            placeholder="Search teams or coaches..."
            className="w-full bg-bg border border-border rounded-sm pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg border border-border rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
          ))}
        </select>
        <select
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="bg-bg border border-border rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
        >
          {ages.map((a) => (
            <option key={a} value={a}>{a === "All" ? "All Ages" : a}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Team</th>
                <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Age</th>
                <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Gender</th>
                <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Outreach</th>
                <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{t.teamName}</td>
                  <td className="px-4 py-3 text-white">{t.age}</td>
                  <td className="px-4 py-3 text-white">{t.gender}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-block px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider border", STATUS_COLORS[t.status] || "bg-bg text-text-secondary border-border")}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{t.outreach}</td>
                  <td className="px-4 py-3 text-text-secondary">{t.source}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">No teams found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-text-secondary text-xs mt-3">Showing {filtered.length} of {TEAMS.length} teams — Connect Notion API for live data</p>
    </div>
  );
}
