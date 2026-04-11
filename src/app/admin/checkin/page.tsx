"use client";

import { useState } from "react";
import { UserCheck, Loader2, CheckCircle2, Search } from "lucide-react";

type CheckIn = { name: string; team: string; time: string };

export default function CheckInPage() {
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [division, setDivision] = useState("");
  const [saving, setSaving] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<CheckIn[]>([]);
  const [success, setSuccess] = useState(false);

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const res = await fetch("/api/admin/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName, teamName, division }),
    });

    if (res.ok) {
      setRecentCheckins((prev) => [
        { name: playerName, team: teamName, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
      setPlayerName("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
          Game Day Check-In
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Quick player check-in — writes to Google Sheets
        </p>
      </div>

      {/* Check-in form */}
      <div className="bg-card border border-white/10 rounded-xl p-6 mb-8 max-w-xl">
        <div className="flex items-center gap-2 mb-5">
          <UserCheck className="w-4 h-4 text-red" />
          <h2 className="text-white font-bold text-sm uppercase tracking-wider">
            Check In Player
          </h2>
        </div>

        <form onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Player Name
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
                autoFocus
                className="w-full bg-navy border border-white/10 rounded-lg pl-10 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25"
                placeholder="Search or type player name..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
                placeholder="Team name"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Division
              </label>
              <input
                type="text"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
                placeholder="e.g. 14U"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !playerName}
            className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors w-full justify-center"
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

      {/* Recent check-ins */}
      {recentCheckins.length > 0 && (
        <div className="bg-card border border-white/10 rounded-xl overflow-hidden max-w-xl">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">
              Recent Check-Ins (this session)
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentCheckins.map((ci, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{ci.name}</p>
                  {ci.team && (
                    <p className="text-text-secondary text-xs">{ci.team}</p>
                  )}
                </div>
                <span className="text-text-secondary text-xs">{ci.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
