"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  Loader2,
  AlertTriangle,
  UserPlus,
  ChevronRight,
  Users,
  Zap,
  XCircle,
} from "lucide-react";
import { EligibilityChip } from "@/components/portal/EligibilityChip";
import type { EligibilityResult } from "@/lib/eligibility";

type RosterPlayer = {
  id: number;
  name: string;
  jerseyNumber: string | null;
  division: string | null;
  birthDate: string | null;
  grade: string | null;
  waiverOnFile: boolean;
  photoUrl: string | null;
  parentUserId: number | null;
  eligibility: EligibilityResult;
  checkedIn: boolean;
};

type Context = {
  tournament: { id: number; name: string; startDate: string };
  team: { id: number; name: string; division: string | null };
  roster: RosterPlayer[];
  nextGame: {
    id: number;
    scheduledTime: string | null;
    court: string | null;
    opponent: string;
    homeOrAway: "home" | "away";
  } | null;
  geofence: { lat: number; lng: number; radiusMeters: number } | null;
  registration: { rosterSubmitted: boolean; paymentStatus: string } | null;
  role: "admin" | "staff" | "front_desk" | "coach" | "parent";
};

function fmtTime(iso: string | null): string {
  if (!iso) return "TBD";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/Phoenix",
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function CheckinInner() {
  const search = useSearchParams();
  const tournamentId = Number(search.get("t"));
  const teamId = Number(search.get("team"));
  const teamNameQ = search.get("teamName") || "";

  const { status } = useSession();
  const [ctx, setCtx] = useState<Context | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showWalkin, setShowWalkin] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "checking" | "ok" | "outside" | "denied">("idle");

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("t", String(tournamentId));
      if (teamId) params.set("team", String(teamId));
      if (teamNameQ) params.set("teamName", teamNameQ);
      const res = await fetch(`/api/checkin/context?${params}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Failed (${res.status})`);
        return;
      }
      setCtx(await res.json());
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [tournamentId, teamId, teamNameQ]);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [load, status]);

  // Geofence soft-check — runs once on mount if config present.
  useEffect(() => {
    if (!ctx?.geofence) return;
    if (!("geolocation" in navigator)) return;
    setGeoStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dLat = pos.coords.latitude - ctx.geofence!.lat;
        const dLng = pos.coords.longitude - ctx.geofence!.lng;
        // Quick approximate distance — full haversine on the server.
        const meters = Math.sqrt(dLat * dLat + dLng * dLng) * 111_000;
        setGeoStatus(meters <= ctx.geofence!.radiusMeters ? "ok" : "outside");
      },
      () => setGeoStatus("denied"),
      { timeout: 4000, maximumAge: 60_000 },
    );
  }, [ctx?.geofence]);

  async function checkIn(p: RosterPlayer, opts?: { acceptIneligible?: boolean }) {
    setBusyIds((prev) => new Set(prev).add(p.id));
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: p.id,
          teamName: ctx!.team.name,
          division: p.division || ctx!.team.division,
          tournamentId: ctx!.tournament.id,
          source: "qr",
          acceptIneligible: opts?.acceptIneligible ?? false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback(`${p.name}: ${data.error || data.message || "failed"}`);
        return;
      }
      setFeedback(
        data.alreadyCheckedIn
          ? `${p.name} already checked in`
          : `${p.name} checked in${data.isLate ? " (late)" : ""}`,
      );
      await load();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
    }
  }

  async function bulkCheckIn() {
    if (!ctx) return;
    const targets = ctx.roster.filter((p) => !p.checkedIn && p.eligibility.eligible);
    if (targets.length === 0) {
      setFeedback("Nobody to check in");
      return;
    }
    setBulkBusy(true);
    try {
      // Sequential — keeps the UI feedback ordered + avoids hammering
      // the API. ~50ms / row for a typical roster.
      for (const p of targets) {
        await checkIn(p);
      }
      setFeedback(`Checked in ${targets.length} player${targets.length === 1 ? "" : "s"}`);
    } finally {
      setBulkBusy(false);
    }
  }

  if (status === "loading") {
    return <CheckinShell><LoadingChip>Authenticating…</LoadingChip></CheckinShell>;
  }
  if (status === "unauthenticated") {
    return (
      <CheckinShell>
        <div className="bg-white border border-border rounded-xl p-6 text-center">
          <p className="text-navy font-semibold mb-2">Sign in to check in</p>
          <Link
            href={`/login?from=${encodeURIComponent(`/checkin?t=${tournamentId}&team=${teamId || ""}&teamName=${encodeURIComponent(teamNameQ)}`)}`}
            className="inline-flex items-center gap-2 bg-red text-white rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wider"
          >
            Sign in
          </Link>
        </div>
      </CheckinShell>
    );
  }
  if (loading) {
    return <CheckinShell><LoadingChip>Loading roster…</LoadingChip></CheckinShell>;
  }
  if (error || !ctx) {
    return (
      <CheckinShell>
        <div className="bg-red/10 border border-red/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-red font-semibold">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            {error || "Could not load check-in"}
          </div>
        </div>
      </CheckinShell>
    );
  }

  const eligibleCount = ctx.roster.filter((p) => !p.checkedIn && p.eligibility.eligible).length;
  const checkedInCount = ctx.roster.filter((p) => p.checkedIn).length;
  const canBulk = eligibleCount > 0 && (ctx.role === "coach" || ctx.role === "admin" || ctx.role === "front_desk" || ctx.role === "staff");
  const canWalkin = ctx.role === "admin" || ctx.role === "staff" || ctx.role === "front_desk";

  return (
    <CheckinShell>
      {/* Header */}
      <header className="mb-5">
        <p className="text-text-muted text-[11px] uppercase tracking-[0.2em]">Check-In</p>
        <h1 className="text-navy text-2xl sm:text-3xl font-bold font-heading">
          {ctx.team.name}
        </h1>
        <p className="text-text-muted text-sm mt-0.5">
          {ctx.tournament.name}
          {ctx.team.division ? ` · ${ctx.team.division}` : ""}
        </p>
      </header>

      {/* Wayfinding card — most useful piece of info after check-in */}
      {ctx.nextGame && (
        <section className="mb-5 bg-navy text-white rounded-2xl p-4 sm:p-5">
          <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
            Next Game
          </p>
          <p className="text-xl font-bold">vs. {ctx.nextGame.opponent}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {fmtTime(ctx.nextGame.scheduledTime)}
            </span>
            {ctx.nextGame.court && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                {ctx.nextGame.court}
              </span>
            )}
            <span className="text-white/60 text-xs uppercase tracking-wider">
              {ctx.nextGame.homeOrAway}
            </span>
          </div>
        </section>
      )}

      {/* Geofence soft hint */}
      {geoStatus === "outside" && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-amber-700 text-xs">
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          You appear to be off-site. Make sure you&apos;re actually at the gym before checking in.
        </div>
      )}

      {/* Bulk action + counter */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-text-muted text-sm">
          {checkedInCount} / {ctx.roster.length} checked in
        </p>
        {canBulk && (
          <button
            type="button"
            onClick={bulkCheckIn}
            disabled={bulkBusy}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider"
          >
            {bulkBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Zap className="w-4 h-4" aria-hidden="true" />
            )}
            Check in all ({eligibleCount})
          </button>
        )}
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-emerald-800 text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Roster list */}
      <ul className="space-y-2">
        {ctx.roster.length === 0 ? (
          <li className="text-text-muted text-sm text-center py-8">
            No players on the roster yet. {ctx.role === "coach" && (
              <>
                Open <Link href="/portal/roster" className="text-red font-semibold underline">My Roster</Link> to add some.
              </>
            )}
          </li>
        ) : (
          ctx.roster.map((p) => {
            const busy = busyIds.has(p.id);
            return (
              <li
                key={p.id}
                className={
                  "border rounded-xl p-3 flex items-center gap-3 " +
                  (p.checkedIn
                    ? "bg-emerald-50 border-emerald-200"
                    : !p.eligibility.eligible
                    ? "bg-red/5 border-red/20"
                    : "bg-white border-border")
                }
              >
                <div className="w-10 h-10 rounded-full bg-navy/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {p.photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-navy text-xs font-bold">
                      #{p.jerseyNumber || "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-navy font-semibold truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <EligibilityChip result={p.eligibility} size="xs" />
                    {!p.waiverOnFile && (
                      <span
                        title="Waiver not on file — sign before play"
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5 font-semibold"
                      >
                        <XCircle className="w-3 h-3" aria-hidden="true" /> No waiver
                      </span>
                    )}
                  </div>
                </div>
                {p.checkedIn ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    Checked in
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => checkIn(p)}
                    disabled={busy}
                    className={
                      "px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0 " +
                      (p.eligibility.eligible
                        ? "bg-red hover:bg-red-hover text-white disabled:opacity-50"
                        : "bg-text-muted/20 text-text-muted disabled:opacity-50")
                    }
                  >
                    {busy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    Check in
                  </button>
                )}
              </li>
            );
          })
        )}
      </ul>

      {/* Walk-in (admin only) */}
      {canWalkin && (
        <div className="mt-5">
          {showWalkin ? (
            <WalkinForm
              tournamentId={ctx.tournament.id}
              teamName={ctx.team.name}
              division={ctx.team.division}
              onCancel={() => setShowWalkin(false)}
              onSaved={async () => {
                setShowWalkin(false);
                setFeedback("Walk-in added + checked in");
                await load();
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowWalkin(true)}
              className="w-full inline-flex items-center justify-center gap-2 border border-dashed border-border hover:border-navy/40 rounded-xl py-3 text-sm font-semibold text-text-muted hover:text-navy transition-colors"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              Add walk-in player
            </button>
          )}
        </div>
      )}

      {/* Footer link to history */}
      <div className="mt-5 text-center">
        <Link
          href="/portal"
          className="text-text-muted text-xs hover:text-navy"
        >
          ← Back to portal
        </Link>
      </div>
    </CheckinShell>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<CheckinShell><LoadingChip>Loading…</LoadingChip></CheckinShell>}>
      <CheckinInner />
    </Suspense>
  );
}

function CheckinShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-off-white">
      <header className="bg-white border-b border-border px-4 py-3 flex items-center gap-2">
        <Users className="w-5 h-5 text-red" aria-hidden="true" />
        <h1 className="text-navy text-sm font-bold uppercase tracking-wider">Inspire Check-In</h1>
      </header>
      <div className="max-w-xl mx-auto p-4 sm:p-6">{children}</div>
    </div>
  );
}

function LoadingChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-text-muted text-sm py-8 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      {children}
    </div>
  );
}

// ── Walk-in form (admin only) ─────────────────────────────────────
function WalkinForm({
  tournamentId,
  teamName,
  division,
  onCancel,
  onSaved,
}: {
  tournamentId: number;
  teamName: string;
  division: string | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [grade, setGrade] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200_000) {
      setError("Photo too large — keep under 200KB");
      return;
    }
    const r = new FileReader();
    r.onload = () => setPhoto(typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkin/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          playerName: name.trim(),
          jerseyNumber: jersey || null,
          birthDate: birthDate || null,
          grade: grade || null,
          division,
          tournamentId,
          photoUrl: photo,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || `Failed (${res.status})`);
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-white border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-navy text-sm">Walk-in player</p>
        <button type="button" onClick={onCancel} className="text-text-muted text-xs">Cancel</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Jersey #</label>
          <input
            type="text"
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
            className="w-full bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Grade</label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="8th"
            className="w-full bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Birth Date</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">
            Photo (optional)
          </label>
          {photo ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="Preview" className="w-12 h-12 rounded-full object-cover" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="text-text-muted text-xs hover:text-red"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 border border-dashed border-border rounded-lg px-3 py-2 text-text-muted text-xs hover:border-navy/40"
            >
              <Camera className="w-3.5 h-3.5" aria-hidden="true" />
              Capture / upload
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />
        </div>
      </div>
      {error && (
        <div className="text-red text-xs flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        Add + check in
      </button>
    </form>
  );
}
