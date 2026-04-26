"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import ProgressRing from "@/components/ui/ProgressRing";
import { SELECT_CLASS } from "@/lib/form-styles";

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
  draft: "bg-gray-100 text-gray-600",
  published: "bg-blue-50 text-blue-600",
  active: "bg-emerald-50 text-emerald-600",
  completed: "bg-gray-100 text-gray-500",
};

export default function TournamentManagePage() {
  const [tournamentList, setTournamentList] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [createError, setCreateError] = useState("");

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

  // Full youth age range 8U through 17U + 18U + Open. Every odd age
  // was missing from the chip list before ("14U to 16U" skipped 15U),
  // forcing admins to type custom divisions.
  const DIVISION_OPTIONS = [
    "8U", "9U", "10U", "11U", "12U", "13U", "14U", "15U", "16U", "17U", "18U", "Open",
  ];
  // 7 physical courts. Courts 2 + 3 are the SMALLER side courts —
  // marked separately so admins don't accidentally schedule big-age
  // divisions on them.
  const COURT_OPTIONS = ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6", "Court 7"];
  const SMALL_COURTS = new Set(["Court 2", "Court 3"]);

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
      if (res.ok) {
        const body = await res.json();
        // API now returns { data, total }; accept bare array for safety.
        setTournamentList(Array.isArray(body) ? body : body.data || []);
      }
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
    setCreateError("");

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
        entryFee: "350",
        maxTeamsPerDivision: "",
        registrationDeadline: "",
        registrationOpen: false,
        description: "",
      });
      setShowForm(false);
      setSuccessMsg(createdName);
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchTournaments();
    } else {
      const data = await res.json().catch(() => ({}));
      setCreateError(data.error || "Failed to create tournament — please try again");
    }
    setSaving(false);
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-4 md:mb-8 flex items-start justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Tournaments
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Create tournaments, manage brackets, and run game day
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="md:ml-auto flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors min-h-[44px]"
        >
          {showForm ? (
            <X className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Plus className="w-4 h-4" aria-hidden="true" />
          )}
          {showForm ? "Cancel" : "New Tournament"}
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-3 animate-fade-in">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-emerald-700 text-sm font-semibold">
            &ldquo;{successMsg}&rdquo; created successfully!
          </p>
        </div>
      )}

      {/* Create Form */}
      {(showForm || (!loading && tournamentList.length === 0)) && (
        <div className="bg-white border border-border shadow-sm rounded-xl p-6 mb-8">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
            <Plus className="w-4 h-4 text-red" aria-hidden="true" /> Create Tournament
          </h2>

          {createError && (
            <div className="bg-red/10 border border-red/30 text-red text-sm rounded-lg px-4 py-3 mb-4 flex items-center justify-between" role="alert">
              <span>{createError}</span>
              <button type="button" onClick={() => setCreateError("")} className="ml-4 text-red/60 hover:text-red text-xs font-bold">✕</button>
            </div>
          )}

          {/* Quick-Start Template Presets */}
          <div className="mb-6">
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" aria-hidden="true" /> Quick Start — Pick a Template
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="text-left bg-off-white border border-border hover:border-red/40 hover:shadow-sm rounded-lg p-4 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <preset.icon className="w-4 h-4 text-red" />
                    <span className="text-navy font-bold text-sm">{preset.name}</span>
                  </div>
                  <p className="text-text-muted text-xs leading-relaxed">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Step 1: Basic Info */}
            <div>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-3">Step 1 — Basic Info</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label htmlFor="tm-name" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Tournament Name<span className="text-red ml-0.5">*</span>
                  </label>
                  <input
                    id="tm-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoFocus={showForm}
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-text-muted/50"
                    placeholder="e.g. Spring Classic 2026"
                  />
                </div>
                <div>
                  <label htmlFor="tm-format" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Format
                  </label>
                  <select
                    id="tm-format"
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className={SELECT_CLASS}
                  >
                    <option value="single_elim">Single Elimination</option>
                    <option value="double_elim">Double Elimination</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="pool_play">Pool Play</option>
                  </select>
                  <p className="text-text-muted text-[11px] mt-1.5">Pool Play is best for 4+ team brackets. Single Elim for quick events.</p>
                </div>
              </div>
            </div>

            {/* Step 2: Schedule */}
            <div>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-3">Step 2 — Schedule</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="tm-startDate" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Start Date<span className="text-red ml-0.5">*</span>
                  </label>
                  <input
                    id="tm-startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                  />
                </div>
                <div>
                  <label htmlFor="tm-endDate" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    id="tm-endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                  />
                </div>
                <div>
                  <label htmlFor="tm-location" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    id="tm-location"
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                    placeholder="Inspire Courts AZ"
                  />
                </div>
                <div>
                  <label htmlFor="tm-gameLength" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Game Length (min)
                  </label>
                  <input
                    id="tm-gameLength"
                    type="number"
                    min={10}
                    value={form.gameLength}
                    onChange={(e) =>
                      setForm({ ...form, gameLength: Number(e.target.value) })
                    }
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                  />
                  <p className="text-text-muted text-[11px] mt-1.5">Standard: 40 min (two 20-min halves)</p>
                </div>
                <div>
                  <label htmlFor="tm-breakLength" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Break Between Games (min)
                  </label>
                  <input
                    id="tm-breakLength"
                    type="number"
                    min={0}
                    value={form.breakLength}
                    onChange={(e) =>
                      setForm({ ...form, breakLength: Number(e.target.value) })
                    }
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                  />
                  <p className="text-text-muted text-[11px] mt-1.5">Time between games for court changeover</p>
                </div>
              </div>
            </div>

            {/* Step 3: Divisions & Courts */}
            <div>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-3">Step 3 — Divisions & Courts</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tm-divisions" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
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
                          <X className="w-3 h-3" aria-hidden="true" />
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
                            : "bg-white border-border text-text-muted hover:border-navy/30 hover:text-navy"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    id="tm-divisions"
                    value={form.divisions}
                    onChange={(e) => setForm({ ...form, divisions: e.target.value })}
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                    placeholder="Or type custom: 8U, 10U, 12U"
                  />
                </div>
                <div>
                  <label htmlFor="tm-courts" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Courts
                  </label>
                  {/* Selected chips */}
                  {form.courts.split(",").map((c) => c.trim()).filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.courts.split(",").map((c) => c.trim()).filter(Boolean).map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => toggleChip("courts", c)}
                        >
                          {c}
                          <X className="w-3 h-3" aria-hidden="true" />
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Quick-pick buttons. Courts 2 + 3 are the smaller
                      side courts — rendered in amber so admins don't
                      accidentally schedule older / bigger-age divisions
                      on them. The asterisk keeps the distinction
                      visible even when the chip is selected. */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COURT_OPTIONS.map((c) => {
                      const small = SMALL_COURTS.has(c);
                      const selected = chipSelected("courts", c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleChip("courts", c)}
                          title={small ? "Smaller side court — best for younger age groups" : undefined}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            small
                              ? selected
                                ? "bg-amber-100 border-amber-400 text-amber-800"
                                : "bg-amber-50 border-amber-300 text-amber-700 hover:border-amber-500"
                              : selected
                              ? "bg-blue-50 border-blue-300 text-blue-600"
                              : "bg-white border-border text-text-muted hover:border-navy/30 hover:text-navy"
                          }`}
                        >
                          {c}
                          {small && <span className="ml-0.5" aria-hidden="true">*</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-amber-700 mb-2">
                    <span className="font-semibold">* Courts 2 &amp; 3</span> are our smaller side courts — best for 8U–12U divisions.
                  </p>
                  <input
                    type="text"
                    id="tm-courts"
                    value={form.courts}
                    onChange={(e) => setForm({ ...form, courts: e.target.value })}
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                    placeholder="Or type custom: Court 1, Court 2"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Registration */}
            <div>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-3">Step 4 — Registration</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="tm-entryFee" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Entry Fee ($)
                  </label>
                  <input
                    id="tm-entryFee"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.entryFee}
                    onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label htmlFor="tm-maxTeams" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Max Teams Per Division
                  </label>
                  <input
                    id="tm-maxTeams"
                    type="number"
                    min={2}
                    value={form.maxTeamsPerDivision}
                    onChange={(e) => setForm({ ...form, maxTeamsPerDivision: e.target.value })}
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                    placeholder="8"
                  />
                </div>
                <div>
                  <label htmlFor="tm-regDeadline" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Registration Deadline
                  </label>
                  <input
                    id="tm-regDeadline"
                    type="date"
                    value={form.registrationDeadline}
                    onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label htmlFor="tm-description" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Description / Rules
                  </label>
                  <input
                    id="tm-description"
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
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
                    <span className="text-navy text-sm">Open Registration</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit — sticky bar on long forms. On mobile, offset
                upward to clear the bottom tab bar (56px + safe-area). */}
            <div className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] lg:bottom-0 z-20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-border flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="w-4 h-4" aria-hidden="true" />
                )}
                Create Tournament
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-navy/40 hover:text-navy/60 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tournament List */}
      {loading ? (
        <div className="flex items-center justify-center py-8 md:py-16 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" /> Loading tournaments...
        </div>
      ) : tournamentList.length === 0 ? (
        <div className="text-center py-8 md:py-14 text-text-muted">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
          <h3 className="text-navy font-bold text-lg mb-1">Create Your First Tournament</h3>
          <p className="text-text-muted text-sm mb-6">
            Set up a tournament in under 60 seconds using a template
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Get Started
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tournamentList.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tournament Card with ripple, progress ring, hover preview ── */
function TournamentCard({ tournament: t }: { tournament: Tournament }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  function handleRipple(e: React.MouseEvent) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const circle = document.createElement("span");
    circle.className = "ripple-circle";
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    card.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }

  // Compute a simple progress: teamCount vs a reasonable max (8 per division)
  const maxTeams = Math.max(t.divisions.length * 8, 8);
  const progressPct = Math.min(100, Math.round((t.teamCount / maxTeams) * 100));

  return (
    <Link
      ref={cardRef}
      key={t.id}
      href={`/admin/tournaments/${t.id}`}
      className="block bg-white border border-border shadow-sm hover:border-red/30 hover:shadow-md rounded-xl p-5 transition-all group ripple-container"
      onClick={handleRipple}
      onMouseEnter={(e) => {
        setHovered(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseMove={(e) => {
        if (hovered) {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-navy font-bold text-base truncate">
              {t.name}
            </h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] || STATUS_STYLES.draft}`}
            >
              {t.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-text-secondary text-xs flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {new Date(t.startDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {t.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                {t.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              {t.teamCount} teams
            </span>
            <span className="flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" aria-hidden="true" />
              {t.gameCount} games
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold uppercase">
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
        <div className="flex items-center gap-3 flex-shrink-0">
          <ProgressRing percent={progressPct} size={36} strokeWidth={3} />
          <ChevronRight className="w-5 h-5 text-navy/40 group-hover:text-navy/60 transition-colors" aria-hidden="true" />
        </div>
      </div>

      {/* Hover preview tooltip */}
      {hovered && (
        <div
          className="absolute z-30 bg-navy text-white text-xs rounded-lg shadow-xl px-4 py-3 pointer-events-none min-w-[180px]"
          style={{
            left: Math.min(mousePos.x + 12, 280),
            top: mousePos.y - 80,
          }}
        >
          <p className="font-bold mb-1 text-sm">{t.name}</p>
          <p className="text-white/70">Teams: {t.teamCount} &middot; Games: {t.gameCount}</p>
          <p className="text-white/70">Format: {FORMAT_LABELS[t.format] || t.format}</p>
          <p className="text-white/70">Status: {t.status}</p>
          <p className="text-white/50 mt-1">Registration: {progressPct}% full</p>
        </div>
      )}
    </Link>
  );
}
