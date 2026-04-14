"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Plus,
  Loader2,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  X,
  Gamepad2,
  Zap,
  Check,
  Sparkles,
} from "lucide-react";

type Tournament = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  format: string;
  status: string;
  divisions: string[];
  courts: string[];
  gameLength: number;
  breakLength: number;
  teamCount: number;
  gameCount: number;
};

const FORMAT_LABELS: Record<string, string> = {
  single_elim: "Single Elimination",
  double_elim: "Double Elimination",
  round_robin: "Round Robin",
  pool_play: "Pool Play",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  published: "bg-blue-500/20 text-blue-400",
  active: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-white/10 text-white/40",
};

export default function TournamentManagePage() {
  const [tournamentList, setTournamentList] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    location: "",
    format: "single_elim",
    divisions: "",
    courts: "",
    gameLength: 40,
    breakLength: 10,
    entryFee: "",
    maxTeamsPerDivision: "",
    registrationDeadline: "",
    registrationOpen: false,
    description: "",
  });

  const DIVISION_OPTIONS = ["8U", "10U", "12U", "14U", "16U", "18U", "Open"];
  const COURT_OPTIONS = ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6"];

  function toggleChip(field: "divisions" | "courts", value: string) {
    const current = form[field]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const idx = current.indexOf(value);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }
    setForm({ ...form, [field]: current.join(", ") });
  }

  function chipSelected(field: "divisions" | "courts", value: string) {
    return form[field]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .includes(value);
  }

  const PRESETS = [
    {
      name: "Weekend Tournament",
      desc: "Multi-day bracket with pool play for 4+ age groups",
      icon: Trophy,
      values: { format: "pool_play", divisions: "8U, 10U, 12U, 14U", courts: "Court 1, Court 2, Court 3", gameLength: 40, breakLength: 10, location: "Inspire Courts AZ" },
    },
    {
      name: "League Night",
      desc: "Round robin on 2 courts -- great for weekly leagues",
      icon: Calendar,
      values: { format: "round_robin", divisions: "Open", courts: "Court 1, Court 2", gameLength: 48, breakLength: 5, location: "Inspire Courts AZ" },
    },
    {
      name: "Single Day Shootout",
      desc: "Fast single-elimination bracket, done in one day",
      icon: Zap,
      values: { format: "single_elim", divisions: "10U, 12U", courts: "Court 1, Court 2, Court 3", gameLength: 32, breakLength: 8, location: "Inspire Courts AZ" },
    },
  ];

  function applyPreset(preset: typeof PRESETS[number]) {
    setForm((prev) => ({
      ...prev,
      ...preset.values,
    }));
    setShowForm(true);
  }

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tournaments");
      if (res.ok) setTournamentList(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const divisions = form.divisions
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const courts = form.courts
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        location: form.location || undefined,
        format: form.format,
        divisions: divisions.length > 0 ? divisions : undefined,
        courts: courts.length > 0 ? courts : ["Court 1", "Court 2"],
        gameLength: form.gameLength,
        breakLength: form.breakLength,
        entryFee: form.entryFee ? Math.round(Number(form.entryFee) * 100) : undefined,
        maxTeamsPerDivision: form.maxTeamsPerDivision ? Number(form.maxTeamsPerDivision) : undefined,
        registrationDeadline: form.registrationDeadline || undefined,
        registrationOpen: form.registrationOpen,
        description: form.description || undefined,
      }),
    });

    if (res.ok) {
      const createdName = form.name;
      setForm({
        name: "",
        startDate: "",
        endDate: "",
        location: "",
        format: "single_elim",
        divisions: "",
        courts: "",
        gameLength: 40,
        breakLength: 10,
        entryFee: "",
        maxTeamsPerDivision: "",
        registrationDeadline: "",
        registrationOpen: false,
        description: "",
      });
      setShowForm(false);
      setSuccessMsg(createdName);
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchTournaments();
    }
    setSaving(false);
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
            Tournament Manager
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Create tournaments, manage brackets, and run game day
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
        >
          {showForm ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {showForm ? "Cancel" : "New Tournament"}
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm font-semibold">
            &ldquo;{successMsg}&rdquo; created successfully!
          </p>
        </div>
      )}

      {/* Create Form */}
      {(showForm || (!loading && tournamentList.length === 0)) && (
        <div className="bg-card border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
            <Plus className="w-4 h-4 text-red" /> Create Tournament
          </h2>

          {/* Quick-Start Template Presets */}
          <div className="mb-6">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Quick Start — Pick a Template
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="text-left bg-navy border border-white/10 hover:border-red/40 rounded-lg p-4 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <preset.icon className="w-4 h-4 text-red" />
                    <span className="text-white font-bold text-sm">{preset.name}</span>
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Step 1: Basic Info */}
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-3">Step 1 — Basic Info</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Tournament Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25"
                    placeholder="e.g. Spring Classic 2026"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Format
                  </label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red cursor-pointer"
                  >
                    <option value="single_elim">Single Elimination</option>
                    <option value="double_elim">Double Elimination</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="pool_play">Pool Play</option>
                  </select>
                  <p className="text-white/30 text-[11px] mt-1.5">Pool Play is best for 4+ team brackets. Single Elim for quick events.</p>
                </div>
              </div>
            </div>

            {/* Step 2: Schedule */}
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-3">Step 2 — Schedule</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                    placeholder="Inspire Courts AZ"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Game Length (min)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={form.gameLength}
                    onChange={(e) =>
                      setForm({ ...form, gameLength: Number(e.target.value) })
                    }
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
                  />
                  <p className="text-white/30 text-[11px] mt-1.5">Standard: 40 min (two 20-min halves)</p>
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Break Between Games (min)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.breakLength}
                    onChange={(e) =>
                      setForm({ ...form, breakLength: Number(e.target.value) })
                    }
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
                  />
                  <p className="text-white/30 text-[11px] mt-1.5">Time between games for court changeover</p>
                </div>
              </div>
            </div>

            {/* Step 3: Divisions & Courts */}
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-3">Step 3 — Divisions & Courts</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Divisions
                  </label>
                  {/* Selected chips */}
                  {form.divisions.split(",").map((d) => d.trim()).filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.divisions.split(",").map((d) => d.trim()).filter(Boolean).map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 bg-red/20 text-red text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:bg-red/30 transition-colors"
                          onClick={() => toggleChip("divisions", d)}
                        >
                          {d}
                          <X className="w-3 h-3" />
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Quick-pick buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {DIVISION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleChip("divisions", d)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                          chipSelected("divisions", d)
                            ? "bg-red/20 border-red/40 text-red"
                            : "bg-navy border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={form.divisions}
                    onChange={(e) => setForm({ ...form, divisions: e.target.value })}
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                    placeholder="Or type custom: 8U, 10U, 12U"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Courts
                  </label>
                  {/* Selected chips */}
                  {form.courts.split(",").map((c) => c.trim()).filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.courts.split(",").map((c) => c.trim()).filter(Boolean).map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:bg-blue-500/30 transition-colors"
                          onClick={() => toggleChip("courts", c)}
                        >
                          {c}
                          <X className="w-3 h-3" />
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Quick-pick buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COURT_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleChip("courts", c)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                          chipSelected("courts", c)
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                            : "bg-navy border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={form.courts}
                    onChange={(e) => setForm({ ...form, courts: e.target.value })}
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                    placeholder="Or type custom: Court 1, Court 2"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Registration */}
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-3">Step 4 — Registration</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Entry Fee ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.entryFee}
                    onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Max Teams Per Division
                  </label>
                  <input
                    type="number"
                    min={2}
                    value={form.maxTeamsPerDivision}
                    onChange={(e) => setForm({ ...form, maxTeamsPerDivision: e.target.value })}
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                    placeholder="8"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    value={form.registrationDeadline}
                    onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Description / Rules
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                    placeholder="Tournament rules, age requirements, etc."
                  />
                </div>
                <div className="flex items-center gap-3 self-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.registrationOpen}
                      onChange={(e) => setForm({ ...form, registrationOpen: e.target.checked })}
                      className="accent-red"
                    />
                    <span className="text-white text-sm">Open Registration</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Tournament
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tournament List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading
          tournaments...
        </div>
      ) : tournamentList.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-white font-bold text-lg mb-1">Create Your First Tournament</h3>
          <p className="text-white/40 text-sm mb-6">
            Set up a tournament in under 60 seconds using a template
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Get Started
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tournamentList.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tournaments/${t.id}`}
              className="block bg-card border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-bold text-base truncate">
                      {t.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] || STATUS_STYLES.draft}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-text-secondary text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(t.startDate + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {t.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {t.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {t.teamCount} teams
                    </span>
                    <span className="flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" />
                      {t.gameCount} games
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-semibold uppercase">
                      {FORMAT_LABELS[t.format] || t.format}
                    </span>
                    {t.divisions.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] bg-red/10 text-red px-2 py-0.5 rounded-full font-semibold"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
