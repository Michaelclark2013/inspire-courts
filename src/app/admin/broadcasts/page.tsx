"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  ArrowLeft,
  Send,
  Users as UsersIcon,
  FileText,
} from "lucide-react";

type Team = {
  id: number;
  teamName: string;
  coachName: string;
  division: string | null;
};

// Admin-side team broadcast tool. Pick a team (from the active
// tournament's registrations), write a subject + body, send → every
// parent email on the roster + coach email get BCC'd.
export default function BroadcastsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/checkin-progress");
      if (!res.ok) return;
      const data = await res.json();
      setTeams(
        (data.teams || []).map((t: Team) => ({
          id: t.id,
          teamName: t.teamName,
          coachName: t.coachName,
          division: t.division,
        }))
      );
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName || !subject.trim() || !body.trim()) {
      setError("Pick a team, subject, and write the message.");
      return;
    }
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/admin/teams/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          subject: subject.trim(),
          html: `<div style="font-family: -apple-system, sans-serif;">${body.replace(/\n/g, "<br/>")}</div>`,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed");
      }
      const data = await res.json();
      setResult(`Sent to ${data.sent} of ${data.recipients} recipients.`);
      setSubject(""); setBody("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Communications</p>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-red" />
            Team Broadcasts
          </h1>
          <p className="text-white/60 text-sm mt-2 max-w-xl">
            Send an email to every parent + coach linked to a specific team.
          </p>
        </div>
      </section>

      <form onSubmit={send} className="bg-white border border-border rounded-2xl shadow-sm p-5 space-y-4 max-w-2xl">
        <div>
          <label htmlFor="bc-team" className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <UsersIcon className="w-3 h-3" /> Team <span className="text-red" aria-hidden="true">*</span>
          </label>
          <select id="bc-team" value={teamName} onChange={(e) => setTeamName(e.target.value)} required aria-required="true" className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60">
            <option value="">— Pick a team —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.teamName}>
                {t.teamName}{t.division ? ` (${t.division})` : ""} · {t.coachName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bc-subject" className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">
            Subject <span className="text-red" aria-hidden="true">*</span>
          </label>
          <input id="bc-subject" value={subject} onChange={(e) => setSubject(e.target.value)} required aria-required="true" className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60" placeholder="Saturday schedule update" />
        </div>
        <div>
          <label htmlFor="bc-body" className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Message <span className="text-red" aria-hidden="true">*</span>
          </label>
          <textarea id="bc-body" value={body} onChange={(e) => setBody(e.target.value)} rows={8} required aria-required="true" className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60 resize-none" placeholder="Write your message here…" />
          <p className="text-text-muted text-[11px] mt-1">Line breaks preserved. HTML not allowed directly.</p>
        </div>

        {result && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2.5 text-sm">{result}</div>}
        {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-4 py-2.5 text-sm">{error}</div>}

        <button type="submit" disabled={busy} className="bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider flex items-center gap-2">
          <Send className="w-3.5 h-3.5" /> {busy ? "Sending…" : "Send Broadcast"}
        </button>
      </form>
    </div>
  );
}
