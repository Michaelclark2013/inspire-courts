"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { parseCsv } from "@/lib/csv";

type Row = {
  firstName: string; lastName: string;
  email?: string; phone?: string; birthDate?: string;
  membershipPlanId?: number; planName?: string;
  status?: "active" | "paused" | "past_due" | "cancelled" | "trial";
  source?: "website" | "walk_in" | "referral" | "tournament" | "instagram" | "google" | "other";
  joinedAt: string;
  nextRenewalAt?: string; autoRenew?: boolean; notes?: string;
};

type Result =
  | { ok: true; createdCount: number; errors: [] }
  | { ok: true; dryRun: true; previewCount: number; firstPreview: unknown[]; errors: [] }
  | { ok: false; errors: Array<{ rowIndex: number; error: string }>; createdCount: number };

// Maps CSV column names → row keys, supporting several common aliases
// so admins can paste from Sheets / ClubReady / MindBody exports with
// minimal cleanup.
const COLUMN_ALIASES: Record<string, keyof Row> = {
  "first name": "firstName", "firstname": "firstName", "given name": "firstName",
  "last name": "lastName", "lastname": "lastName", "surname": "lastName",
  "email": "email", "email address": "email",
  "phone": "phone", "mobile": "phone", "phone number": "phone", "cell": "phone",
  "birth date": "birthDate", "birthday": "birthDate", "dob": "birthDate",
  "plan": "planName", "plan name": "planName", "membership plan": "planName", "membership": "planName",
  "status": "status",
  "source": "source",
  "joined": "joinedAt", "joined at": "joinedAt", "join date": "joinedAt", "member since": "joinedAt",
  "next renewal": "nextRenewalAt", "renewal": "nextRenewalAt", "renewal date": "nextRenewalAt",
  "auto renew": "autoRenew", "auto-renew": "autoRenew",
  "notes": "notes", "note": "notes",
};

function normalizeDate(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function MemberImportPage() {
  const { data: session, status } = useSession();
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<Row[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function doParse() {
    setResult(null);
    const { header, rows: csvRows } = parseCsv(raw);
    const warnings: string[] = [];
    const keyMap: Record<string, keyof Row | null> = {};
    for (const h of header) {
      const key = COLUMN_ALIASES[h.toLowerCase()] ?? null;
      keyMap[h] = key;
      if (!key) warnings.push(`Column "${h}" ignored`);
    }
    const out: Row[] = [];
    for (let i = 0; i < csvRows.length; i++) {
      const src = csvRows[i];
      const r: Partial<Row> = {};
      for (const h of header) {
        const key = keyMap[h];
        const v = src[h]?.trim();
        if (!key || !v) continue;
        if (key === "joinedAt" || key === "nextRenewalAt" || key === "birthDate") {
          const iso = normalizeDate(v);
          if (iso) (r as Record<string, unknown>)[key] = iso;
          else warnings.push(`Row ${i + 2}: unparseable date "${v}" in ${h}`);
        } else if (key === "autoRenew") {
          const lc = v.toLowerCase();
          (r as Record<string, unknown>).autoRenew = lc === "true" || lc === "yes" || lc === "1";
        } else {
          (r as Record<string, unknown>)[key] = v;
        }
      }
      if (!r.firstName || !r.lastName) {
        warnings.push(`Row ${i + 2}: missing firstName or lastName — skipped`);
        continue;
      }
      if (!r.joinedAt) r.joinedAt = new Date().toISOString();
      out.push(r as Row);
    }
    setParsed(out);
    setParseWarnings(warnings);
  }

  async function submit(dryRun: boolean) {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/members/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed, dryRun }),
      });
      const json = await res.json();
      setResult(json);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8">
      <Link href="/admin/members" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-navy mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to members
      </Link>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
          Import Members (CSV)
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Upload or paste CSV from Sheets, ClubReady, MindBody — we map
          common column names. Up to 1,000 rows per run.
        </p>
      </div>

      <div className="bg-white border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy mb-3">1. Provide CSV</h2>
        <div className="flex flex-wrap gap-3 mb-3">
          <label className="inline-flex items-center gap-2 text-sm bg-navy text-white rounded-md px-3 py-1.5 cursor-pointer hover:bg-navy/90">
            <Upload className="w-4 h-4" /> Choose file
            <input type="file" accept=".csv,text/csv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              className="hidden" />
          </label>
          <button onClick={doParse} disabled={!raw.trim()}
            className="text-sm bg-emerald-600 text-white rounded-md px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-50">
            Parse
          </button>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="First Name,Last Name,Email,Phone,Plan,Joined,Next Renewal,Auto Renew
