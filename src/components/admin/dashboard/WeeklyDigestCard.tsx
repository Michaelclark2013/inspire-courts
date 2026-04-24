"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowUpRight, FileText, Send } from "lucide-react";

// Small admin-dashboard affordance: view this week's ops summary as
// JSON (for spot-checking) or trigger the HTML summary to be emailed
// to your account. Calls /api/admin/weekly-digest.
export default function WeeklyDigestCard() {
  const [busy, setBusy] = useState<"view" | "send" | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function view() {
    setBusy("view");
    setResult(null);
    try {
      const res = await fetch("/api/admin/weekly-digest");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const s = data.summary;
      const fmt = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
      setResult(
        `Rental ${fmt(s.rentalRevenueCents)} · ` +
        `Tournaments ${fmt(s.tournamentRevenueCents)} · ` +
        `Expenses ${fmt(s.expenseCents)} · ` +
        `${s.newSignups} signups · ` +
        `${s.gamesPlayed} games · ` +
        `${s.checkins} check-ins`
      );
    } catch (err) { setResult((err as Error).message); }
    finally { setBusy(null); }
  }

  async function send() {
    setBusy("send");
    setResult(null);
    try {
      const res = await fetch("/api/admin/weekly-digest?send=1");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(`Emailed weekly digest to ${data.to}.`);
    } catch (err) { setResult((err as Error).message); }
    finally { setBusy(null); }
  }

  return (
    <section aria-label="Weekly digest" className="mb-6">
      <div className="bg-white border border-border rounded-2xl shadow-sm p-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-navy" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-navy font-bold text-sm">Weekly Ops Digest</p>
            <p className="text-text-muted text-xs">
              Last 7 days: revenue, expenses, signups, games, check-ins, compliance.
            </p>
            {result && <p className="text-text-muted text-[11px] mt-1 truncate">{result}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={view}
            disabled={busy !== null}
            className="bg-white border border-border hover:bg-off-white text-navy text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <FileText className="w-3 h-3" /> {busy === "view" ? "…" : "View"}
          </button>
          <button
            onClick={send}
            disabled={busy !== null}
            className="bg-red hover:bg-red-hover disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <Send className="w-3 h-3" /> {busy === "send" ? "Sending…" : "Email Me"}
          </button>
          <Link
            href="/admin/revenue"
            className="text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1"
          >
            Finance <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
