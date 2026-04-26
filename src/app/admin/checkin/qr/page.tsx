"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  QrCode,
  ArrowLeft,
  Printer,
  Search,
} from "lucide-react";

type TeamRow = {
  id: number;
  teamId: number | null;
  tournamentId: number | null;
  teamName: string;
  coachName: string;
  division: string | null;
  playerCount: number;
};

// QR grid for front-desk check-in. Each team gets a QR encoding a
// deep-link URL that, when scanned, loads the /admin/checkin page
// pre-filtered for that team. Admin prints the grid and tapes them
// up at the check-in table.
function qrImageUrl(data: string, size = 240): string {
  // QRServer is free + no auth. Good enough for a gym check-in
  // sign that lives on a taped piece of paper. If print density
  // ever matters we'd swap in a local library.
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

export default function CheckinQRPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState("");
  // Distinguish 'genuinely no teams' from 'fetch failed' so the empty
  // state isn't ambiguous when an admin loads the QR grid before
  // tournaments are seeded vs. when the API hiccupped.
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/checkin-progress");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error || `Couldn't load teams (${res.status}).`);
        return;
      }
      const data = await res.json();
      setTeams(
        (data.teams || []).map((t: TeamRow & { teamName: string; teamId?: number; tournamentId?: number }) => ({
          id: t.id,
          teamId: t.teamId ?? null,
          tournamentId: t.tournamentId ?? null,
          teamName: t.teamName,
          coachName: t.coachName,
          division: t.division,
          playerCount: t.playerCount,
        }))
      );
    } catch {
      setLoadError("Network error.");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
    load();
  }, [load]);

  const filtered = teams.filter((t) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      t.teamName.toLowerCase().includes(s) ||
      (t.division || "").toLowerCase().includes(s) ||
      t.coachName.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin/checkin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4 no-print">
        <ArrowLeft className="w-3.5 h-3.5" /> Check-In
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 no-print">
        <div>
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Check-In</p>
          <h1 className="text-navy text-3xl font-bold font-heading flex items-center gap-2">
            <QrCode className="w-7 h-7 text-red" /> Team QR Codes
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Print this grid + post at the front desk. Teams scan their QR to jump straight to the check-in flow.
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <button
            onClick={() => window.print()}
            className="bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="relative mb-6 no-print">
        <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team / coach / division"
          className="w-full bg-white border border-border rounded-2xl pl-9 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
        />
      </div>

      {loadError ? (
        <div className="bg-red/5 border border-red/20 rounded-2xl p-8 text-center">
          <p className="text-navy font-bold mb-1">Couldn&apos;t load teams</p>
          <p className="text-text-muted text-sm mb-4">{loadError}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center text-text-muted">
          No registered teams yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
          {filtered.map((t) => {
            // New self-service URL: /checkin?t=<tournamentId>&team=<teamId>&teamName=<name>
            // Falls back to teamName-only when we don't have IDs (legacy
            // sheet-only data). Auth-required, role-aware on the page.
            const params = new URLSearchParams();
            if (t.tournamentId) params.set("t", String(t.tournamentId));
            if (t.teamId) params.set("team", String(t.teamId));
            params.set("teamName", t.teamName);
            const url = `${origin}/checkin?${params.toString()}`;
            return (
              <article key={t.id} className="bg-white border border-border rounded-2xl p-5 flex flex-col items-center text-center print:break-inside-avoid">
                <p className="text-navy font-bold text-sm leading-tight truncate w-full">{t.teamName}</p>
                {t.division && (
                  <p className="text-text-muted text-xs mb-3">{t.division}</p>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl(url)}
                  alt={`QR code for ${t.teamName}`}
                  className="w-40 h-40 sm:w-48 sm:h-48 my-2"
                />
                <p className="text-text-muted text-[11px] mt-2 truncate w-full">{t.coachName}</p>
                {t.playerCount > 0 && (
                  <p className="text-text-muted text-[11px]">{t.playerCount} players</p>
                )}
                {t.tournamentId && t.teamId && (
                  <a
                    href={`/api/checkin/wallet-pass?t=${t.tournamentId}&team=${t.teamId}&platform=apple`}
                    className="no-print mt-2 text-[10px] uppercase tracking-wider font-bold text-navy hover:text-red"
                  >
                    + Wallet pass
                  </a>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
