"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Users, Undo2, X } from "lucide-react";
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

  // Undo snackbar state — shown for ~8s after each successful check-in.
  // Stores the DB row id so the Undo button can DELETE it. We only
  // track the most recent check-in; an earlier undo'able row is auto-
  // cleared when a new one comes in.
  const [undoTarget, setUndoTarget] = useState<{ id: number; name: string; team: string } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);
  const showUndo = useCallback((row: { id: number; name: string; team: string }) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoTarget(row);
    undoTimerRef.current = setTimeout(() => setUndoTarget(null), 8000);
  }, []);
  const performUndo = useCallback(async () => {
    if (!undoTarget) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const target = undoTarget;
    setUndoTarget(null);
    try {
      await fetch(`/api/admin/checkin?id=${target.id}`, { method: "DELETE" });
      // Soft-refresh the team list so the row's effect on team status flips back.
      handleRefresh();
    } catch {
      /* ignore — front desk can re-check-in if undo fails */
    }
  }, [undoTarget]);

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
        const json = await res.json().catch(() => null);
        const dbId = json?.checkin?.id as number | undefined;
        handleCheckInUpdate({ ...optimistic, pending: false });
        if (dbId) showUndo({ id: dbId, name: playerLabel, team: team.teamName });
        // Trigger a fresh fetch of teams so this team's status flips
        // to "checked in" without a full page reload.
        await handleRefresh();
      } finally {
        setBulkTeamId(null);
      }
    },
    [bulkTeamId, handleCheckInUpdate, handleRefresh, showUndo]
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
            onCheckInSaved={showUndo}
          />
          <RecentCheckIns checkins={recentCheckins} />
        </div>
      </div>

      {/* Undo snackbar — bottom-fixed, mobile-safe. Auto-dismisses
          after 8s; tapping Undo issues DELETE /api/admin/checkin?id=. */}
      {undoTarget && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 pointer-events-none"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="pointer-events-auto mx-auto max-w-md bg-navy text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">Checked in: {undoTarget.name}</p>
              <p className="text-white/60 text-xs truncate">{undoTarget.team}</p>
            </div>
            <button
              onClick={performUndo}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
            <button
              onClick={() => setUndoTarget(null)}
              aria-label="Dismiss"
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {stats.checkedInTeamCount} of {stats.totalTeams} teams checked in.{" "}
        {stats.totalPlayerCheckins + stats.sessionCount} total players today.
      </div>
    </div>
  );
}
