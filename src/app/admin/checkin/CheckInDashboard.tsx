"use client";

import { useState } from "react";
import {
  UserCheck,
  Loader2,
  CheckCircle2,
  Search,
  Users,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

interface TeamStatus {
  teamName: string;
  coach: string;
  division: string;
  paymentStatus: string;
  checkedInPlayers: string[];
  checkedInCount: number;
  hasCheckedIn: boolean;
  isPaid: boolean;
}

interface Props {
  teams: TeamStatus[];
  checkedInTeamCount: number;
  totalTeams: number;
  totalPlayerCheckins: number;
  today: string;
}

export default function CheckInDashboard({
  teams,
  checkedInTeamCount,
  totalTeams,
  totalPlayerCheckins,
  today,
}: Props) {
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [division, setDivision] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState("");
  const [recentCheckins, setRecentCheckins] = useState<
    { name: string; team: string; time: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "checked" | "not">(
    "all"
  );
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setCheckInError("");

    const res = await fetch("/api/admin/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName, teamName, division }),
    });

    if (res.ok) {
      setRecentCheckins((prev) => [
        {
          name: playerName,
          team: teamName,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setPlayerName("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } else {
      const data = await res.json().catch(() => ({}));
      setCheckInError(data.error || "Check-in failed — please try again");
    }
    setSaving(false);
  }

  // Get unique divisions for filter
  const divisions = [...new Set(teams.map((t) => t.division))].sort();

  // Filter teams
  const filteredTeams = teams.filter((t) => {
    if (filterStatus === "checked" && !t.hasCheckedIn) return false;
    if (filterStatus === "not" && t.hasCheckedIn) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.teamName.toLowerCase().includes(q) ||
        t.coach.toLowerCase().includes(q) ||
        t.division.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Game Day Check-In
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {today} &middot; Team &amp; player check-in status
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-navy/50 hover:text-navy text-xs font-semibold uppercase tracking-wider px-4 py-2 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-navy/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Teams Checked In
          </p>
          <p className="text-navy text-2xl font-bold font-heading">
            {checkedInTeamCount}
            <span className="text-navy/30 text-lg">/{totalTeams}</span>
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-navy/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Players Today
          </p>
          <p className="text-navy text-2xl font-bold font-heading">
            {totalPlayerCheckins + recentCheckins.length}
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-navy/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Not Checked In
          </p>
          <p className="text-red text-2xl font-bold font-heading">
            {totalTeams - checkedInTeamCount}
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-navy/40 text-xs font-semibold uppercase tracking-wider mb-1">
            This Session
          </p>
          <p className="text-emerald-400 text-2xl font-bold font-heading">
            {recentCheckins.length}
          </p>
        </div>
      </div>

      {/* Check-in progress bar */}
      {totalTeams > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-navy/40 font-semibold uppercase tracking-wider">Check-in Progress</span>
            <span className="text-navy font-bold tabular-nums">
              {checkedInTeamCount}/{totalTeams} teams &middot; {Math.round((checkedInTeamCount / totalTeams) * 100)}%
            </span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${checkedInTeamCount === totalTeams ? "bg-emerald-400" : "bg-red"}`}
              style={{ width: `${Math.round((checkedInTeamCount / totalTeams) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Two columns: Team Status + Check-In Form */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Team Status List (2/3 width) */}
        <div className="xl:col-span-2 bg-card border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Users className="w-4 h-4 text-red" />
              <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
                Team Status
              </h2>
            </div>
            <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy/30" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  aria-label="Search teams"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-navy border border-white/10 rounded-lg pl-9 pr-3 py-2 text-navy text-xs focus:outline-none focus:border-red transition-all placeholder:text-navy/25"
                />
              </div>
              <select
                value={filterStatus}
                aria-label="Filter by check-in status"
                onChange={(e) =>
                  setFilterStatus(e.target.value as "all" | "checked" | "not")
                }
                className="bg-navy border border-white/10 rounded-lg px-3 py-2 text-navy text-xs cursor-pointer focus:outline-none focus:border-red"
              >
                <option value="all">All</option>
                <option value="checked">Checked In</option>
                <option value="not">Not Checked In</option>
              </select>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto divide-y divide-white/5">
            {filteredTeams.length === 0 ? (
              <div className="px-5 py-8 text-center text-navy/30 text-sm">
                No teams found
              </div>
            ) : (
              filteredTeams.map((team) => (
                <div key={team.teamName}>
                  <button
                    onClick={() =>
                      setExpandedTeam(
                        expandedTeam === team.teamName
                          ? null
                          : team.teamName
                      )
                    }
                    className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    {/* Status dot */}
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        team.hasCheckedIn
                          ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                          : "bg-red shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                      }`}
                    />

                    {/* Team info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-navy text-sm font-semibold truncate">
                          {team.teamName}
                        </p>
                        {!team.isPaid && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">
                            Unpaid
                          </span>
                        )}
                      </div>
                      <p className="text-navy/40 text-xs truncate">
                        {team.coach} &middot; {team.division}
                      </p>
                    </div>

                    {/* Player count */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {team.checkedInCount > 0 && (
                        <span className="text-emerald-400 text-xs font-bold">
                          {team.checkedInCount} player
                          {team.checkedInCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-navy/30 transition-transform ${
                          expandedTeam === team.teamName ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded: show checked-in players */}
                  {expandedTeam === team.teamName && (
                    <div className="px-5 pb-3 pl-11">
                      {team.checkedInPlayers.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {team.checkedInPlayers.map((p, i) => (
                            <span
                              key={i}
                              className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-navy/30 text-xs italic">
                          No players checked in yet
                        </p>
                      )}
                      {/* Quick check-in for this team */}
                      <button
                        onClick={() => {
                          setTeamName(team.teamName);
                          setDivision(team.division);
                          document
                            .getElementById("checkin-player-input")
                            ?.focus();
                        }}
                        className="mt-2 text-[11px] text-red hover:text-red-hover font-semibold uppercase tracking-wider transition-colors"
                      >
                        + Check in a player for this team
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Check-in form + recent */}
        <div className="space-y-6">
          {/* Check-in form */}
          <div className="bg-card border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-4 h-4 text-red" />
              <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
                Quick Check-In
              </h2>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-3">
              {checkInError && (
                <div className="bg-red/10 border border-red/30 text-red text-xs rounded-lg px-3 py-2.5 flex items-center justify-between" role="alert">
                  <span>{checkInError}</span>
                  <button type="button" onClick={() => setCheckInError("")} className="ml-2 text-red/60 hover:text-red">✕</button>
                </div>
              )}
              <div>
                <label className="block text-navy/60 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Player Name
                </label>
                <input
                  id="checkin-player-input"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-navy/25"
                  placeholder="Player name..."
                />
              </div>
              <div>
                <label className="block text-navy/60 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Team
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red"
                  placeholder="Team name"
                  list="team-suggestions"
                />
                <datalist id="team-suggestions">
                  {teams.map((t) => (
                    <option key={t.teamName} value={t.teamName} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-navy/60 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Division
                </label>
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red"
                  placeholder="e.g. 14U"
                  list="division-suggestions"
                />
                <datalist id="division-suggestions">
                  {divisions.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <button
                type="submit"
                disabled={saving || !playerName}
                className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors w-full justify-center"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                {success ? "Checked In!" : "Check In"}
              </button>
            </form>
          </div>

          {/* Recent check-ins this session */}
          {recentCheckins.length > 0 && (
            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10">
                <h2 className="text-navy font-bold text-xs uppercase tracking-wider">
                  This Session ({recentCheckins.length})
                </h2>
              </div>
              <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                {recentCheckins.map((ci, i) => (
                  <div
                    key={i}
                    className="px-5 py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-navy text-sm font-medium">
                        {ci.name}
                      </p>
                      {ci.team && (
                        <p className="text-navy/40 text-xs">{ci.team}</p>
                      )}
                    </div>
                    <span className="text-navy/30 text-xs">{ci.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