Jane,Smith,jane@example.com,555-0100,Unlimited Monthly,2025-01-15,2026-01-15,true
..."
          rows={8}
          className="w-full bg-off-white border border-border rounded p-2 font-mono text-xs"
        />
        <p className="text-[10px] text-text-secondary mt-2">
          Recognized columns: First Name, Last Name, Email, Phone, Birth Date,
          Plan, Status, Source, Joined, Next Renewal, Auto Renew, Notes.
        </p>
      </div>

      {parsed.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy mb-3">
            2. Review ({parsed.length} rows parsed)
          </h2>

          {parseWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-900">
              <div className="font-semibold mb-1">Warnings</div>
              <ul className="list-disc pl-4 space-y-0.5">
                {parseWarnings.slice(0, 10).map((w, i) => <li key={i}>{w}</li>)}
                {parseWarnings.length > 10 && <li>… and {parseWarnings.length - 10} more</li>}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-off-white text-text-secondary uppercase tracking-wide text-[10px]">
                <tr>
                  <th className="px-2 py-1 text-left">Name</th>
                  <th className="px-2 py-1 text-left">Email / Phone</th>
                  <th className="px-2 py-1 text-left">Plan</th>
                  <th className="px-2 py-1 text-left">Joined</th>
                  <th className="px-2 py-1 text-left">Renewal</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1 text-navy">{r.firstName} {r.lastName}</td>
                    <td className="px-2 py-1 text-text-secondary">{r.email || r.phone || "—"}</td>
                    <td className="px-2 py-1 text-text-secondary">{r.planName || "—"}</td>
                    <td className="px-2 py-1 text-text-secondary">{r.joinedAt?.slice(0, 10)}</td>
                    <td className="px-2 py-1 text-text-secondary">{r.nextRenewalAt?.slice(0, 10) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 20 && (
              <p className="text-[10px] text-text-secondary mt-2">Showing first 20 of {parsed.length}.</p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={() => submit(true)} disabled={submitting}
              className="text-sm bg-white border border-border text-navy rounded-md px-3 py-1.5 hover:bg-off-white disabled:opacity-50">
              <FileText className="w-3.5 h-3.5 inline-block mr-1" />
              Dry run (validate only)
            </button>
            <button onClick={() => submit(false)} disabled={submitting}
              className="text-sm bg-emerald-600 text-white rounded-md px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-50">
              Import {parsed.length} members
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`border rounded-xl p-5 ${
          result.ok ? "bg-emerald-50 border-emerald-200" : "bg-red/5 border-red/20"
        }`}>
          {result.ok ? (
            "dryRun" in result ? (
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-900">
                    Dry run passed · {result.previewCount} rows ready
                  </div>
                  <div className="text-emerald-700 mt-1">No data written. Click &quot;Import&quot; to commit.</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-900">
                    Imported {result.createdCount} members
                  </div>
                  <Link href="/admin/members" className="text-emerald-700 underline hover:text-emerald-800">
                    View roster →
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-red flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red">Import failed · {result.errors.length} errors</div>
                <ul className="mt-2 space-y-0.5 text-xs text-red/80 list-disc pl-4">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i}>Row {e.rowIndex + 2}: {e.error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
