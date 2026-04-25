"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, CheckCircle2, AlertTriangle, Clock, X } from "lucide-react";

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  planName: string | null;
  lastVisitAt: string | null;
};

type RecentCheckIn = {
  name: string;
  type: string;
  at: number; // client-side timestamp
};

function fmtRelative(from: number): string {
  const diff = Date.now() - from;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// Front-desk fast-lookup check-in kiosk. Big search input, live
// results (members with matching name / email / phone), one-click
// check-in with type. Auto-clears after check-in ready for the
// next person in line. Recent-check-ins sidebar shows the last 10
// so staff can visually confirm.
export default function KioskPage() {
  const { data: session, status } = useSession();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<RecentCheckIn[]>([]);
  const [flash, setFlash] = useState<{ msg: string; tone: "success" | "warn" | "error" } | null>(null);
  const [, tick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tick every 15s so "Xs ago" labels update.
  useEffect(() => {
    const iv = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(iv);
  }, []);

  // Keep focus on the input — front desk should be able to scan /
  // type without clicking. Click into another field breaks the flow.
  useEffect(() => {
    const refocus = () => {
      if (document.activeElement?.tagName !== "INPUT") inputRef.current?.focus();
    };
    const iv = setInterval(refocus, 3_000);
    return () => clearInterval(iv);
  }, []);

  // Debounced search — 200ms after typing stops.
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/members?q=${encodeURIComponent(q.trim())}&status=`);
        if (res.ok) setResults((await res.json()).data || []);
      } finally {
        setSearching(false);
      }
    }, 200);
  }, [q]);

  const doCheckIn = useCallback(
    async (m: Member, type: string) => {
      try {
        const res = await fetch("/api/admin/members/visits", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: m.id, type }),
        });
        if (res.ok) {
          setFlash({ msg: `${m.firstName} ${m.lastName} — ${type.replace("_", " ")}`, tone: "success" });
          setRecent((prev) => [{ name: `${m.firstName} ${m.lastName}`, type, at: Date.now() }, ...prev].slice(0, 10));
          setQ("");
          setResults([]);
          inputRef.current?.focus();
        } else {
          const j = await res.json().catch(() => ({}));
          setFlash({ msg: j.error || "Check-in failed", tone: j.status === "past_due" || j.status === "cancelled" ? "warn" : "error" });
        }
      } catch {
        setFlash({ msg: "Network error", tone: "error" });
      } finally {
        setTimeout(() => setFlash(null), 3000);
      }
    },
    []
  );

  // Enter key on single result = check in as open_gym (fastest path)
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length === 1) {
      e.preventDefault();
      doCheckIn(results[0], "open_gym");
    }
    if (e.key === "Escape") {
      setQ("");
      setResults([]);
    }
  };

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-off-white p-3 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-navy">
            <ArrowLeft className="w-4 h-4" /> Exit kiosk
          </Link>
          <div className="text-xs text-text-secondary">
            {new Date().toLocaleString([], { weekday: "long", hour: "numeric", minute: "2-digit" })}
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy font-heading">
            Member Check-In
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Type name, scan barcode, or hit Enter to check in.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
          <Search className="w-6 h-6 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search name, email, phone…"
            aria-label="Search check-in by name, email, or phone"
            className="w-full bg-white border-2 border-border rounded-xl pl-14 pr-4 py-5 text-2xl font-medium text-navy focus:border-navy outline-none"
          />
          {q && (
            <button onClick={() => { setQ(""); setResults([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-navy">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* RESULTS */}
        {q.trim().length >= 2 && (
          <div className="space-y-2 mb-6">
            {searching && results.length === 0 ? (
              <div className="text-text-secondary text-sm">Searching…</div>
            ) : results.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-6 text-center">
                <p className="text-navy font-semibold">No matches for &ldquo;{q}&rdquo;</p>
                <p className="text-text-secondary text-sm mt-1">Check spelling or try their phone number.</p>
              </div>
            ) : (
              results.map((m) => (
                <div key={m.id} className="bg-white border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-bold flex-shrink-0">
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-navy truncate">{m.firstName} {m.lastName}</div>
                      <div className="text-xs text-text-secondary truncate">
                        {m.planName || "No plan"} · {m.email || m.phone || "—"}
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5">
                        Status:{" "}
                        <span className={m.status === "active" || m.status === "trial" ? "text-emerald-700" : "text-red"}>
                          {m.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    <button onClick={() => doCheckIn(m, "open_gym")}
                      disabled={m.status === "cancelled" || m.status === "past_due"}
                      className="bg-emerald-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                      Open Gym
                    </button>
                    <button onClick={() => doCheckIn(m, "class")} disabled={m.status === "cancelled" || m.status === "past_due"}
                      className="bg-white border border-border text-navy rounded-md px-3 py-2 text-xs hover:bg-off-white disabled:opacity-50">
                      Class
                    </button>
                    <button onClick={() => doCheckIn(m, "private_training")} disabled={m.status === "cancelled" || m.status === "past_due"}
                      className="bg-white border border-border text-navy rounded-md px-3 py-2 text-xs hover:bg-off-white disabled:opacity-50">
                      Training
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* RECENT */}
        {recent.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-navy/70 mb-2">Just checked in</h2>
            <ul className="divide-y divide-border">
              {recent.map((r, i) => (
                <li key={i} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-navy">
                    <CheckCircle2 className="inline w-3.5 h-3.5 text-emerald-600 mr-1" />
                    {r.name} <span className="text-text-secondary text-xs">· {r.type.replace("_", " ")}</span>
                  </span>
                  <span className="text-xs text-text-secondary inline-flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> {fmtRelative(r.at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FLASH */}
        {flash && (
          <div className={`fixed inset-x-0 bottom-6 mx-auto max-w-md rounded-xl p-4 shadow-lg flex items-center gap-3 ${
            flash.tone === "success" ? "bg-emerald-600 text-white" :
            flash.tone === "warn" ? "bg-amber-600 text-white" :
            "bg-red text-white"
          }`}>
            {flash.tone === "success" ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            <div className="text-lg font-semibold">{flash.msg}</div>
          </div>
        )}
      </div>
    </div>
  );
}
