"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Search as SearchIcon,
  User,
  Users as UsersIcon,
  Trophy,
  ClipboardList,
  UserCircle2,
  Calendar,
  ArrowLeft,
  X,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// Global admin search hits a single fan-out endpoint and renders results
// grouped by entity type. Each result row is a deep link into the
// per-entity admin page.

type SearchResults = {
  query: string;
  results: {
    users: Array<{ id: number; name: string | null; email: string | null; role: string | null }>;
    teams: Array<{ id: number; teamName: string; division: string | null; tournamentId: number | null }>;
    registrations: Array<{
      id: number;
      teamName: string;
      coachName: string | null;
      coachEmail: string | null;
      tournamentId: number | null;
      status: string | null;
      paymentStatus: string | null;
    }>;
    tournaments: Array<{ id: number; name: string; status: string | null; startDate: string | null }>;
    members: Array<{
      id: number;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      status: string | null;
    }>;
    players: Array<{
      id: number;
      name: string;
      division: string | null;
      jerseyNumber: string | null;
      teamId: number | null;
    }>;
    games: Array<{
      id: number;
      homeTeam: string;
      awayTeam: string;
      division: string | null;
      court: string | null;
      scheduledTime: string | null;
      status: string | null;
    }>;
  };
  totals: Record<string, number>;
};

export default function AdminSearchPage() {
  useDocumentTitle("Global Search");
  const { data: session, status } = useSession();
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (controller.signal.aborted) return;
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Search failed");
      }
      const json = (await res.json()) as SearchResults;
      setData(json);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setError((e as Error).message || "Search failed");
      setData(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // Debounce — 250ms after last keystroke.
  useEffect(() => {
    const id = setTimeout(() => run(q), 250);
    return () => clearTimeout(id);
  }, [q, run]);

  if (status === "loading") return null;
  if (status === "unauthenticated" || session?.user?.role !== "admin") redirect("/admin/login");

  const totalHits = data
    ? Object.values(data.totals).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
          Global Search
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Find users, members, players, teams, registrations, tournaments, and games.
        </p>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Start typing a name, email, team, phone…"
          className="w-full bg-white border border-border rounded-xl pl-9 pr-9 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Clear"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red/5 border border-red/20 text-red rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="text-text-secondary text-sm">Searching…</div>
      )}

      {!loading && q.trim().length >= 2 && data && totalHits === 0 && (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <SearchIcon className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-navy font-semibold">No matches</p>
          <p className="text-text-secondary text-sm mt-1">
            Try a different spelling, a shorter phrase, or a phone number.
          </p>
        </div>
      )}

      {q.trim().length < 2 && (
        <p className="text-text-muted text-xs">Type at least 2 characters.</p>
      )}

      {data && totalHits > 0 && (
        <div className="space-y-5">
          {data.results.users.length > 0 && (
            <Group icon={<User className="w-4 h-4" />} label="Users" count={data.results.users.length}>
              {data.results.users.map((u) => (
                <ResultRow
                  key={u.id}
                  href={`/admin/users`}
                  title={u.name || u.email || `user#${u.id}`}
                  sub={`${u.email || ""}${u.role ? ` · ${u.role}` : ""}`}
                />
              ))}
            </Group>
          )}
          {data.results.members.length > 0 && (
            <Group icon={<UserCircle2 className="w-4 h-4" />} label="Members" count={data.results.members.length}>
              {data.results.members.map((m) => (
                <ResultRow
                  key={m.id}
                  href={`/admin/members/${m.id}`}
                  title={`${m.firstName} ${m.lastName}`}
                  sub={`${m.email || m.phone || ""}${m.status ? ` · ${m.status}` : ""}`}
                />
              ))}
            </Group>
          )}
          {data.results.players.length > 0 && (
            <Group icon={<UserCircle2 className="w-4 h-4" />} label="Players" count={data.results.players.length}>
              {data.results.players.map((p) => (
                <ResultRow
                  key={p.id}
                  href={`/admin/players`}
                  title={p.name}
                  sub={`${p.division || ""}${p.jerseyNumber ? ` · #${p.jerseyNumber}` : ""}`}
                />
              ))}
            </Group>
          )}
          {data.results.teams.length > 0 && (
            <Group icon={<UsersIcon className="w-4 h-4" />} label="Teams" count={data.results.teams.length}>
              {data.results.teams.map((t) => (
                <ResultRow
                  key={t.id}
                  href={t.tournamentId ? `/admin/tournaments/${t.tournamentId}` : `/admin/teams`}
                  title={t.teamName}
                  sub={t.division || ""}
                />
              ))}
            </Group>
          )}
          {data.results.registrations.length > 0 && (
            <Group icon={<ClipboardList className="w-4 h-4" />} label="Registrations" count={data.results.registrations.length}>
              {data.results.registrations.map((r) => (
                <ResultRow
                  key={r.id}
                  href={r.tournamentId ? `/admin/tournaments/${r.tournamentId}` : `/admin/approvals`}
                  title={r.teamName}
                  sub={`${r.coachName || ""}${r.coachEmail ? ` · ${r.coachEmail}` : ""}${r.status ? ` · ${r.status}` : ""}${r.paymentStatus ? ` · ${r.paymentStatus}` : ""}`}
                />
              ))}
            </Group>
          )}
          {data.results.tournaments.length > 0 && (
            <Group icon={<Trophy className="w-4 h-4" />} label="Tournaments" count={data.results.tournaments.length}>
              {data.results.tournaments.map((t) => (
                <ResultRow
                  key={t.id}
                  href={`/admin/tournaments/${t.id}`}
                  title={t.name}
                  sub={`${t.status || ""}${t.startDate ? ` · ${t.startDate}` : ""}`}
                />
              ))}
            </Group>
          )}
          {data.results.games.length > 0 && (
            <Group icon={<Calendar className="w-4 h-4" />} label="Games" count={data.results.games.length}>
              {data.results.games.map((g) => (
                <ResultRow
                  key={g.id}
                  href={`/admin/scores`}
                  title={`${g.homeTeam} vs ${g.awayTeam}`}
                  sub={`${g.court || ""}${g.division ? ` · ${g.division}` : ""}${g.status ? ` · ${g.status}` : ""}`}
                />
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  icon,
  label,
  count,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-off-white text-text-muted">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="ml-auto text-[11px] text-text-muted">{count}</span>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function ResultRow({ href, title, sub }: { href: string; title: string; sub?: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-3 hover:bg-off-white transition-colors"
    >
      <div className="text-sm text-navy font-semibold truncate">{title}</div>
      {sub && <div className="text-xs text-text-muted truncate mt-0.5">{sub}</div>}
    </Link>
  );
}
