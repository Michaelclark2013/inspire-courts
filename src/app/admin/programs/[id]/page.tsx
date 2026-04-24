"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users, Calendar, CheckCircle2 } from "lucide-react";

type Session = {
  id: number;
  programId: number;
  programName: string | null;
  programType: string | null;
  priceCents: number | null;
  startsAt: string;
  endsAt: string;
  instructorUserId: number | null;
  instructorName: string | null;
  location: string | null;
  status: string;
  capacity: number | null;
  enrolled: number;
  waitlist: number;
  openSeats: number | null;
};

type Registration = {
  id: number;
  sessionId: number;
  participantName: string;
  participantEmail: string | null;
  participantPhone: string | null;
  guardianName: string | null;
  status: string;
  paid: boolean;
  amountCents: number | null;
  registeredAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  registered: "bg-emerald-50 text-emerald-700",
  waitlist: "bg-amber-50 text-amber-700",
  attended: "bg-cyan-50 text-cyan-700",
  no_show: "bg-red/10 text-red",
  cancelled: "bg-navy/10 text-navy/70",
};

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return iso; }
}
function fmtCents(c: number | null): string { if (c == null) return "—"; return `$${(c / 100).toFixed(2)}`; }

export default function ProgramDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const programId = Number(params.id);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showRegForm, setShowRegForm] = useState<Session | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/programs/sessions?programId=${programId}`);
      if (res.ok) setSessions((await res.json()).data || []);
    } finally { setLoading(false); }
  }, [programId]);

  const loadRegs = useCallback(async (sessionId: number) => {
    const res = await fetch(`/api/admin/programs/registrations?sessionId=${sessionId}`);
    if (res.ok) setRegistrations((await res.json()).data || []);
  }, []);

  useEffect(() => { if (status === "authenticated") loadSessions(); }, [status, loadSessions]);
  useEffect(() => { if (activeSession) loadRegs(activeSession.id); }, [activeSession, loadRegs]);

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  const programName = sessions[0]?.programName ?? "Program";

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8">
      <Link href="/admin/programs" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-navy mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to programs
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            {programName} Sessions
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {sessions.length} upcoming sessions in next 60 days.
          </p>
        </div>
        <button onClick={() => setShowSessionForm(true)}
          className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90">
          <Plus className="w-4 h-4" /> New Session
        </button>
      </div>

      {loading ? (
        <div className="text-text-secondary text-sm">Loading…</div>
      ) : sessions.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Calendar className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No upcoming sessions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white border border-border rounded-lg p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div>
                  <div className="font-semibold text-navy">{fmtDate(s.startsAt)} → {fmtDate(s.endsAt)}</div>
                  <div className="text-xs text-text-secondary">
                    {s.location && <>{s.location} · </>}
                    {s.instructorName && <>Instructor: {s.instructorName} · </>}
                    Status: {s.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <Users className="inline w-3.5 h-3.5 mr-1 text-text-secondary" />
                    <span className="font-mono font-semibold text-navy">{s.enrolled}</span>
                    {s.capacity != null && <span className="text-text-secondary"> / {s.capacity}</span>}
                  </div>
                  {s.waitlist > 0 && <div className="text-xs text-amber-700">+{s.waitlist} waitlist</div>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveSession(s === activeSession ? null : s)}
                  className="text-xs bg-navy/10 text-navy rounded px-2 py-1 hover:bg-navy/20">
                  {activeSession?.id === s.id ? "Hide roster" : "View roster"}
                </button>
                <button onClick={() => setShowRegForm(s)}
                  className="text-xs bg-emerald-600 text-white rounded px-2 py-1 hover:bg-emerald-700">
                  + Register
                </button>
              </div>

              {activeSession?.id === s.id && (
                <div className="mt-4 bg-off-white rounded-lg p-3">
                  {registrations.length === 0 ? (
                    <p className="text-xs text-text-secondary italic">No registrations yet.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="text-text-secondary uppercase tracking-wide text-[10px]">
                        <tr><th className="text-left pb-1">Participant</th><th className="text-left">Status</th><th className="text-left">Paid</th><th></th></tr>
                      </thead>
                      <tbody>
                        {registrations.map((r) => (
                          <tr key={r.id} className="border-t border-border">
                            <td className="py-1.5">
                              <div className="font-medium text-navy">{r.participantName}</div>
                              {r.participantEmail && <div className="text-text-secondary">{r.participantEmail}</div>}
                              {r.guardianName && <div className="text-[10px] text-text-secondary italic">Guardian: {r.guardianName}</div>}
                            </td>
                            <td><span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] ${STATUS_STYLES[r.status]}`}>{r.status}</span></td>
                            <td>
                              {r.paid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                  <CheckCircle2 className="w-3 h-3" /> {fmtCents(r.amountCents)}
                                </span>
                              ) : (
                                <span className="text-text-secondary">unpaid</span>
                              )}
                            </td>
                            <td className="text-right">
                              <button onClick={async () => {
                                await fetch("/api/admin/programs/registrations", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, status: r.status === "attended" ? "registered" : "attended" }) });
                                loadRegs(s.id);
                              }} className="text-[10px] text-navy hover:text-red">
                                {r.status === "attended" ? "Undo" : "Attended"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showSessionForm && (
        <SessionModal programId={programId} onClose={() => setShowSessionForm(false)} onSaved={() => { setShowSessionForm(false); loadSessions(); }} />
      )}
      {showRegForm && (
        <RegistrationModal session={showRegForm} onClose={() => setShowRegForm(null)} onSaved={() => { setShowRegForm(null); loadSessions(); if (activeSession) loadRegs(activeSession.id); }} />
      )}
    </div>
  );
}

