"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { UserCheck, Loader2, CheckCircle2 } from "lucide-react";
import type { TeamStatus, RecentCheckin } from "@/types/checkin";
import { relativeTime } from "@/lib/relative-time";

interface CheckInFormProps {
  teams: TeamStatus[];
  divisions: string[];
  prefillTeam: string;
  prefillDivision: string;
  onCheckInSuccess: (entry: RecentCheckin) => void;
}

export default function CheckInForm({
  teams,
  divisions,
  prefillTeam,
  prefillDivision,
  onCheckInSuccess,
}: CheckInFormProps) {
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [division, setDivision] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Sync prefill from parent
  useEffect(() => {
    if (prefillTeam) setTeamName(prefillTeam);
    if (prefillDivision) setDivision(prefillDivision);
  }, [prefillTeam, prefillDivision]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleCheckIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (saving || !playerName.trim()) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSaving(true);
      setSuccess(false);
      setCheckInError("");

      const id = crypto.randomUUID();
      const now = new Date();

      // Optimistic entry
      const optimisticEntry: RecentCheckin = {
        name: playerName.trim(),
        team: teamName.trim(),
        time: now.toLocaleTimeString(),
        at: now.toISOString(),
        id,
        pending: true,
      };
      onCheckInSuccess(optimisticEntry);

      try {
        const res = await fetch("/api/admin/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerName: playerName.trim(),
            teamName: teamName.trim(),
            division: division.trim(),
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          // Confirm optimistic entry
          onCheckInSuccess({ ...optimisticEntry, pending: false });
          setPlayerName("");
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
        } else {
          const data = await res.json().catch(() => ({}));
          setCheckInError(
            data.error || "Check-in failed -- please try again"
          );
          // Roll back optimistic
          onCheckInSuccess({ ...optimisticEntry, id, pending: undefined });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setCheckInError("Network error -- please try again");
        onCheckInSuccess({ ...optimisticEntry, id, pending: undefined });
      }
      setSaving(false);
    },
    [playerName, teamName, division, saving, onCheckInSuccess]
  );

  return (
    <div className="bg-white border border-border shadow-sm rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="w-4 h-4 text-red" />
        <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
          Quick Check-In
        </h2>
      </div>

      <form onSubmit={handleCheckIn} className="space-y-3">
        {checkInError && (
          <div
            className="bg-red-50 border border-red-200 text-red text-xs rounded-lg px-3 py-2.5 flex items-center justify-between"
            role="alert"
          >
            <span>{checkInError}</span>
            <button
              type="button"
              onClick={() => setCheckInError("")}
              className="ml-2 text-red/60 hover:text-red focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
              aria-label="Dismiss error"
            >
              &#x2715;
            </button>
          </div>
        )}

        {success && (
          <div
            className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg px-3 py-2.5 animate-pulse"
            role="status"
            aria-live="polite"
          >
            Player checked in successfully!
          </div>
        )}

        <div>
          <label className="block text-navy/70 text-[11px] font-semibold uppercase tracking-wider mb-1">
            Player Name
          </label>
          <input
            id="checkin-player-input"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            autoFocus
            className="w-full bg-off-white border border-border rounded-lg px-4 py-3 min-h-[44px] text-sm text-navy focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none transition-all placeholder:text-text-muted/50"
            placeholder="Player name..."
          />
        </div>
        <div>
          <label className="block text-navy/70 text-[11px] font-semibold uppercase tracking-wider mb-1">
            Team
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full bg-off-white border border-border rounded-lg px-4 py-3 min-h-[44px] text-sm text-navy focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none placeholder:text-text-muted/50"
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
          <label className="block text-navy/70 text-[11px] font-semibold uppercase tracking-wider mb-1">
            Division
          </label>
          <input
            type="text"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full bg-off-white border border-border rounded-lg px-4 py-3 min-h-[44px] text-sm text-navy focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none placeholder:text-text-muted/50"
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
          disabled={saving || !playerName.trim()}
          aria-label={`Check in ${playerName || "player"}`}
          className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 min-h-[44px] rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors w-full justify-center focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2"
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
  );
}

// Recent check-ins sidebar section
export function RecentCheckIns({
  checkins,
}: {
  checkins: RecentCheckin[];
}) {
  if (checkins.length === 0) return null;

  return (
    <div className="bg-white border border-border shadow-sm rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-navy font-bold text-xs uppercase tracking-wider">
          This Session ({checkins.length})
        </h2>
      </div>
      <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
        {checkins.map((ci) => (
          <div
            key={ci.id}
            className={`px-5 py-2.5 flex items-center justify-between transition-colors ${
              ci.pending ? "bg-emerald-50/50" : ""
            }`}
          >
            <div>
              <p className="text-navy text-sm font-medium">
                {ci.name}
                {ci.pending && (
                  <span className="ml-1.5 text-[10px] text-emerald-500 font-bold uppercase">
                    saving...
                  </span>
                )}
              </p>
              {ci.team && (
                <p className="text-text-muted text-xs">{ci.team}</p>
              )}
            </div>
            <span className="text-text-muted text-xs">
              {relativeTime(ci.at) || ci.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
