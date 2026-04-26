"use client";

import { useState, useEffect, useCallback } from "react";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmModal from "@/components/ui/ConfirmModal";
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
import Link from "next/link";
import { usePortalView } from "@/components/portal/PortalViewContext";
import ExportBar from "@/components/ui/ExportBar";
import { exportCSV } from "@/lib/export";
import { EligibilityChip } from "@/components/portal/EligibilityChip";
import type { EligibilityResult } from "@/lib/eligibility";

type Player = {
  id: number;
  name: string;
  jerseyNumber: string | null;
  division: string | null;
  memberSince: string | null;
  birthDate: string | null;
  grade: string | null;
  waiverOnFile: boolean;
  photoUrl: string | null;
  eligibility?: EligibilityResult;
};

type RosterConflict = {
  kind: "duplicate_jersey" | "duplicate_name" | "cross_team";
  message: string;
  playerIds: number[];
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
  const [form, setForm] = useState({ name: "", jerseyNumber: "", birthDate: "", grade: "" });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<RosterConflict[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { confirm, modalProps } = useConfirm();
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

  const fetchRoster = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(false);
      const res = await fetch("/api/portal/roster", { signal });
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setRoster(data.players);
        setConflicts(Array.isArray(data.conflicts) ? data.conflicts : []);
        // Fetch logo for this team (also guarded by signal so unmount aborts it)
        if (data.team?.name) {
          fetch(`/api/teams/logo?teamName=${encodeURIComponent(data.team.name)}`, { signal })
            .then((r) => r.json())
            .then((d) => setTeamLogoUrl(d.url || null))
            .catch((err) => {
              if (err instanceof DOMException && err.name === "AbortError") return;
              // Logo is non-critical — swallow other errors silently.
            });
        }
      } else {
        setError(true);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchRoster(controller.signal);
    return () => controller.abort();
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
        setForm({ name: "", jerseyNumber: "", birthDate: "", grade: "" });
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
    const ok = await confirm({ title: "Remove Player", message: `Remove ${name} from roster?`, confirmLabel: "Remove", variant: "danger" });
    if (!ok) return;
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
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">My Roster</h1>
        </div>
        <div className="bg-red/10 border border-red/20 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-navy font-semibold mb-1">Failed to Load Roster</h3>
          <p className="text-text-muted text-sm mb-4">Could not load your roster. Check your connection and try again.</p>
          <button
            onClick={() => { setLoading(true); fetchRoster(); }}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4 transition-colors">
        <span aria-hidden="true">&larr;</span> Back to Dashboard
      </Link>
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">
                  My Roster
                </h1>
                <ExportBar onExportCSV={() => exportCSV("roster", ["Name", "Jersey #", "Division", "Member Since"], roster.map(p => [p.name, p.jerseyNumber || "", p.division || "", p.memberSince || ""]))} />
              </div>
              <p className="text-text-muted text-sm mt-1">
                {team ? `${team.name}${team.division ? ` — ${team.division}` : ""}` : "Team roster management"}
              </p>
            </div>
          </div>
          {isCoach && team && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
              <ImportRosterButton onImported={fetchRoster} setFeedback={setFeedback} />
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add Player
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div role="status" aria-live="polite" className={`mb-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm ${
          feedback.type === "success"
            ? "bg-emerald-50 border border-emerald-500/20 text-emerald-600"
            : "bg-red/10 border border-red/20 text-red"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Conflicts banner — shows duplicate jersey #s, duplicate names */}
      {conflicts.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-amber-800 text-sm font-semibold">
                Roster conflict{conflicts.length === 1 ? "" : "s"}
              </p>
              <ul className="mt-1 text-xs text-amber-700 space-y-0.5">
                {conflicts.map((c, i) => (
                  <li key={i}>• {c.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add player form */}
      {showAdd && (
        <div className="bg-white border border-light-gray rounded-xl p-6 mb-6">
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-end">
            <div className="sm:col-span-5">
              <label htmlFor="roster-name" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Player Name
              </label>
              <input
                id="roster-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                placeholder="First Last"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="roster-jersey" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Jersey #
              </label>
              <input
                id="roster-jersey"
                type="text"
                value={form.jerseyNumber}
                onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })}
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                placeholder="#"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="roster-dob" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Birth Date
              </label>
              <input
                id="roster-dob"
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                title="Required for age divisions (8U, 10U, 12U, etc.)"
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="roster-grade" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Grade
              </label>
              <input
                id="roster-grade"
                type="text"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                placeholder="8th"
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className="sm:col-span-1 flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-3 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors w-full"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
              <span className="sr-only sm:not-sr-only">Add</span>
            </button>
          </form>
          <p className="text-text-muted text-[11px] mt-2">
            Birth date drives age-group eligibility. Add it now to avoid front-desk delays at check-in.
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" /> Loading roster...
        </div>
      ) : !team ? (
        <div className="bg-white border border-light-gray rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-light-gray mx-auto mb-3" aria-hidden="true" />
          <p className="text-navy font-semibold mb-1">No team assigned</p>
          <p className="text-text-muted text-sm">Contact the admin to be assigned to a team.</p>
        </div>
      ) : (
        <div className="bg-white border border-light-gray rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-light-gray flex items-center gap-2">
            <Users className="w-4 h-4 text-red" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
              {team.name}
            </h2>
            <span className="text-text-muted text-xs ml-auto">
              {roster.length} player{roster.length !== 1 ? "s" : ""}
            </span>
          </div>

          {roster.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <p className="text-sm">No players on the roster yet.</p>
              {isCoach && team && (
                <button
                  onClick={() => { setShowAdd(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="mt-3 inline-flex items-center gap-1.5 text-red hover:text-red-hover text-sm font-semibold underline underline-offset-2"
                >
                  Add your first player
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Team roster players</caption>
                <thead>
                  <tr className="border-b border-light-gray text-text-muted text-xs uppercase tracking-wider">
                    <th scope="col" className="text-left px-6 py-3 font-semibold">
                      <button
                        onClick={() => setSortField("jersey")}
                        className={`flex items-center gap-1 hover:text-navy transition-colors ${sortField === "jersey" ? "text-navy" : ""}`}
                      >
                        # <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </th>
                    <th scope="col" className="text-left px-6 py-3 font-semibold">
                      <button
                        onClick={() => setSortField("name")}
                        className={`flex items-center gap-1 hover:text-navy transition-colors ${sortField === "name" ? "text-navy" : ""}`}
                      >
                        Player <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </th>
                    <th scope="col" className="text-left px-6 py-3 font-semibold">Division</th>
                    <th scope="col" className="text-left px-6 py-3 font-semibold">Eligibility</th>
                    <th scope="col" className="text-left px-6 py-3 font-semibold">DOB / Grade</th>
                    <th scope="col" className="text-left px-6 py-3 font-semibold">Waiver</th>
                    {isCoach && <th scope="col" className="px-6 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedRoster.map((p) => (
                    <tr key={p.id} className="border-b border-light-gray hover:bg-off-white transition-colors">
                      <td className="px-6 py-4 text-text-muted font-mono">
                        {p.jerseyNumber || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-navy font-medium">{p.name}</span>
                        {p.memberSince && <span className="ml-2"><LoyaltyBadge memberSince={p.memberSince} /></span>}
                      </td>
                      <td className="px-6 py-4 text-text-muted">{p.division || "—"}</td>
                      <td className="px-6 py-4">
                        <EligibilityChip result={p.eligibility} />
                      </td>
                      <td className="px-6 py-4 text-text-muted text-xs">
                        {p.birthDate || <span className="italic">—</span>}
                        {p.grade && <span className="ml-1 text-navy/60">· {p.grade}</span>}
                      </td>
                      <td className="px-6 py-4">
                        {p.waiverOnFile ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> On file
                          </span>
                        ) : (
                          <Link
                            href="/portal/waiver"
                            className="inline-flex items-center gap-1 text-red text-xs font-semibold hover:underline"
                          >
                            <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Sign
                          </Link>
                        )}
                      </td>
                      {isCoach && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingPlayer(p)}
                            aria-label={`Edit ${p.name}`}
                            className="text-text-muted hover:text-navy text-xs font-semibold mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemove(p.id, p.name)}
                            disabled={deletingId === p.id}
                            aria-label={`Remove ${p.name}`}
                            className="text-light-gray hover:text-red disabled:opacity-40 transition-colors"
                          >
                            {deletingId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
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

      {editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSaved={() => {
            setEditingPlayer(null);
            setFeedback({ type: "success", message: "Player updated" });
            fetchRoster();
          }}
          onError={(msg) => setFeedback({ type: "error", message: msg })}
        />
      )}

      <ConfirmModal {...modalProps} />
    </div>
  );
}

// ── Import roster from previous event ──────────────────────────────
function ImportRosterButton({
  onImported,
  setFeedback,
}: {
  onImported: () => void;
  setFeedback: (f: { type: "success" | "error"; message: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Array<{ id: number; name: string; division: string | null; season: string | null; playerCount: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/roster/import");
      if (res.ok) {
        const d = await res.json();
        setTeams(d.teams || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function doImport(fromTeamId: number) {
    setImporting(fromTeamId);
    try {
      const res = await fetch("/api/portal/roster/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromTeamId }),
      });
      const d = await res.json();
      if (res.ok) {
        setFeedback({
          type: "success",
          message: `Imported ${d.imported}, skipped ${d.skipped} existing`,
        });
        setOpen(false);
        onImported();
      } else {
        setFeedback({ type: "error", message: d.error || "Import failed" });
      }
    } finally {
      setImporting(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void load();
        }}
        className="flex items-center gap-2 bg-white border border-border hover:border-navy/40 text-navy px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
        title="Reuse a roster from a previous event"
      >
        Import
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <h2 className="text-navy text-lg font-bold mb-1">Import roster</h2>
            <p className="text-text-muted text-xs mb-4">
              Pick a previous team to copy players from. Existing names are skipped.
            </p>
            {loading ? (
              <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : teams.length === 0 ? (
              <p className="text-text-muted text-sm py-4 text-center">
                No previous teams to import from.
              </p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {teams.map((t) => (
                  <li key={t.id} className="border border-border rounded-lg p-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy truncate">{t.name}</p>
                      <p className="text-xs text-text-muted">
                        {t.division || "—"}{t.season ? ` · ${t.season}` : ""} · {t.playerCount} players
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => doImport(t.id)}
                      disabled={importing != null}
                      className="px-3 py-2 rounded-lg bg-red hover:bg-red-hover disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider"
                    >
                      {importing === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Import"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="text-right mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-text-muted text-sm hover:text-navy"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Edit player modal ──────────────────────────────────────────────
// Backfill DOB / grade / jersey on existing roster rows. Used by the
// pencil-icon "Edit" link in the roster table.
function EditPlayerModal({
  player,
  onClose,
  onSaved,
  onError,
}: {
  player: Player;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(player.name);
  const [jerseyNumber, setJersey] = useState(player.jerseyNumber || "");
  const [birthDate, setBirthDate] = useState(player.birthDate || "");
  const [grade, setGrade] = useState(player.grade || "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/portal/roster", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: player.id, name, jerseyNumber, birthDate, grade }),
      });
      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json().catch(() => ({}));
        onError(data.error || "Failed to update player");
      }
    } catch {
      onError("Network error updating player");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-navy text-lg font-bold mb-4">Edit Player</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-off-white border border-light-gray rounded-lg px-3 py-2 text-navy text-sm focus:outline-none focus:border-red"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Jersey #</label>
              <input
                type="text"
                value={jerseyNumber}
                onChange={(e) => setJersey(e.target.value)}
                className="w-full bg-off-white border border-light-gray rounded-lg px-3 py-2 text-navy text-sm focus:outline-none focus:border-red"
              />
            </div>
            <div>
              <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Grade</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="8th"
                className="w-full bg-off-white border border-light-gray rounded-lg px-3 py-2 text-navy text-sm focus:outline-none focus:border-red"
              />
            </div>
          </div>
          <div>
            <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Birth Date</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-off-white border border-light-gray rounded-lg px-3 py-2 text-navy text-sm focus:outline-none focus:border-red"
            />
            <p className="text-text-muted text-[10px] mt-1">Age divisions (8U, 10U, 12U…) are validated against this.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-text-muted hover:bg-off-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
