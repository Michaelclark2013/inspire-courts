"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Users } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type {
  CheckInDashboardProps,
  FilterStatus,
  RecentCheckin} from "@/types/checkin";
import CheckInHeader from "@/components/admin/checkin/CheckInHeader";
import CheckInStats from "@/components/admin/checkin/CheckInStats";
import SearchBar from "@/components/admin/checkin/SearchBar";
import TeamCard from "@/components/admin/checkin/TeamCard";
import CheckInForm, {
  RecentCheckIns,
} from "@/components/admin/checkin/CheckInForm";

// ---------- debounce helper ----------
function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function CheckInDashboard({
  teams,
  checkedInTeamCount,
  totalTeams,
  totalPlayerCheckins,
  today,
}: CheckInDashboardProps) {
  useDocumentTitle("Check-In");
  // ---------- state ----------
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prefill state for quick check-in from team card
  const [prefillTeam, setPrefillTeam] = useState("");
  const [prefillDivision, setPrefillDivision] = useState("");

  // ---------- debounced search ----------
  const debouncedSearch = useDebounce(searchQuery, 200);

  // ---------- memoized divisions ----------
  const divisions = useMemo(
    () => [...new Set(teams.map((t) => t.division))].sort(),
    [teams]
  );

  // ---------- memoized filtered teams ----------
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (filterStatus === "checked" && !t.hasCheckedIn) return false;
      if (filterStatus === "not" && t.hasCheckedIn) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return (
          t.teamName.toLowerCase().includes(q) ||
          t.coach.toLowerCase().includes(q) ||
          t.division.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [teams, filterStatus, debouncedSearch]);

  // ---------- memoized stats ----------
  const confirmedCount = useMemo(
    () => recentCheckins.filter((c) => !c.pending).length,
    [recentCheckins]
  );

  const stats = useMemo(
    () => ({
      checkedInTeamCount,
      totalTeams,
      totalPlayerCheckins,
      sessionCount: confirmedCount,
    }),
    [checkedInTeamCount, totalTeams, totalPlayerCheckins, confirmedCount]
  );

  // ---------- refresh (debounced) ----------
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    // Clear any existing timer
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    window.location.reload();
  }, [isRefreshing]);

  // Cleanup timer on unmount. Copy the ref value into the effect
  // scope so the cleanup sees the value that was current when the
  // effect ran, not a later value — React's exhaustive-deps lint
  // rule flags the naked ref access for exactly this reason.
  useEffect(() => {
    const timerRef = refreshTimerRef;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ---------- optimistic check-in handler ----------
  const handleCheckInUpdate = useCallback((entry: RecentCheckin) => {
    setRecentCheckins((prev) => {
      // If this is a rollback (pending === undefined), remove it
      if (entry.pending === undefined) {
        return prev.filter((c) => c.id !== entry.id);
      }
      // If confirming an existing entry, update it
      const idx = prev.findIndex((c) => c.id === entry.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      // New entry - add at front
      return [entry, ...prev];
    });
  }, []);

  // ---------- quick check-in from team card ----------
  const handleQuickCheckIn = useCallback(
    (teamName: string, division: string) => {
      setPrefillTeam(teamName);
      setPrefillDivision(division);
      document.getElementById("checkin-player-input")?.focus();
    },
    []
  );

  // ---------- team toggle ----------
  const handleToggleTeam = useCallback(
    (teamName: string) => {
      setExpandedTeam(expandedTeam === teamName ? null : teamName);
    },
    [expandedTeam]
  );

  // ---------- bulk team check-in ----------
  // Single tap when the coach says "everyone is here." Records a
  // check-in row attributed to the coach so the audit trail keeps a
  // real human name. Front desk can still expand + add individual
  // players afterward for fuller per-player records.
  const [bulkTeamId, setBulkTeamId] = useState<string | null>(null);
  const handleTeamCheckIn = useCallback(
    async (team: typeof teams[number]) => {
      if (bulkTeamId) return;
      setBulkTeamId(team.teamName);
      const id = crypto.randomUUID();
      const now = new Date();
      const playerLabel = team.coach && team.coach !== "—"
        ? `${team.coach} (entire team)`
        : `${team.teamName} (entire team)`;
      const optimistic: RecentCheckin = {
        name: playerLabel,
        team: team.teamName,
        time: now.toLocaleTimeString(),
        at: now.toISOString(),
        id,
        pending: true,
      };
      handleCheckInUpdate(optimistic);
      try {
        const res = await fetch("/api/admin/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerName: playerLabel,
            teamName: team.teamName,
            division: team.division,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // Roll back optimistic entry on failure.
          handleCheckInUpdate({ ...optimistic, id, pending: false, name: `❌ ${playerLabel} — ${data.error || "failed"}` });
          return;
        }
        handleCheckInUpdate({ ...optimistic, pending: false });
        // Trigger a fresh fetch of teams so this team's status flips
        // to "checked in" without a full page reload.
        await handleRefresh();
      } finally {
        setBulkTeamId(null);
      }
    },
    [bulkTeamId, handleCheckInUpdate, handleRefresh]
  );

  // ---------- empty state message ----------
  const emptyMessage = useMemo(() => {
    if (teams.length === 0)
      return "No check-in data yet. Data will appear once the session begins.";
    if (debouncedSearch) return `No teams matching "${debouncedSearch}"`;
    if (filterStatus === "checked") return "No teams checked in yet";
    if (filterStatus === "not") return "All teams are checked in!";
    return "No teams found";
  }, [teams.length, debouncedSearch, filterStatus]);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overscroll-none">
      <CheckInHeader
        today={today}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <CheckInStats stats={stats} />

      {/* Two columns: Team Status + Check-In Form */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Team Status List (2/3 width) */}
        <div className="xl:col-span-2 bg-white border border-border shadow-sm rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Users className="w-4 h-4 text-red" aria-hidden="true" />
              <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
                Team Status
              </h2>
            </div>
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
            />
          </div>

          <div className="max-h-[600px] overflow-y-auto divide-y divide-border overscroll-contain">
            {filteredTeams.length === 0 ? (
              <div className="px-5 py-8 text-center text-text-muted text-sm">
                {emptyMessage}
              </div>
            ) : (
              filteredTeams.map((team) => (
                <TeamCard
                  key={team.teamName}
                  team={team}
                  isExpanded={expandedTeam === team.teamName}
                  isBulkChecking={bulkTeamId === team.teamName}
                  onToggle={() => handleToggleTeam(team.teamName)}
                  onQuickCheckIn={handleQuickCheckIn}
                  onTeamCheckIn={handleTeamCheckIn}
                />
              ))
            )}
          </div>
        </div>

        {/* Right column: Check-in form + recent */}
        <div className="space-y-6">
          <CheckInForm
            teams={teams}
            divisions={divisions}
            prefillTeam={prefillTeam}
            prefillDivision={prefillDivision}
            onCheckInSuccess={handleCheckInUpdate}
          />
          <RecentCheckIns checkins={recentCheckins} />
        </div>
      </div>

      {/* Live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {stats.checkedInTeamCount} of {stats.totalTeams} teams checked in.{" "}
        {stats.totalPlayerCheckins + stats.sessionCount} total players today.
      </div>
    </div>
  );
}
