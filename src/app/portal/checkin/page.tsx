"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  UserCheck,
  Loader2,
  CheckCircle2,
  Search,
  Users,
  ChevronDown,
  Clock,
  AlertTriangle,
  RefreshCw,
  UsersRound,
  Undo2,
  XCircle,
  Shield,
} from "lucide-react";
import ExportBar from "@/components/ui/ExportBar";
import { exportCSV } from "@/lib/export";

type Player = {
  id: number;
  name: string;
  jerseyNumber: string | null;
};

type CheckedIn = { name: string; time: string };
type CoachCheckedIn = { name: string; time: string };

const MAX_COACH_BANDS = 2;

export default function CoachCheckInPage() {
  const { data: session } = useSession();
  const [roster, setRoster] = useState<Player[]>([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checkedIn, setCheckedIn] = useState<CheckedIn[]>([]);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [manualName, setManualName] = useState("");
  const [showSummary, setShowSummary] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [bulkChecking, setBulkChecking] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [undoPlayer, setUndoPlayer] = useState<string | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [coachesCheckedIn, setCoachesCheckedIn] = useState<CoachCheckedIn[]>([]);
  const [coachName, setCoachName] = useState("");
  const [coachCheckingIn, setCoachCheckingIn] = useState(false);

  const fetchRoster = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/portal/roster");
      if (res.ok) {
        const data = await res.json();
        setRoster(data.players || []);
        setTeamName(data.team?.name || "");
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  // Clear mutation error after 4s
  useEffect(() => {
    if (mutationError) {
      const t = setTimeout(() => setMutationError(""), 4000);
      return () => clearTimeout(t);
    }
  }, [mutationError]);

  // Clear duplicate warning after 3s
  useEffect(() => {
    if (duplicateWarning) {
      const t = setTimeout(() => setDuplicateWarning(""), 3000);
      return () => clearTimeout(t);
    }
  }, [duplicateWarning]);

  const isCheckedIn = (name: string) => checkedIn.some((c) => c.name === name);

  async function checkIn(playerName: string, playerId?: number) {
    // Duplicate detection
    if (isCheckedIn(playerName)) {
      setDuplicateWarning(`${playerName} is already checked in.`);
      return;
    }

    if (playerId) setCheckingIn(playerId);
    setMutationError("");

    try {
      const res = await fetch("/api/portal/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, teamName }),
      });
      if (res.ok) {
        setCheckedIn((prev) => [...prev, { name: playerName, time: new Date().toLocaleTimeString() }]);
        // Set up undo
        if (undoTimeout) clearTimeout(undoTimeout);
        setUndoPlayer(playerName);
        const t = setTimeout(() => setUndoPlayer(null), 5000);
        setUndoTimeout(t);
      } else {
        setMutationError(`Failed to check in ${playerName}. Try again.`);
      }
    } catch {
      setMutationError(`Failed to check in ${playerName}. Check your connection.`);
    }
    setCheckingIn(null);
  }

  function undoLastCheckIn() {
    if (undoPlayer) {
      setCheckedIn((prev) => prev.filter((c) => c.name !== undoPlayer));
      setUndoPlayer(null);
      if (undoTimeout) clearTimeout(undoTimeout);
    }
  }

  async function handleManualCheckIn(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = manualName.trim();
    if (!trimmed) return;

    // Duplicate detection for manual input
    if (isCheckedIn(trimmed)) {
      setDuplicateWarning(`${trimmed} is already checked in.`);
      return;
    }

    await checkIn(trimmed);
    setManualName("");
  }

  async function handleBulkCheckIn() {
    const unchecked = roster.filter((p) => !isCheckedIn(p.name));
    if (unchecked.length === 0) return;

    setBulkChecking(true);
    setBulkProgress(0);

    for (let i = 0; i < unchecked.length; i++) {
      await checkIn(unchecked[i].name, unchecked[i].id);
      setBulkProgress(i + 1);
    }

    setBulkChecking(false);
  }

  async function handleCoachCheckIn(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = coachName.trim();
    if (!trimmed) return;

    if (coachesCheckedIn.length >= MAX_COACH_BANDS) {
      setMutationError(`Maximum ${MAX_COACH_BANDS} coaching bands allowed. No more coaches can check in.`);
      return;
    }

    if (coachesCheckedIn.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setDuplicateWarning(`${trimmed} is already checked in as a coach.`);
      return;
    }

    setCoachCheckingIn(true);
    setMutationError("");

    try {
      const res = await fetch("/api/portal/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: `[COACH] ${trimmed}`, teamName }),
      });
      if (res.ok) {
        setCoachesCheckedIn((prev) => [...prev, { name: trimmed, time: new Date().toLocaleTimeString() }]);
        setCoachName("");
      } else {
        setMutationError(`Failed to check in coach ${trimmed}. Try again.`);
      }
    } catch {
      setMutationError(`Failed to check in coach ${trimmed}. Check your connection.`);
    }
    setCoachCheckingIn(false);
  }

  const coachSlotsRemaining = MAX_COACH_BANDS - coachesCheckedIn.length;

  const uncheckedCount = roster.filter((p) => !isCheckedIn(p.name)).length;

  // Filter roster by search
  const filteredRoster = searchQuery
    ? roster.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.jerseyNumber && p.jerseyNumber.includes(searchQuery))
      )
    : roster;

  // Error state
  if (error && !loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Team Check-In
          </h1>
        </div>
        <div className="bg-red/10 border border-red/20 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red mx-auto mb-3" />
          <h3 className="text-navy font-semibold mb-1">Failed to Load Roster</h3>
          <p className="text-text-muted text-sm mb-4">
            Could not load your roster. Check your connection and try again.
          </p>
          <button
            onClick={() => { setLoading(true); fetchRoster(); }}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">
              Team Check-In
            </h1>
            <ExportBar onExportCSV={() => exportCSV("checkin", ["Player Name", "Check-In Time"], checkedIn.map(c => [c.name, c.time]))} />
          </div>
          <p className="text-text-muted text-sm mt-1">
            {teamName ? `Check in players for ${teamName}` : "Check in your players for game day"}
          </p>
        </div>
        {/* Check In All button */}
        {uncheckedCount > 0 && !bulkChecking && (
          <button
            onClick={handleBulkCheckIn}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-500/30 text-emerald-600 px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <UsersRound className="w-4 h-4" />
            <span className="hidden sm:inline">Check In All</span>
            <span className="sm:hidden">All</span>
          </button>
        )}
      </div>

      {/* Bulk progress */}
      {bulkChecking && (
        <div className="mb-6 bg-emerald-50 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            <span className="text-emerald-600 text-sm font-semibold">
              Checking in {bulkProgress} of {roster.filter((p) => !checkedIn.some((c) => c.name === p.name)).length + bulkProgress}...
            </span>
          </div>
          <div className="w-full h-1.5 bg-navy/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${(bulkProgress / roster.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Mutation error banner */}
      {mutationError && (
        <div className="mb-4 bg-red/10 border border-red/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red">
          <XCircle className="w-4 h-4 flex-shrink-0" /> {mutationError}
        </div>
      )}

      {/* Duplicate warning */}
      {duplicateWarning && (
        <div className="mb-4 bg-amber-50 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {duplicateWarning}
        </div>
      )}

      {/* Undo toast */}
      {undoPlayer && (
        <div className="mb-4 bg-navy/[0.04] border border-light-gray rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-navy text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline mr-1.5" />
            {undoPlayer} checked in
          </span>
          <button
            onClick={undoLastCheckIn}
            className="flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="bg-white border border-light-gray rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Roster
          </div>
          <p className="text-navy text-2xl font-bold">{roster.length} <span className="text-sm text-text-muted font-normal">players</span></p>
        </div>
        <div className="bg-white border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-600 text-xs uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
          </div>
          <p className="text-emerald-600 text-2xl font-bold">{checkedIn.length} <span className="text-sm text-emerald-600/50 font-normal">of {roster.length}</span></p>
        </div>
      </div>

      {/* Coach Check-In (2 bands max) */}
      <div className="bg-white border border-amber-500/20 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <h2 className="text-amber-600 font-bold text-sm uppercase tracking-wider">
              Coach Check-In
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {coachesCheckedIn.map((c, i) => (
              <span
                key={i}
                className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-full"
              >
                {c.name}
              </span>
            ))}
            <span className={`text-xs font-semibold tabular-nums ${
              coachSlotsRemaining === 0 ? "text-red" : "text-amber-600/60"
            }`}>
              {coachSlotsRemaining === 0
                ? "No bands left"
                : `${coachSlotsRemaining} band${coachSlotsRemaining !== 1 ? "s" : ""} remaining`}
            </span>
          </div>
        </div>

        {/* Band slots visual */}
        <div className="flex gap-2 mb-4">
          {Array.from({ length: MAX_COACH_BANDS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                i < coachesCheckedIn.length
                  ? "bg-amber-400"
                  : "bg-navy/[0.04]"
              }`}
            />
          ))}
        </div>

        {coachSlotsRemaining > 0 ? (
          <form onSubmit={handleCoachCheckIn} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Coach Name
              </label>
              <input
                type="text"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-amber-500 placeholder:text-text-muted/50"
                placeholder="Enter coach name for band..."
                aria-label="Coach name for coaching band"
              />
            </div>
            <button
              type="submit"
              disabled={!coachName.trim() || coachCheckingIn}
              className="flex items-center gap-2 bg-amber-50 hover:bg-amber-500/30 disabled:opacity-40 text-amber-600 px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {coachCheckingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              Issue Band
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 bg-red/10 border border-red/20 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red flex-shrink-0" />
            <p className="text-red text-sm font-medium">
              Maximum {MAX_COACH_BANDS} coaching bands have been issued. No additional coaches can check in.
            </p>
          </div>
        )}

        {/* Checked-in coaches detail */}
        {coachesCheckedIn.length > 0 && (
          <div className="mt-3 divide-y divide-light-gray">
            {coachesCheckedIn.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-navy text-sm font-medium">{c.name}</span>
                </div>
                <span className="flex items-center gap-1.5 text-light-gray text-xs">
                  <Clock className="w-3 h-3" />
                  {c.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual check-in */}
      <div className="bg-white border border-light-gray rounded-xl p-5 mb-6">
        <form onSubmit={handleManualCheckIn} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
              Manual Check-In
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-gray" />
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full bg-off-white border border-light-gray rounded-lg pl-10 pr-4 py-3 text-navy text-sm focus:outline-none focus:border-red placeholder:text-text-muted/50"
                placeholder="Type player name not on roster..."
                aria-label="Manual player check-in name"
              />
            </div>
          </div>
          <button type="submit" disabled={!manualName.trim()} className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors">
            <UserCheck className="w-4 h-4" /> Check In
          </button>
        </form>
      </div>

      {/* Roster check-in list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading roster...
        </div>
      ) : roster.length === 0 ? (
        <div className="bg-white border border-light-gray rounded-xl p-8 text-center">
          <Users className="w-8 h-8 text-light-gray mx-auto mb-3" />
          <p className="text-navy font-semibold mb-1">No roster found</p>
          <p className="text-text-muted text-sm">Add players to your roster first, or use manual check-in above.</p>
        </div>
      ) : (
        <div className="bg-white border border-light-gray rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-light-gray flex items-center justify-between gap-3">
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider flex-shrink-0">Tap to Check In</h2>
            {/* Search filter */}
            {roster.length > 5 && (
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-light-gray" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-off-white border border-light-gray rounded-lg pl-9 pr-3 py-2 text-navy text-xs focus:outline-none focus:border-red placeholder:text-text-muted/50"
                  placeholder="Search player..."
                  aria-label="Search roster"
                />
              </div>
            )}
          </div>
          <div className="divide-y divide-light-gray">
            {filteredRoster.map((player) => {
              const done = isCheckedIn(player.name);
              const isLoading = checkingIn === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => !done && checkIn(player.name, player.id)}
                  disabled={done || isLoading || bulkChecking}
                  className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                    done ? "bg-emerald-50" : "hover:bg-off-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted font-mono text-sm w-8">
                      {player.jerseyNumber || "—"}
                    </span>
                    <span className={`text-sm font-medium ${done ? "text-emerald-600" : "text-navy"}`}>
                      {player.name}
                    </span>
                  </div>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                  ) : done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <span className="text-xs text-light-gray uppercase tracking-wider">Tap to check in</span>
                  )}
                </button>
              );
            })}
            {filteredRoster.length === 0 && searchQuery && (
              <div className="px-6 py-8 text-center text-text-muted text-sm">
                No players match &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checked-In Summary */}
      {checkedIn.length > 0 && (
        <div className="bg-white border border-emerald-500/20 rounded-xl overflow-hidden mt-6">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-emerald-600 font-bold text-sm uppercase tracking-wider">
                Recently Checked In ({checkedIn.length})
              </h2>
            </div>
            <ChevronDown className={`w-4 h-4 text-emerald-600/50 transition-transform ${showSummary ? "" : "-rotate-90"}`} />
          </button>
          {showSummary && (
            <div className="divide-y divide-light-gray border-t border-emerald-500/10">
              {checkedIn.map((c, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <span className="text-emerald-600 text-sm font-medium">{c.name}</span>
                  <span className="flex items-center gap-1.5 text-light-gray text-xs">
                    <Clock className="w-3 h-3" />
                    {c.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
