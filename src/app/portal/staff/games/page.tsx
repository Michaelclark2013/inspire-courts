"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  Clock,
  CheckCircle2,
  User,
  AlertCircle,
  Undo2,
  Camera,
  Flag,
  QrCode,
  Users as UsersIcon,
  Radio,
  WifiOff,
} from "lucide-react";
import { triggerHaptic } from "@/lib/capacitor";
import { useOfflineSync } from "@/hooks/useOfflineSync";

type Game = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  division: string | null;
  court: string | null;
  eventName: string | null;
  scheduledTime: string | null;
  status: "scheduled" | "live" | "final";
  homeScore: number;
  awayScore: number;
  lastQuarter: string | null;
  enteredByName: string | null;
  enteredAt: string | null;
  isMine: boolean;
};

type PlayEvent = {
  id: number;
  team: "home" | "away";
  playType: string;
  points: number;
  playerName: string | null;
  playerJersey: number | null;
  quarter: string | null;
  recordedAt: string;
};

type Scorer = {
  userId: number;
  name: string | null;
  photoUrl: string | null;
  lastHeartbeatAt: string;
};

function fmtTime(iso: string | null): string {
  if (!iso) return "TBD";
  try { return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  catch { return iso; }
}

export default function StaffGamesPage() {
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/staff/my-games");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setGames(data.games || []);
      setError(null);
    } catch (err) { setError((err as Error).message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const mine = (games || []).filter((g) => g.isMine);
  const others = (games || []).filter((g) => !g.isMine);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href="/portal/staff" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Staff Portal
      </Link>

      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Score Entry</p>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-red" /> My Games Today
          </h1>
          <p className="text-white/60 text-sm mt-2">
            Every tap saves. Undo rewinds the last score. Finalize attaches a scoreboard photo.
          </p>
        </div>
      </section>

      {error && (
        <div className="bg-red/10 border border-red/20 text-red rounded-2xl px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {games === null ? (
        <div className="bg-white border border-border rounded-2xl p-8 text-center text-text-muted">Loading…</div>
      ) : games.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <ClipboardList className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-navy font-bold">No games scheduled today.</p>
        </div>
      ) : (
        <>
          {mine.length > 0 && (
            <Section title="On Your Courts" icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}>
              {mine.map((g) => (
                <GameRow key={g.id} game={g} active={activeGameId === g.id} onToggle={() => setActiveGameId(activeGameId === g.id ? null : g.id)} onRefresh={load} />
              ))}
            </Section>
          )}
          {others.length > 0 && (
            <Section title="All Today's Games">
              {others.map((g) => (
                <GameRow key={g.id} game={g} active={activeGameId === g.id} onToggle={() => setActiveGameId(activeGameId === g.id ? null : g.id)} onRefresh={load} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2 px-1">
        {icon}
        <h2 className="text-navy font-bold text-xs uppercase tracking-widest">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function GameRow({ game, active, onToggle, onRefresh }: { game: Game; active: boolean; onToggle: () => void; onRefresh: () => void }) {
  const statusStyle =
    game.status === "live" ? "bg-red/10 text-red" :
    game.status === "final" ? "bg-emerald-50 text-emerald-700" :
    "bg-off-white text-text-muted";

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${active ? "border-red/40" : "border-border"}`}>
      <button onClick={onToggle} className="w-full text-left p-4 flex items-center gap-3 active:bg-off-white">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-navy font-bold text-sm truncate flex-1">{game.homeTeam}</p>
            <span className="text-navy font-heading font-bold text-xl tabular-nums">{game.homeScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-navy font-bold text-sm truncate flex-1">{game.awayTeam}</p>
            <span className="text-navy font-heading font-bold text-xl tabular-nums">{game.awayScore}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-text-muted flex-wrap">
            {game.court && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{game.court}</span>}
            {game.scheduledTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(game.scheduledTime)}</span>}
            {game.division && <span>{game.division}</span>}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyle}`}>{game.status}</span>
            {game.isMine && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Your court</span>}
          </div>
          {game.enteredByName && (
            <p className="text-text-muted text-[11px] mt-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Last by <span className="text-navy font-semibold">{game.enteredByName}</span>
            </p>
          )}
        </div>
      </button>

      {active && <ScoringPanel game={game} onRefresh={onRefresh} />}
    </div>
  );
}

function ScoringPanel({ game, onRefresh }: { game: Game; onRefresh: () => void }) {
  const { data: session } = useSession();
  const myId = Number(session?.user?.id) || 0;
  const { isOnline, queueMutation, pendingCount } = useOfflineSync();

  const [homeScore, setHomeScore] = useState(game.homeScore);
  const [awayScore, setAwayScore] = useState(game.awayScore);
  const [quarter, setQuarter] = useState(game.lastQuarter || "1");
  const [events, setEvents] = useState<PlayEvent[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [busy, setBusy] = useState(false);
  const [undoBusy, setUndoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [showFinalize, setShowFinalize] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/staff/score/play?gameId=${game.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch { /* ignore */ }
  }, [game.id]);

  useEffect(() => {
    let alive = true;
    async function beat() {
      try {
        await fetch("/api/portal/staff/score/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: game.id }),
        });
      } catch { /* ignore */ }
    }
    async function fetchScorers() {
      try {
        const res = await fetch(`/api/portal/staff/score/heartbeat?gameId=${game.id}`);
        if (res.ok && alive) {
          const data = await res.json();
          setScorers(data.scorers || []);
        }
      } catch { /* ignore */ }
    }
    beat(); fetchScorers(); loadEvents();
    heartbeatRef.current = setInterval(() => { beat(); fetchScorers(); }, 10_000);
    return () => {
      alive = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      fetch(`/api/portal/staff/score/heartbeat?gameId=${game.id}`, { method: "DELETE" }).catch(() => {});
    };
  }, [game.id, loadEvents]);

  async function addPlay(team: "home" | "away", playType: string, points: number) {
    setBusy(true);
    setError(null);
    triggerHaptic("light");
    const payload = { gameId: game.id, team, playType, points, quarter };

    if (!isOnline) {
      await queueMutation({
        url: "/api/portal/staff/score/play",
        method: "POST",
        body: payload,
        type: "score",
      });
      if (team === "home") setHomeScore((s) => s + points);
      else setAwayScore((s) => s + points);
      setFlash(`Queued offline (+${points})`);
      setTimeout(() => setFlash(null), 1500);
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/portal/staff/score/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed");
      }
      const data = await res.json();
      setHomeScore(data.homeScore);
      setAwayScore(data.awayScore);
      triggerHaptic("success");
      setFlash(`${team === "home" ? game.homeTeam : game.awayTeam} +${points}`);
      setTimeout(() => setFlash(null), 1200);
      loadEvents();
      onRefresh();
    } catch (err) {
      triggerHaptic("error");
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function undoLast() {
    const last = events[0];
    if (!last) return;
    setUndoBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/staff/score/play?id=${last.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Undo failed (${res.status})`);
      }
      const data = await res.json();
      setHomeScore(data.homeScore);
      setAwayScore(data.awayScore);
      triggerHaptic("warning");
      setFlash(`Undid ${last.team === "home" ? game.homeTeam : game.awayTeam} ${last.playType.replace(/_/g, " ")}`);
      setTimeout(() => setFlash(null), 1800);
      loadEvents();
      onRefresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUndoBusy(false);
    }
  }

  const homeBox = events.filter((e) => e.team === "home");
  const awayBox = events.filter((e) => e.team === "away");
  const otherScorers = scorers.filter((s) => s.userId !== myId);

  return (
    <div className="border-t border-border p-4 bg-off-white/40 space-y-3">
      {otherScorers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Also scoring:{" "}
            {otherScorers.map((s, i) => (
              <span key={s.userId} className="font-semibold">
                {s.name || "Someone"}{i < otherScorers.length - 1 ? ", " : ""}
              </span>
            ))}
          </span>
        </div>
      )}

      {(!isOnline || pendingCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          {!isOnline ? "Offline — taps queue and sync on reconnect." : `${pendingCount} pending sync…`}
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Qtr</label>
        <div className="flex gap-1">
          {["1", "2", "3", "4", "OT"].map((q) => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full transition-colors ${
                quarter === q ? "bg-navy text-white" : "bg-white border border-border text-text-muted"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TeamControls teamLabel={game.homeTeam} score={homeScore} onTap={(t, p) => addPlay("home", t, p)} busy={busy} />
        <TeamControls teamLabel={game.awayTeam} score={awayScore} onTap={(t, p) => addPlay("away", t, p)} busy={busy} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={undoLast}
          disabled={undoBusy || events.length === 0}
          className="bg-white border border-border hover:bg-off-white disabled:opacity-40 text-navy text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full flex items-center gap-1.5"
        >
          <Undo2 className="w-3.5 h-3.5" />
          {undoBusy ? "Undoing…" : events.length === 0 ? "Nothing to undo" : `Undo last (${events[0].points}pt)`}
        </button>
        <Link
          href={`/scores/live/${game.id}`}
          target="_blank"
          className="bg-white border border-border hover:bg-off-white text-navy text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full flex items-center gap-1.5"
        >
          <QrCode className="w-3.5 h-3.5" /> Big scoreboard
        </Link>
        {flash && (
          <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {flash}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red/10 border border-red/20 text-red rounded-xl px-3 py-2 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {events.length > 0 && (
        <details className="bg-white border border-border rounded-xl overflow-hidden">
          <summary className="px-3 py-2 text-navy text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2">
            <UsersIcon className="w-3.5 h-3.5" /> Box Score · {events.length} plays
          </summary>
          <div className="grid grid-cols-2 divide-x divide-border">
            <BoxList label={game.homeTeam} items={homeBox} />
            <BoxList label={game.awayTeam} items={awayBox} />
          </div>
        </details>
      )}

      <button
        onClick={() => setShowFinalize(true)}
        disabled={game.status === "final"}
        className="w-full bg-red hover:bg-red-hover disabled:opacity-40 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-sm flex items-center justify-center gap-2"
      >
        <Flag className="w-4 h-4" />
        {game.status === "final" ? "Already final" : "Finalize & Photo"}
      </button>

      {showFinalize && (
        <FinalizeDialog
          gameId={game.id}
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          homeScore={homeScore}
          awayScore={awayScore}
          onClose={() => setShowFinalize(false)}
          onDone={() => { setShowFinalize(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

function TeamControls({
  teamLabel, score, onTap, busy,
}: {
  teamLabel: string;
  score: number;
  onTap: (playType: string, points: number) => void;
  busy: boolean;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-3">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider truncate">{teamLabel}</p>
        <span className="text-navy font-heading font-bold text-3xl tabular-nums">{score}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Btn label="Field Goal" points={2} onClick={() => onTap("field_goal", 2)} disabled={busy} tone="navy" />
        <Btn label="3-Pointer" points={3} onClick={() => onTap("three_pointer", 3)} disabled={busy} tone="red" />
        <Btn label="Free Throw" points={1} onClick={() => onTap("free_throw", 1)} disabled={busy} tone="emerald" />
        <Btn label="Foul" points={0} onClick={() => onTap("foul", 0)} disabled={busy} tone="amber" />
      </div>
    </div>
  );
}

function Btn({ label, points, onClick, disabled, tone }: {
  label: string;
  points: number;
  onClick: () => void;
  disabled: boolean;
  tone: "red" | "navy" | "emerald" | "amber";
}) {
  const cls =
    tone === "red" ? "bg-red text-white hover:bg-red-hover" :
    tone === "navy" ? "bg-navy text-white hover:bg-navy/90" :
    tone === "emerald" ? "bg-emerald-600 text-white hover:bg-emerald-500" :
    "bg-amber-500 text-white hover:bg-amber-400";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${cls} disabled:opacity-50 rounded-lg px-2 py-2 text-[11px] font-bold uppercase tracking-wider active:scale-95 flex flex-col items-center leading-tight min-h-[52px]`}
    >
      <span>{label}</span>
      {points > 0 && <span className="text-[9px] font-normal opacity-80">+{points}</span>}
    </button>
  );
}

function BoxList({ label, items }: { label: string; items: PlayEvent[] }) {
  return (
    <div className="p-3">
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-2">{label}</p>
      <ul className="space-y-1 max-h-40 overflow-y-auto text-xs">
        {items.length === 0 ? (
          <li className="text-text-muted">—</li>
        ) : (
          items.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="font-heading font-bold tabular-nums text-navy w-5">+{e.points}</span>
              <span className="text-navy">{e.playType.replace(/_/g, " ")}</span>
              {e.playerName && <span className="text-text-muted">· {e.playerName}</span>}
              {e.quarter && <span className="text-text-muted/70 ml-auto">Q{e.quarter}</span>}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function FinalizeDialog({
  gameId, homeTeam, awayTeam, homeScore, awayScore, onClose, onDone,
}: {
  gameId: number;
  homeTeam: string; awayTeam: string;
  homeScore: number; awayScore: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhoto(file: File) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const im = new Image();
        im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
        im.onerror = reject;
        im.src = url;
      });
      const maxW = 1200;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");
      ctx.drawImage(img, 0, 0, w, h);
      let dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      for (const q of [0.75, 0.65, 0.55]) {
        if (dataUrl.length < 280_000) break;
        dataUrl = canvas.toDataURL("image/jpeg", q);
      }
      setPhotoDataUrl(dataUrl);
    } catch (err) {
      setError((err as Error).message || "Photo error");
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/staff/score/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, homeScore, awayScore, photoDataUrl }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Finalize failed");
      }
      triggerHaptic("success");
      onDone();
    } catch (err) {
      triggerHaptic("error");
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-navy font-bold text-lg font-heading flex items-center gap-2">
            <Flag className="w-5 h-5 text-red" /> Finalize
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-navy p-1">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-off-white rounded-2xl p-4 text-center">
            <p className="text-text-muted text-xs uppercase tracking-wider">Final Score</p>
            <p className="text-navy font-heading font-bold text-2xl mt-1">
              {homeTeam} <span className="tabular-nums">{homeScore}</span>
              {" — "}
              <span className="tabular-nums">{awayScore}</span> {awayTeam}
            </p>
          </div>
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" /> Scoreboard photo (recommended)
            </label>
            <p className="text-text-muted text-xs mb-2">
              Snap the physical scoreboard. Used to settle disputes.
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }}
              className="block w-full text-sm text-navy file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-navy file:text-white file:font-bold file:uppercase file:tracking-wider file:text-xs"
            />
            {photoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoDataUrl} alt="Scoreboard preview" className="mt-3 w-full rounded-xl border border-border" />
            )}
          </div>
          {error && (
            <div className="bg-red/10 border border-red/20 text-red rounded-xl px-3 py-2 text-sm">{error}</div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 text-navy font-semibold py-3 rounded-xl border border-border hover:bg-off-white text-sm">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-sm"
          >
            {busy ? "Submitting…" : "Confirm Final"}
          </button>
        </div>
      </div>
    </div>
  );
}