function SessionModal({ programId, onClose, onSaved }: { programId: number; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ startsAt: "", endsAt: "", location: "", capacityOverride: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/admin/programs/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          location: form.location || null,
          capacityOverride: form.capacityOverride ? Number(form.capacityOverride) : null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-navy mb-4">New Session</h2>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Start</span>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">End</span>
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          </div>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Location</span>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Court 3" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Capacity override</span>
            <input type="number" value={form.capacityOverride} onChange={(e) => setForm({ ...form, capacityOverride: e.target.value })} placeholder="uses program default if blank" className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          {err && <div className="text-red text-xs">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-navy text-white rounded-md text-sm hover:bg-navy/90 disabled:opacity-50">
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrationModal({ session: s, onClose, onSaved }: { session: Session; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ participantName: "", participantEmail: "", participantPhone: "", guardianName: "", guardianPhone: "", paid: false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/admin/programs/registrations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: s.id,
          participantName: form.participantName,
          participantEmail: form.participantEmail || null,
          participantPhone: form.participantPhone || null,
          guardianName: form.guardianName || null,
          guardianPhone: form.guardianPhone || null,
          paid: form.paid,
        }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-navy mb-1">Register Participant</h2>
        <p className="text-xs text-text-secondary mb-4">
          {fmtDate(s.startsAt)} · {s.openSeats != null ? `${s.openSeats} seats left` : "unlimited seats"}
        </p>
        <div className="space-y-3 text-sm">
          <label className="block"><span className="block text-xs text-text-secondary mb-1">Name *</span>
            <input value={form.participantName} onChange={(e) => setForm({ ...form, participantName: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Email</span>
              <input type="email" value={form.participantEmail} onChange={(e) => setForm({ ...form, participantEmail: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Phone</span>
              <input value={form.participantPhone} onChange={(e) => setForm({ ...form, participantPhone: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Guardian</span>
              <input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
            <label className="block"><span className="block text-xs text-text-secondary mb-1">Guardian Phone</span>
              <input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" /></label>
          </div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} />
            <span className="text-xs text-text-secondary">Paid ({fmtCents(s.priceCents)})</span>
          </label>
          {err && <div className="text-red text-xs">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Saving…" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
