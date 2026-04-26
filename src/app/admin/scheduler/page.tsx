"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Check } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Suggestion = {
  shiftId: number;
  shiftTitle: string;
  shiftStartAt: string;
  shiftEndAt: string;
  shiftRole: string | null;
  needed: number;
  candidates: Array<{ userId: number; name: string; score: number; reasons: string[] }>;
};

const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function SchedulerPage() {
  useDocumentTitle("Scheduler");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Map<number, number>>(new Map());
  const [applying, setApplying] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/scheduler", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setSuggestions(json.suggestions || []);
        // Pre-pick the top candidate per shift.
        const initial = new Map<number, number>();
        for (const s of json.suggestions) {
          if (s.candidates[0]) initial.set(s.shiftId, s.candidates[0].userId);
        }
        setPicks(initial);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function togglePick(shiftId: number, userId: number) {
    setPicks((prev) => {
      const next = new Map(prev);
      if (next.get(shiftId) === userId) next.delete(shiftId);
      else next.set(shiftId, userId);
      return next;
    });
  }

  async function applyAll() {
    if (picks.size === 0) return;
    setApplying(true);
    setMsg(null);
    try {
      const pairs = Array.from(picks.entries()).map(([shiftId, userId]) => ({ shiftId, userId }));
      const res = await adminFetch("/api/admin/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairs }),
      });
      const json = await res.json();
      setMsg(`Applied ${json.applied} assignment${json.applied === 1 ? "" : "s"} ✓`);
      await load();
    } finally {
      setApplying(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  if (loading) return <div className="p-8 text-text-muted">Computing suggestions…</div>;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <div className="mb-5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">AI Scheduler</p>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
            Auto-fill open shifts
          </h1>
          <p className="text-text-muted text-sm mt-1">Next 14 days · {suggestions.length} shifts need bodies</p>
        </div>
        <button
          onClick={applyAll}
          disabled={applying || picks.size === 0}
          className="bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm"
        >
          <Sparkles className="w-4 h-4" />
          Apply {picks.size} {picks.size === 1 ? "assignment" : "assignments"}
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-4">
          {msg}
        </div>
      )}

      {suggestions.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <Check className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="text-emerald-700 font-bold">Every shift in the next 14 days is fully staffed.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li key={s.shiftId} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <p className="text-navy font-bold">{s.shiftTitle}</p>
                  <p className="text-xs text-text-muted">
                    {fmtDT(s.shiftStartAt)} → {fmtDT(s.shiftEndAt)} · needs {s.needed}{s.shiftRole ? ` · ${s.shiftRole}` : ""}
                  </p>
                </div>
              </div>
              {s.candidates.length === 0 ? (
                <p className="text-text-muted text-xs italic">No qualified candidates — review staff availability + role tags.</p>
              ) : (
                <div className="space-y-1.5">
                  {s.candidates.map((c) => {
                    const picked = picks.get(s.shiftId) === c.userId;
                    return (
                      <button
                        key={c.userId}
                        onClick={() => togglePick(s.shiftId, c.userId)}
                        className={`w-full text-left rounded-lg px-3 py-2 flex items-start gap-3 border ${
                          picked ? "bg-emerald-50 border-emerald-300" : "bg-off-white border-transparent hover:border-border"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                          picked ? "bg-emerald-600 border-emerald-600 text-white" : "border-border"
                        }`}>
                          {picked && <Check className="w-3 h-3" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-navy font-semibold">
                            {c.name}
                            <span className="text-text-muted ml-2 text-xs font-normal">score {c.score}</span>
                          </p>
                          <p className="text-xs text-text-muted">{c.reasons.join(" · ") || "Match"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
