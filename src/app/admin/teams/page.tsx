import { Users, ImageIcon, Trophy } from "lucide-react";
import Link from "next/link";
import TeamsSheetClient from "@/components/admin/TeamsSheetClient";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";
import { db } from "@/lib/db";
import { tournaments, tournamentRegistrations } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";

export const revalidate = 60;

const DIVISION_ORDER = [
  "18U", "17U", "16U", "15U", "14U", "13U", "12U", "11U", "10U", "9U", "8U",
];

// Active-tournament section at the top, full master DB below.
// Admins asked for the "who's signed up for this weekend" view to be
// one glance away, without leaving the Teams page.
export default async function TeamsPage() {
  // ── Top section: teams registered for the upcoming tournament ─────
  let activeTournament: {
    id: number;
    name: string;
    startDate: string;
    status: string;
  } | null = null;
  let tournamentTeamRegs: Array<{
    id: number;
    teamName: string;
    coachName: string;
    coachEmail: string;
    coachPhone: string | null;
    division: string | null;
    status: string;
    paymentStatus: string;
    entryFeeCents: number | null;
  }> = [];

  try {
    // Prefer an active tournament; fall back to the next published one.
    const upcoming = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        startDate: tournaments.startDate,
        status: tournaments.status,
      })
      .from(tournaments)
      .where(inArray(tournaments.status, ["active", "published"]))
      .orderBy(desc(tournaments.startDate))
      .limit(1);

    if (upcoming.length > 0) {
      activeTournament = upcoming[0];
      const regs = await db
        .select({
          id: tournamentRegistrations.id,
          teamName: tournamentRegistrations.teamName,
          coachName: tournamentRegistrations.coachName,
          coachEmail: tournamentRegistrations.coachEmail,
          coachPhone: tournamentRegistrations.coachPhone,
          division: tournamentRegistrations.division,
          status: tournamentRegistrations.status,
          paymentStatus: tournamentRegistrations.paymentStatus,
          entryFeeCents: tournamentRegistrations.entryFee,
        })
        .from(tournamentRegistrations)
        .where(inArray(tournamentRegistrations.tournamentId, [activeTournament.id]))
        .orderBy(tournamentRegistrations.createdAt);
      tournamentTeamRegs = regs;
    }
  } catch {
    // DB unavailable — show the master-sheet section below.
  }

  // ── Bottom section: master teams database from Google Sheets ──────
  if (!isGoogleConfigured()) {
    return (
      <TeamsPageShell
        activeTournament={activeTournament}
        tournamentTeamRegs={tournamentTeamRegs}
      >
        <div className="bg-off-white border border-border rounded-xl p-5 text-center">
          <Users className="w-10 h-10 text-text-secondary mx-auto mb-3" aria-hidden="true" />
          <p className="text-navy font-semibold mb-1">Google Sheets not connected</p>
          <p className="text-text-secondary text-sm">
            Master-team database lives in Google Sheets. Add
            GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in Vercel.
          </p>
        </div>
      </TeamsPageShell>
    );
  }

  const { rows } = await fetchSheetWithHeaders(SHEETS.masterTeams);

  const TEAM_COLS = ["Team Name", "Team", "Club Name", "Organization"];
  const COACH_COLS = ["Coach", "Head Coach", "Contact Person", "Coach Name"];
  const EMAIL_COLS = ["Email", "Contact Email", "Email Address"];
  const PHONE_COLS = ["Phone", "Phone Number", "Cell", "Contact Phone"];
  const DIV_COLS = ["Division", "Age Group", "Age", "Grade", "Level"];
  const PAY_STATUS_COLS = ["Payment Status", "Paid", "Status", "Payment"];
  const AMOUNT_COLS = ["Amount", "Fee", "Total", "Cost", "$"];
  const NOTES_COLS = ["Notes", "Note", "Comments", "Additional Info"];

  const teams = rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => ({
      teamName: getCol(row, ...TEAM_COLS) || "Unnamed Team",
      coach: getCol(row, ...COACH_COLS) || "—",
      email: getCol(row, ...EMAIL_COLS) || "—",
      phone: getCol(row, ...PHONE_COLS) || "—",
      division: getCol(row, ...DIV_COLS) || "—",
      paymentStatus: getCol(row, ...PAY_STATUS_COLS) || "—",
      amount: getCol(row, ...AMOUNT_COLS) || "—",
      notes: getCol(row, ...NOTES_COLS) || "",
    }));

  const divisionCounts: Record<string, number> = {};
  teams.forEach((t) => {
    divisionCounts[t.division] = (divisionCounts[t.division] || 0) + 1;
  });
  const divisionData = Object.entries(divisionCounts)
    .sort(([a], [b]) => {
      const ai = DIVISION_ORDER.indexOf(a);
      const bi = DIVISION_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([label, value]) => ({ label, value }));

  return (
    <TeamsPageShell
      activeTournament={activeTournament}
      tournamentTeamRegs={tournamentTeamRegs}
    >
      <div className="mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
          All Teams Database
        </h2>
        <p className="text-text-secondary text-xs mt-0.5">
          Master record of every team we&apos;ve worked with — from the Google Sheet.
        </p>
      </div>
      <TeamsSheetClient teams={teams} divisionData={divisionData} />
    </TeamsPageShell>
  );
}

