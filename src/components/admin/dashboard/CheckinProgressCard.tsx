"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  CircleOff,
  Mail,
  Phone,
  Search,
  Filter,
  Send,
  Download,
} from "lucide-react";

type Team = {
  id: number;
  teamName: string;
  division: string | null;
  coachName: string;
  coachEmail: string;
  coachPhone: string | null;
  playerCount: number;
  checkedIn: number;
  percent: number;
  rosterSubmitted: boolean;
  waiversSigned: boolean;
  paymentStatus: string;
  registrationStatus: string;
  latestCheckinAt: string | null;
  complete: boolean;
};

type Totals = {
  teams: number;
  complete: number;
  partial: number;
  none: number;
  rosterSubmitted: number;
  waiversSigned: number;
  paymentsPending: number;
};

type Payload = {
  tournament: { id: number; name: string; status: string; startDate: string } | null;
  teams: Team[];
  totals: Totals | null;
};

function fmtRel(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CheckinProgressCard() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "complete" | "partial" | "none">("all");
  const [search, setSearch] = useState("");
  const [nudging, setNudging] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState<string | null>(null);

  async function nudgeIncomplete() {
    if (!data?.tournament) return;
    const incompleteIds = (data.teams || []).filter((t) => !t.complete).map((t) => t.id);
    if (incompleteIds.length === 0) {
      setNudgeMsg("Nothing to send — all teams are complete.");
      return;
    }
    if (!confirm(`Email ${incompleteIds.length} coach${incompleteIds.length === 1 ? "" : "es"} whose team hasn't finished check-in?`)) return;
    setNudging(true);
    setNudgeMsg(null);
    try {
      const res = await fetch("/api/admin/checkin-progress/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: data.tournament.id, teamIds: incompleteIds }),
      });
      if (!res.ok) throw new Error("Failed");
      const body = await res.json();
      setNudgeMsg(`Sent ${body.sent || 0} email${body.sent === 1 ? "" : "s"}.`);
      setTimeout(() => setNudgeMsg(null), 5000);
    } catch (err) {
      setNudgeMsg((err as Error).message);
    } finally {
      setNudging(false);
    }
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/checkin-progress");
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 45_000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    return data.teams.filter((t) => {
      if (filter === "complete" && !t.complete) return false;
      if (filter === "partial" && (t.complete || t.checkedIn === 0)) return false;
      if (filter === "none" && t.checkedIn !== 0) return false;
      if (!s) return true;
      return (
        t.teamName.toLowerCase().includes(s) ||
        t.coachName.toLowerCase().includes(s) ||
        (t.division || "").toLowerCase().includes(s)
      );
    });
  }, [data, filter, search]);

  if (loading || !data) return null;
  if (!data.tournament) {
    // No active tournament → skip the card entirely so the dashboard
    // stays quiet on non-event days.
    return null;
  }

  const totals = data.totals!;

  return (
    <section aria-label="Team check-in progress" className="mb-8">
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-red" aria-hidden="true" />
              <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Team Check-In Progress</h2>
            </div>
            <p className="text-text-muted text-xs truncate">
              {data.tournament.name} · {totals.complete}/{totals.teams} teams complete
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => exportCsv(data)}
              disabled={data.teams.length === 0}
              className="bg-white border border-border hover:bg-off-white disabled:opacity-40 text-navy text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1"
              title="Download check-in progress as CSV"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button
              onClick={nudgeIncomplete}
              disabled={nudging || (totals.teams - totals.complete) === 0}
              className="bg-red hover:bg-red-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1"
              title="Email every coach whose team hasn't completed check-in"
            >
              <Send className="w-3 h-3" />
              {nudging ? "Sending…" : "Nudge"}
            </button>
            <Link href="/admin/checkin" className="text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1 rounded">
              Open check-in <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {nudgeMsg && (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-700 text-xs font-semibold">
            {nudgeMsg}
          </div>
        )}

        {/* Global progress strip */}
        <div className="px-5 pt-4">
          <div className="w-full bg-off-white rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${totals.teams > 0 ? (totals.complete / totals.teams) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-text-muted mt-2 flex-wrap">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> {totals.complete} complete</span>
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-600" /> {totals.partial} partial</span>
            <span className="flex items-center gap-1"><CircleOff className="w-3 h-3 text-red" /> {totals.none} not started</span>
            <span className="ml-auto">
              Rosters {totals.rosterSubmitted}/{totals.teams} · Waivers {totals.waiversSigned}/{totals.teams} · Payments pending {totals.paymentsPending}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team, coach, division"
              className="w-full bg-off-white border border-border rounded-xl pl-9 pr-4 py-2 text-navy text-sm focus:outline-none focus:border-red/60"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <Filter className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden="true" />
            {([
              ["all", "All"],
              ["complete", `Complete (${totals.complete})`],
              ["partial", `Partial (${totals.partial})`],
              ["none", `Not started (${totals.none})`],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                aria-pressed={filter === k}
                className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1 ${
                  filter === k ? "bg-navy text-white" : "bg-off-white text-text-muted hover:bg-border"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Team grid */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            {data.teams.length === 0 ? "No teams registered yet." : "No teams match this filter."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => {
              const target = t.playerCount || 5;
              const pct = Math.min(100, Math.round((t.checkedIn / target) * 100));
              const statusCls = t.complete
                ? "bg-emerald-50 text-emerald-700"
                : t.checkedIn > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-red/10 text-red";
              const statusLabel = t.complete ? "Complete" : t.checkedIn > 0 ? "Partial" : "Not started";
              return (
                <li key={t.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-navy font-bold text-sm truncate">{t.teamName}</p>
                      {t.division && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-off-white text-text-muted">
                          {t.division}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-text-muted text-xs truncate">
                      {t.coachName}
                      {t.latestCheckinAt && <> · last in {fmtRel(t.latestCheckinAt)}</>}
                    </p>
                    {/* Checklist of missing pieces */}
                    <div className="flex items-center gap-3 text-[11px] text-text-muted mt-1 flex-wrap">
                      <Flag label="Roster" good={t.rosterSubmitted} />
                      <Flag label="Waivers" good={t.waiversSigned} />
                      <Flag label="Payment" good={t.paymentStatus !== "pending"} />
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 w-28">
                    <p className="text-navy font-heading font-bold text-xl tabular-nums">
                      {t.checkedIn}
                      <span className="text-text-muted text-xs font-normal">/{target}</span>
                    </p>
                    <div className="w-full bg-off-white rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-full ${t.complete ? "bg-emerald-500" : t.checkedIn > 0 ? "bg-amber-500" : "bg-red/40"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-text-muted text-[10px] mt-0.5">{pct}%</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                    {t.coachEmail && (
                      <a
                        href={`mailto:${t.coachEmail}`}
                        aria-label="Email coach"
                        className="p-2 rounded-lg text-text-muted hover:bg-off-white hover:text-navy"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {t.coachPhone && (
                      <a
                        href={`tel:${t.coachPhone.replace(/\D/g, "")}`}
                        aria-label="Call coach"
                        className="p-2 rounded-lg text-text-muted hover:bg-off-white hover:text-navy"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function exportCsv(data: Payload) {
  if (!data) return;
  const header = ["Team", "Division", "Coach", "Email", "Phone", "Checked In", "Target", "Percent", "Roster", "Waivers", "Payment", "Status"];
  const lines = data.teams.map((t) => [
    t.teamName,
    t.division || "",
    t.coachName,
    t.coachEmail,
    t.coachPhone || "",
    t.checkedIn,
    t.playerCount || 0,
    t.percent,
    t.rosterSubmitted ? "yes" : "no",
    t.waiversSigned ? "yes" : "no",
    t.paymentStatus,
    t.complete ? "complete" : t.checkedIn > 0 ? "partial" : "not started",
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `checkin-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Flag({ label, good }: { label: string; good: boolean }) {
  return (
    <span className={`flex items-center gap-1 ${good ? "text-emerald-600" : "text-red"}`}>
      {good ? <CheckCircle2 className="w-3 h-3" /> : <CircleOff className="w-3 h-3" />}
      {label}
    </span>
  );
}
