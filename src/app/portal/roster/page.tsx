"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Users, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";

type Player = {
  id: number;
  name: string;
  jerseyNumber: string | null;
  division: string | null;
  memberSince: string | null;
};

type Team = {
  id: number;
  name: string;
  division: string | null;
  season: string | null;
};

export default function RosterPage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", jerseyNumber: "" });
  const isCoach = session?.user?.role === "coach";

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/roster");
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setRoster(data.players);
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/portal/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", jerseyNumber: "" });
      setShowAdd(false);
      fetchRoster();
    }
    setSaving(false);
  }

  async function handleRemove(id: number, name: string) {
    if (!confirm(`Remove ${name} from roster?`)) return;
    await fetch(`/api/portal/roster?id=${id}`, { method: "DELETE" });
    fetchRoster();
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
            My Roster
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {team ? `${team.name} — ${team.division || ""}` : "Team roster management"}
          </p>
        </div>
        {isCoach && team && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Player
          </button>
        )}
      </div>

      {/* Add player form */}
      {showAdd && (
        <div className="bg-card border border-white/10 rounded-xl p-6 mb-6">
          <form onSubmit={handleAdd} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Player Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
                placeholder="First Last"
              />
            </div>
            <div className="w-32">
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Jersey #
              </label>
              <input
                type="text"
                value={form.jerseyNumber}
                onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })}
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
                placeholder="#"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading roster...
        </div>
      ) : !team ? (
        <div className="bg-card border border-white/10 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No team assigned</p>
          <p className="text-text-secondary text-sm">Contact the admin to be assigned to a team.</p>
        </div>
      ) : (
        <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <Users className="w-4 h-4 text-red" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">
              {team.name}
            </h2>
            <span className="text-text-secondary text-xs ml-auto">
              {roster.length} player{roster.length !== 1 ? "s" : ""}
            </span>
          </div>

          {roster.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <p className="text-sm">No players on the roster yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-3 font-semibold">#</th>
                    <th className="text-left px-6 py-3 font-semibold">Player</th>
                    <th className="text-left px-6 py-3 font-semibold">Division</th>
                    {isCoach && <th className="px-6 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {roster.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white/60 font-mono">
                        {p.jerseyNumber || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{p.name}</span>
                        {p.memberSince && <span className="ml-2"><LoyaltyBadge memberSince={p.memberSince} /></span>}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{p.division || "—"}</td>
                      {isCoach && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemove(p.id, p.name)}
                            className="text-white/30 hover:text-red transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
