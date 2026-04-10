"use client";

import { useState } from "react";
import { Search, UserCheck, Clock, DollarSign, Shield, CreditCard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "staff" | "refs";

const STAFF = [
  { name: "Paisley Brown", role: "Front Desk", shifts: 2, hoursWorked: 12, totalPay: "$180", payMethod: "Venmo", payAccount: "@Ashley-Brown614", lastShift: "Apr 4, 2026" },
  { name: "Brooklyn", role: "Front Desk", shifts: 2, hoursWorked: 12, totalPay: "$180", payMethod: "Cash App", payAccount: "—", lastShift: "Apr 4, 2026" },
  { name: "Jordyn", role: "Player Checkin", shifts: 1, hoursWorked: 6, totalPay: "$90", payMethod: "Cash App", payAccount: "—", lastShift: "Apr 3, 2026" },
  { name: "De Newsom", role: "Front Desk", shifts: 2, hoursWorked: 13, totalPay: "$195", payMethod: "Zelle", payAccount: "4145104948", lastShift: "Apr 4, 2026" },
  { name: "Lyjah", role: "Scoreboard / Snacks", shifts: 3, hoursWorked: 16, totalPay: "$240", payMethod: "Cash App", payAccount: "575-650-8848", lastShift: "Apr 4, 2026" },
  { name: "Khaleal", role: "Scoreboard", shifts: 2, hoursWorked: 11, totalPay: "$165", payMethod: "Cash App", payAccount: "4802278893", lastShift: "Apr 4, 2026" },
  { name: "Kyan", role: "Scoreboard", shifts: 2, hoursWorked: 12, totalPay: "$180", payMethod: "Cash App", payAccount: "+1 (646) 552-6585", lastShift: "Apr 4, 2026" },
  { name: "Domino", role: "Scoreboard", shifts: 1, hoursWorked: 5, totalPay: "$75", payMethod: "Cash App", payAccount: "MTHSports", lastShift: "Apr 3, 2026" },
  { name: "Sean Thomas", role: "Scoreboard", shifts: 1, hoursWorked: 6, totalPay: "$90", payMethod: "Cash App", payAccount: "Seann1t", lastShift: "Apr 4, 2026" },
];

const REFS = [
  { name: "Devin Centers", gamesReffed: 7, totalPay: "$420", payMethod: "—", payAccount: "6024050871", court: "7", lastGame: "Apr 3, 2026" },
  { name: "Brian Garland", gamesReffed: 10, totalPay: "$600", payMethod: "PayPal", payAccount: "brian.garland26@gmail.com", court: "4-6", lastGame: "Apr 4, 2026" },
  { name: "Lloyd Mills", gamesReffed: 5, totalPay: "$300", payMethod: "—", payAccount: "4802806370", court: "4", lastGame: "Apr 3, 2026" },
  { name: "Kamari Hunter", gamesReffed: 11, totalPay: "$660", payMethod: "Zelle", payAccount: "562-445-5950", court: "5-6", lastGame: "Apr 4, 2026" },
  { name: "Dewan Cannon", gamesReffed: 10, totalPay: "$600", payMethod: "—", payAccount: "Cannondewan@gmail.com", court: "5", lastGame: "Apr 4, 2026" },
  { name: "Leslie Melvin", gamesReffed: 5, totalPay: "$300", payMethod: "—", payAccount: "6025053153", court: "5", lastGame: "Apr 3, 2026" },
  { name: "Charles Tyler Lee", gamesReffed: 4, totalPay: "$240", payMethod: "Zelle", payAccount: "9039512681", court: "6", lastGame: "Apr 4, 2026" },
  { name: "Devon Rudolph", gamesReffed: 4, totalPay: "$240", payMethod: "—", payAccount: "3177798141", court: "6", lastGame: "Apr 4, 2026" },
];

export default function StaffPage() {
  const [tab, setTab] = useState<Tab>("staff");
  const [search, setSearch] = useState("");

  const totalStaffPay = STAFF.reduce((s, r) => s + parseInt(r.totalPay.replace(/[$,]/g, "")), 0);
  const totalRefPay = REFS.reduce((s, r) => s + parseInt(r.totalPay.replace(/[$,]/g, "")), 0);
  const totalGames = REFS.reduce((s, r) => s + r.gamesReffed, 0);
  const totalShifts = STAFF.reduce((s, r) => s + r.shifts, 0);

  const filteredStaff = STAFF.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()));
  const filteredRefs = REFS.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Staff & Refs
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Event staff, scorekeepers, and referee management
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Staff</span>
            <Users className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-white">{STAFF.length}</p>
          <p className="text-xs text-text-secondary mt-1">{totalShifts} total shifts</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Referees</span>
            <Shield className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-white">{REFS.length}</p>
          <p className="text-xs text-text-secondary mt-1">{totalGames} total games</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Staff Pay</span>
            <DollarSign className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-accent">${totalStaffPay.toLocaleString()}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Ref Pay</span>
            <CreditCard className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-2xl font-bold text-accent">${totalRefPay.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-bg-secondary border border-border rounded-sm p-1 w-fit">
        <button
          onClick={() => { setTab("staff"); setSearch(""); }}
          className={cn(
            "px-5 py-2 rounded-sm text-sm font-bold uppercase tracking-wider transition-colors",
            tab === "staff" ? "bg-accent text-white" : "text-text-secondary hover:text-white"
          )}
        >
          <UserCheck className="w-4 h-4 inline mr-2" />Event Staff ({STAFF.length})
        </button>
        <button
          onClick={() => { setTab("refs"); setSearch(""); }}
          className={cn(
            "px-5 py-2 rounded-sm text-sm font-bold uppercase tracking-wider transition-colors",
            tab === "refs" ? "bg-accent text-white" : "text-text-secondary hover:text-white"
          )}
        >
          <Shield className="w-4 h-4 inline mr-2" />Referees ({REFS.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "staff" ? "Search staff by name or role..." : "Search referees..."}
          className="w-full bg-bg border border-border rounded-sm pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-secondary/50"
        />
      </div>

      {/* Staff Table */}
      {tab === "staff" && (
        <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Role</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Shifts</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Hours</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Total Pay</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Pay Method</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Account</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Last Shift</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-sm text-xs font-bold uppercase">{s.role}</span>
                    </td>
                    <td className="px-4 py-3 text-white">{s.shifts}</td>
                    <td className="px-4 py-3 text-white">{s.hoursWorked}h</td>
                    <td className="px-4 py-3 text-accent font-bold">{s.totalPay}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.payMethod}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs font-mono">{s.payAccount}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.lastShift}</td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-text-secondary">No staff found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refs Table */}
      {tab === "refs" && (
        <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Games</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Total Pay</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Pay Method</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Account</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Courts</th>
                  <th className="text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3">Last Game</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefs.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-accent/10 text-accent font-bold text-lg">{r.gamesReffed}</span>
                    </td>
                    <td className="px-4 py-3 text-accent font-bold">{r.totalPay}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.payMethod}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs font-mono">{r.payAccount}</td>
                    <td className="px-4 py-3 text-white">{r.court}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.lastGame}</td>
                  </tr>
                ))}
                {filteredRefs.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-secondary">No referees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-text-secondary text-xs mt-3">Data from OFF SZN Session 1 (Apr 3-4) — Connect Notion API for live data</p>
    </div>
  );
}
