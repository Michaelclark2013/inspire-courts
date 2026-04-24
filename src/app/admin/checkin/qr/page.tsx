"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  QrCode,
  ArrowLeft,
  Printer,
  Download,
  Search,
} from "lucide-react";

type TeamRow = {
  id: number;
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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/checkin-progress");
      if (!res.ok) return;
      const data = await res.json();
      setTeams(
        (data.teams || []).map((t: TeamRow & { teamName: string }) => ({
          id: t.id,
          teamName: t.teamName,
          coachName: t.coachName,
          division: t.division,
          playerCount: t.playerCount,
        }))
      );
    } catch { /* ignore */ }
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
    <div className="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 max-w-full">
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

      {filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center text-text-muted">
          No registered teams yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
          {filtered.map((t) => {
            const url = `${origin}/admin/checkin?team=${encodeURIComponent(t.teamName)}`;
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