function TeamsPageShell({
  activeTournament,
  tournamentTeamRegs,
  children,
}: {
  activeTournament: {
    id: number;
    name: string;
    startDate: string;
    status: string;
  } | null;
  tournamentTeamRegs: Array<{
    id: number;
    teamName: string;
    coachName: string;
    coachEmail: string;
    coachPhone: string | null;
    division: string | null;
    status: string;
    paymentStatus: string;
    entryFeeCents: number | null;
  }>;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Teams
          </h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">
            Tournament registrations at the top, full database below.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 items-center">
          <Link
            href="/admin/teams/logos"
            className="flex items-center gap-1.5 text-text-secondary hover:text-navy border border-border hover:border-red/40 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" /> Logos
          </Link>
        </div>
      </div>

      {/* Top section: upcoming tournament */}
      <section className="mb-6 bg-white border border-border rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-red" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
                {activeTournament
                  ? `Registered — ${activeTournament.name}`
                  : "No active tournament"}
              </h2>
              {activeTournament && (
                <p className="text-xs text-text-secondary">
                  {tournamentTeamRegs.length} team{tournamentTeamRegs.length === 1 ? "" : "s"} · {activeTournament.status}
                </p>
              )}
            </div>
          </div>
          {activeTournament && (
            <Link
              href={`/admin/tournaments/${activeTournament.id}`}
              className="text-xs font-semibold text-navy hover:text-red"
            >
              Manage →
            </Link>
          )}
        </div>
        {activeTournament ? (
          tournamentTeamRegs.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-6">
              No teams registered yet.
            </p>
          ) : (
            <>
              {/* Mobile: card layout — stacked, tap-friendly */}
              <ul className="md:hidden space-y-2">
                {tournamentTeamRegs.map((r) => (
                  <li
                    key={r.id}
                    className="bg-off-white border border-border rounded-xl p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="font-semibold text-navy truncate">
                          {r.teamName}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {r.coachName}
                          {r.division ? ` · ${r.division}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <StatusBadge status={r.status} />
                        <PaymentBadge status={r.paymentStatus} />
                      </div>
                    </div>
                    <div className="text-[11px] text-text-secondary/80 truncate">
                      {r.coachEmail}
                      {r.coachPhone ? ` · ${r.coachPhone}` : ""}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: table — denser, sortable */}
              <div className="hidden md:block overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-text-secondary border-b border-border bg-white sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-2 py-2 font-semibold">Team</th>
                      <th className="text-left px-2 py-2 font-semibold">Coach</th>
                      <th className="text-left px-2 py-2 font-semibold">Division</th>
                      <th className="text-left px-2 py-2 font-semibold">Status</th>
                      <th className="text-left px-2 py-2 font-semibold">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentTeamRegs.map((r) => (
                      <tr key={r.id} className="border-b border-border/50 last:border-0">
                        <td className="px-2 py-2 text-navy font-medium">{r.teamName}</td>
                        <td className="px-2 py-2 text-text-secondary">
                          <div>{r.coachName}</div>
                          <div className="text-[11px] text-text-secondary/80">
                            {r.coachEmail}
                            {r.coachPhone ? ` · ${r.coachPhone}` : ""}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-navy">{r.division || "—"}</td>
                        <td className="px-2 py-2">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-2 py-2">
                          <PaymentBadge status={r.paymentStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : (
          <p className="text-text-secondary text-sm text-center py-6">
            Create or publish a tournament to see its registered teams here.
          </p>
        )}
      </section>

      {/* Bottom section: full master teams database */}
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "rejected" || status === "cancelled"
      ? "bg-red/10 text-red"
      : status === "waitlist"
      ? "bg-amber-50 text-amber-700"
      : "bg-navy/5 text-navy/70";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {status || "pending"}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const cls =
    status === "paid" || status === "waived"
      ? "bg-emerald-50 text-emerald-700"
      : status === "refunded"
      ? "bg-amber-50 text-amber-700"
      : "bg-red/10 text-red";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {status || "pending"}
    </span>
  );
}
