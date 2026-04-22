"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Clock, LogIn, LogOut, Loader2, AlertCircle } from "lucide-react";

type OpenEntry = {
  id: number;
  clockInAt: string;
  role: string | null;
  source: string;
  payRateCents: number;
  payRateType: string;
};

type StatusPayload = {
  onStaff: boolean;
  staffStatus: string | null;
  roleTags: string;
  openEntry: OpenEntry | null;
};

function fmtDuration(sinceIso: string): string {
  const mins = Math.floor((Date.now() - Date.parse(sinceIso)) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StaffClockPage() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [role, setRole] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);
  // Tick every 30s so the elapsed-time label updates without re-fetch.
  const [, forceTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(iv);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/portal/clock");
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const json = (await res.json()) as StatusPayload;
      setState(json);
      // Pre-fill the role dropdown with the first role tag if unset.
      if (!role && json.roleTags) {
        const first = json.roleTags.split(",").map((s) => s.trim()).filter(Boolean)[0];
        if (first) setRole(first);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  async function getCoords(): Promise<{ lat: string; lng: string } | null> {
    if (typeof navigator === "undefined" || !navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude.toFixed(5),
            lng: pos.coords.longitude.toFixed(5),
          }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 60_000 }
      );
    });
  }

  async function clockIn() {
    setBusy(true);
    setErr("");
    try {
      const coords = await getCoords();
      const res = await fetch("/api/portal/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role || undefined,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          source: "mobile",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Clock-in failed");
      }
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Clock-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function clockOut() {
    setBusy(true);
    setErr("");
    try {
      const coords = await getCoords();
      const res = await fetch("/api/portal/clock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          breakMinutes: breakMinutes || 0,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Clock-out failed");
      }
      setBreakMinutes(0);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Clock-out failed");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return null;
  if (status === "unauthenticated") redirect("/login?callbackUrl=/portal/staff/clock");

  return (
    <div className="min-h-screen bg-off-white p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading mb-1">
          Clock In / Out
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {session?.user?.name ? `Hi, ${session.user.name}.` : ""} Your shift will be
          logged to the time-clock for admin approval.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : !state?.onStaff ? (
          <div className="bg-white border border-border rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <p className="text-navy font-semibold mb-1">Not on the staff roster</p>
            <p className="text-text-secondary text-sm">
              Ask an admin to add you before you can clock in.
            </p>
          </div>
        ) : state.staffStatus !== "active" ? (
          <div className="bg-white border border-border rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red mx-auto mb-3" />
            <p className="text-navy font-semibold mb-1">
              Status: {state.staffStatus}
            </p>
            <p className="text-text-secondary text-sm">
              Clock-in is disabled. Contact an admin.
            </p>
          </div>
        ) : state.openEntry ? (
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded px-2 py-1 text-xs font-semibold mb-4">
              <Clock className="w-3 h-3" /> Clocked in
            </div>
            <div className="text-3xl font-bold text-navy font-mono mb-1">
              {fmtDuration(state.openEntry.clockInAt)}
            </div>
            <div className="text-sm text-text-secondary mb-5">
              Since{" "}
              {new Date(state.openEntry.clockInAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
              {state.openEntry.role ? ` · ${state.openEntry.role}` : ""}
            </div>

            <label className="block mb-4">
              <span className="block text-xs text-text-secondary mb-1">
                Unpaid break (minutes)
              </span>
              <input
                type="number"
                min={0}
                max={480}
                value={breakMinutes}
                onChange={(e) =>
                  setBreakMinutes(Math.max(0, Math.min(480, Number(e.target.value) || 0)))
                }
                className="w-full bg-off-white border border-border rounded px-3 py-2"
              />
            </label>

            <button
              onClick={clockOut}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 bg-red text-white font-semibold rounded-lg py-3 hover:bg-red/90 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              Clock Out
            </button>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 bg-navy/10 text-navy/70 rounded px-2 py-1 text-xs font-semibold mb-4">
              Not clocked in
            </div>

            {state.roleTags && (
              <label className="block mb-4">
                <span className="block text-xs text-text-secondary mb-1">
                  Role for this shift
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-off-white border border-border rounded px-3 py-2"
                >
                  {state.roleTags
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <button
              onClick={clockIn}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold rounded-lg py-3 hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              Clock In
            </button>
          </div>
        )}

        {err && (
          <div className="mt-4 bg-red/5 border border-red/20 rounded-lg p-3 text-red text-sm">
            {err}
          </div>
        )}
      </div>
    </div>
  );
}
