"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";
import TeamLogo from "@/components/ui/TeamLogo";
import LogoUploader from "@/components/ui/LogoUploader";
import { usePortalView } from "@/components/portal/PortalViewContext";

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

type SortField = "name" | "jersey";

export default function RosterPage() {
  const { data: session } = useSession();
  const { viewAsRole } = usePortalView();
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", jerseyNumber: "" });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [teamLogoUrl, setTeamLogoUrl] = useState<string | null>(null);
  const actualRole = session?.user?.role;
  const role = (actualRole === "admin" && viewAsRole) ? viewAsRole : actualRole;
  const isCoach = role === "coach" || actualRole === "admin";

  // Clear feedback after 3s
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const fetchRoster = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/portal/roster");
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setRoster(data.players);
        // Fetch logo for this team
        if (data.team?.name) {
          fetch(`/api/teams/logo?teamName=${encodeURIComponent(data.team.name)}`)
            .then((r) => r.json())
            .then((d) => setTeamLogoUrl(d.url || null))
            .catch(() => {});
        }
      } else {
        setError(true);
      }
    } catch {
      setError(true);
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
    try {
      const res = await fetch("/api/portal/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", jerseyNumber: "" });
        setShowAdd(false);
        setFeedback({ type: "success", message: `${form.name} added to roster` });
        fetchRoster();
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({ type: "error", message: data.error || "Failed to add player" });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to add player. Check your connection." });
    }
    setSaving(false);
  }

  async function handleRemove(id: number, name: string) {
    if (!confirm(`Remove ${name} from roster?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/portal/roster?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback({ type: "success", message: `${name} removed from roster` });
        fetchRoster();
      } else {
        setFeedback({ type: "error", message: `Failed to remove ${name}` });
      }
    } catch {
      setFeedback({ type: "error", message: `Failed to remove ${name}. Check your connection.` });
    }
    setDeletingId(null);
  }

  // Sort roster
  const sortedRoster = [...roster].sort((a, b) => {
    if (sortField === "jersey") {
      const aNum = parseInt(a.jerseyNumber || "999", 10);
      const bNum = parseInt(b.jerseyNumber || "999", 10);
      return aNum - bNum;
    }
    return a.name.localeCompare(b.name);
  });

  // Error state
  if (error && !loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">My Roster</h1>
        </div>
        <div className="bg-red/10 border border-red/20 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-1">Failed to Load Roster</h3>
          <p className="text-text-secondary text-sm mb-4">Could not load your roster. Check your connection and try again.</p>
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
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            {team && (
              <div className="relative">
                <TeamLogo teamName={team.name} logoUrl={teamLogoUrl} size={56} />
                {isCoach && (
                  <div className="absolute -bottom-1 -right-1">
                    <LogoUploader
                      teamName={team.name}
                      currentLogoUrl={teamLogoUrl}
                      onSuccess={(url) => setTeamLogoUrl(url)}
                      variant="button"
                    />
                  </div>
                )}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
                My Roster
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                {team ? `${team.name}${team.division ? ` — ${team.division}` : ""}` : "Team roster management"}
              </p>
            </div>
          </div>
          {isCoach && team && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          )}
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div role="status" aria-live="polite" className={`mb-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm ${
          feedback.type === "success"
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            : "bg-red/10 border border-red/20 text-red"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

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
                    <th className="text-left px-6 py-3 font-semibold">
                      <button
                        onClick={() => setSortField("jersey")}
                        className={`flex items-center gap-1 hover:text-white transition-colors ${sortField === "jersey" ? "text-white" : ""}`}
                      >
                        # <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 font-semibold">
                      <button
                        onClick={() => setSortField("name")}
                        className={`flex items-center gap-1 hover:text-white transition-colors ${sortField === "name" ? "text-white" : ""}`}
                      >
                        Player <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 font-semibold">Division</th>
                    {isCoach && <th className="px-6 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedRoster.map((p) => (
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
                            disabled={deletingId === p.id}
                            className="text-white/30 hover:text-red disabled:opacity-40 transition-colors"
                          >
                            {deletingId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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
