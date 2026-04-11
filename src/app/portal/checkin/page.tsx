"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { UserCheck, Loader2, CheckCircle2, Search, Users } from "lucide-react";

type Player = {
  id: number;
  name: string;
  jerseyNumber: string | null;
};

type CheckedIn = { name: string; time: string };

export default function CoachCheckInPage() {
  const { data: session } = useSession();
  const [roster, setRoster] = useState<Player[]>([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState<CheckedIn[]>([]);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [manualName, setManualName] = useState("");

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/roster");
      if (res.ok) {
        const data = await res.json();
        setRoster(data.players || []);
        setTeamName(data.team?.name || "");
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  async function checkIn(playerName: string, playerId?: number) {
    if (playerId) setCheckingIn(playerId);
    const res = await fetch("/api/portal/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName, teamName }),
    });
    if (res.ok) {
      setCheckedIn((prev) => [...prev, { name: playerName, time: new Date().toLocaleTimeString() }]);
    }
    setCheckingIn(null);
  }

  async function handleManualCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName.trim()) return;
    await checkIn(manualName.trim());
    setManualName("");
  }

  const isCheckedIn = (name: string) => checkedIn.some((c) => c.name === name);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
          Team Check-In
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {teamName ? `Check in players for ${teamName}` : "Check in your players for game day"}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="bg-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Roster
          </div>
          <p className="text-white text-2xl font-bold">{roster.length} <span className="text-sm text-white/40 font-normal">players</span></p>
        </div>
        <div className="bg-card border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
          </div>
          <p className="text-emerald-400 text-2xl font-bold">{checkedIn.length} <span className="text-sm text-emerald-400/50 font-normal">of {roster.length}</span></p>
        </div>
      </div>

      {/* Manual check-in */}
      <div className="bg-card border border-white/10 rounded-xl p-5 mb-6">
        <form onSubmit={handleManualCheckIn} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Manual Check-In
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                placeholder="Type player name not on roster..."
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
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading roster...
        </div>
      ) : roster.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-xl p-8 text-center">
          <Users className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No roster found</p>
          <p className="text-text-secondary text-sm">Add players to your roster first, or use manual check-in above.</p>
        </div>
      ) : (
        <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Tap to Check In</h2>
          </div>
          <div className="divide-y divide-white/5">
            {roster.map((player) => {
              const done = isCheckedIn(player.name);
              const isLoading = checkingIn === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => !done && checkIn(player.name, player.id)}
                  disabled={done || isLoading}
                  className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                    done ? "bg-emerald-500/5" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 font-mono text-sm w-8">
                      {player.jerseyNumber || "—"}
                    </span>
                    <span className={`text-sm font-medium ${done ? "text-emerald-400" : "text-white"}`}>
                      {player.name}
                    </span>
                  </div>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                  ) : done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <span className="text-xs text-white/30 uppercase tracking-wider">Tap to check in</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
