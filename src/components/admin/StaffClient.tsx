"use client";

import { useState, useMemo } from "react";
import { Search  , DollarSign, Shield, Users, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SortDir = "asc" | "desc";

type Tab = "staff" | "refs";

interface StaffMember {
  name: string;
  role: string;
  shifts: number;
  hoursWorked: number;
  totalPay: string;
  payMethod: string;
  payAccount: string;
  lastShift: string;
}

interface Referee {
  name: string;
  gamesReffed: number;
  totalPay: string;
  payMethod: string;
  payAccount: string;
  court: string;
  lastGame: string;
}

function maskAccount(account: string): string {
  if (!account || account === "—") return "—";
  if (account.length <= 4) return "****";
  return "****" + account.slice(-4);
}

export default function StaffClient({ staff, refs }: { staff: StaffMember[]; refs: Referee[] }) {
  const [tab, setTab] = useState<Tab>("staff");
  const [search, setSearch] = useState("");
  const [showAccounts, setShowAccounts] = useState<Set<string>>(new Set());
  const [staffSort, setStaffSort] = useState<{ key: keyof StaffMember; dir: SortDir }>({ key: "totalPay", dir: "desc" });
  const [refSort, setRefSort] = useState<{ key: keyof Referee; dir: SortDir }>({ key: "totalPay", dir: "desc" });

  function toggleStaffSort(key: keyof StaffMember) {
    setStaffSort((s) => s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" });
  }
  function toggleRefSort(key: keyof Referee) {
    setRefSort((s) => s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" });
  }
  function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active) return <ChevronDown className="w-3 h-3 opacity-40 inline ml-1" aria-hidden="true" />;
    return dir === "asc"
      ? <ChevronUp className="w-3 h-3 text-red inline ml-1" aria-hidden="true" />
      : <ChevronDown className="w-3 h-3 text-red inline ml-1" aria-hidden="true" />;
  }

  const totalStaffPay = staff.reduce((s, r) => s + parseInt(r.totalPay.replace(/[$,]/g, "") || "0"), 0);
  const totalRefPay = refs.reduce((s, r) => s + parseInt(r.totalPay.replace(/[$,]/g, "") || "0"), 0);
  const totalGames = refs.reduce((s, r) => s + r.gamesReffed, 0);
  const totalShifts = staff.reduce((s, r) => s + r.shifts, 0);

  const filteredStaff = useMemo(() => {
    const base = staff.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()));
    return [...base].sort((a, b) => {
      const av = a[staffSort.key];
      const bv = b[staffSort.key];
      const numA = typeof av === "string" ? parseFloat(av.replace(/[$,]/g, "")) || 0 : (av as number);
      const numB = typeof bv === "string" ? parseFloat(bv.replace(/[$,]/g, "")) || 0 : (bv as number);
      if (!isNaN(numA) && !isNaN(numB)) return staffSort.dir === "desc" ? numB - numA : numA - numB;
      return staffSort.dir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }, [staff, search, staffSort]);

  const filteredRefs = useMemo(() => {
    const base = refs.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
    return [...base].sort((a, b) => {
      const av = a[refSort.key];
      const bv = b[refSort.key];
      const numA = typeof av === "string" ? parseFloat(av.replace(/[$,]/g, "")) || 0 : (av as number);
      const numB = typeof bv === "string" ? parseFloat(bv.replace(/[$,]/g, "")) || 0 : (bv as number);
      if (!isNaN(numA) && !isNaN(numB)) return refSort.dir === "desc" ? numB - numA : numA - numB;
      return refSort.dir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }, [refs, search, refSort]);

  const toggleAccount = (key: string) => {
    setShowAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-off-white border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Staff</span>
            <Users className="w-4 h-4 text-text-secondary" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-navy">{staff.length}</p>
          <p className="text-text-secondary text-xs mt-1">{totalShifts} total shifts</p>
        </div>
        <div className="bg-off-white border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Referees</span>
            <Shield className="w-4 h-4 text-text-secondary" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-navy">{refs.length}</p>
          <p className="text-text-secondary text-xs mt-1">{totalGames} total games</p>
        </div>
        <div className="bg-off-white border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Staff Pay</span>
            <DollarSign className="w-4 h-4 text-text-secondary" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-navy">${totalStaffPay.toLocaleString()}</p>
        </div>
        <div className="bg-off-white border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Ref Pay</span>
            <DollarSign className="w-4 h-4 text-text-secondary" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-navy">${totalRefPay.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab("staff"); setSearch(""); }} className={cn("px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-wider border transition-colors", tab === "staff" ? "bg-red/10 text-red border-red/30" : "bg-white border-border text-text-secondary hover:text-navy")}>
          Event Staff ({staff.length})
        </button>
        <button onClick={() => { setTab("refs"); setSearch(""); }} className={cn("px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-wider border transition-colors", tab === "refs" ? "bg-red/10 text-red border-red/30" : "bg-white border-border text-text-secondary hover:text-navy")}>
          Referees ({refs.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" aria-hidden="true" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab === "staff" ? "staff" : "referees"}...`} className="w-full bg-white border border-border rounded-sm pl-10 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-colors placeholder:text-text-secondary/50" />
      </div>

      {/* Table */}
      <div className="bg-off-white border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "staff" ? (
            <table className="w-full text-sm">
              <caption className="sr-only">Staff members</caption>
              <thead>
                <tr className="border-b border-border">
                  {(["name","role","shifts","hoursWorked","totalPay","payMethod","payAccount","lastShift"] as (keyof StaffMember)[]).map((k) => {
                    const labels: Record<string, string> = { name: "Name", role: "Role", shifts: "Shifts", hoursWorked: "Hours", totalPay: "Pay", payMethod: "Method", payAccount: "Account", lastShift: "Last Shift" };
                    const sortable = ["name","shifts","hoursWorked","totalPay"].includes(k);
                    return (
                      <th key={k} onClick={sortable ? () => toggleStaffSort(k) : undefined} className={cn("text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3", sortable && "cursor-pointer hover:text-navy transition-colors select-none")}>
                        {labels[k]}{sortable && <SortIcon active={staffSort.key === k} dir={staffSort.dir} />}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-off-white transition-colors">
                    <td className="px-4 py-3 text-navy font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.role}</td>
                    <td className="px-4 py-3 text-navy">{s.shifts}</td>
                    <td className="px-4 py-3 text-navy">{s.hoursWorked}</td>
                    <td className="px-4 py-3 text-red font-medium">{s.totalPay}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.payMethod}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{showAccounts.has(`s-${i}`) ? s.payAccount : maskAccount(s.payAccount)}</span>
                        {s.payAccount && s.payAccount !== "—" && (
                          <button onClick={() => toggleAccount(`s-${i}`)} className="text-text-secondary hover:text-navy inline-flex items-center justify-center min-w-[44px] min-h-[44px] -my-3 -mx-2" title={showAccounts.has(`s-${i}`) ? "Hide" : "Show"} aria-label={showAccounts.has(`s-${i}`) ? "Hide account" : "Show account"}>
                            {showAccounts.has(`s-${i}`) ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                          </button>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{s.lastShift}</td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-text-secondary">No staff found</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">Referees</caption>
              <thead>
                <tr className="border-b border-border">
                  {(["name","gamesReffed","totalPay","payMethod","payAccount","court","lastGame"] as (keyof Referee)[]).map((k) => {
                    const labels: Record<string, string> = { name: "Name", gamesReffed: "Games", totalPay: "Pay", payMethod: "Method", payAccount: "Account", court: "Court", lastGame: "Last Game" };
                    const sortable = ["name","gamesReffed","totalPay"].includes(k);
                    return (
                      <th key={k} onClick={sortable ? () => toggleRefSort(k) : undefined} className={cn("text-left text-text-secondary text-xs font-bold uppercase tracking-wider px-4 py-3", sortable && "cursor-pointer hover:text-navy transition-colors select-none")}>
                        {labels[k]}{sortable && <SortIcon active={refSort.key === k} dir={refSort.dir} />}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredRefs.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-off-white transition-colors">
                    <td className="px-4 py-3 text-navy font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-navy">{r.gamesReffed}</td>
                    <td className="px-4 py-3 text-red font-medium">{r.totalPay}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.payMethod}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{showAccounts.has(`r-${i}`) ? r.payAccount : maskAccount(r.payAccount)}</span>
                        {r.payAccount && r.payAccount !== "—" && (
                          <button onClick={() => toggleAccount(`r-${i}`)} className="text-text-secondary hover:text-navy inline-flex items-center justify-center min-w-[44px] min-h-[44px] -my-3 -mx-2" title={showAccounts.has(`r-${i}`) ? "Hide" : "Show"} aria-label={showAccounts.has(`r-${i}`) ? "Hide account" : "Show account"}>
                            {showAccounts.has(`r-${i}`) ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                          </button>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy">{r.court}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.lastGame}</td>
                  </tr>
                ))}
                {filteredRefs.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-text-secondary">No referees found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
