"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Users,
  FileCheck,
  CreditCard,
  Bell,
  MessageSquare,
  Trophy,
  UserCircle,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Clock,
} from "lucide-react";

// "What's connected to this entity" card. Pulls all related rows
// across the schema and renders a compact summary + per-relationship
// preview lists. Drops into any admin entity detail page.

type Kind = "member" | "user" | "team" | "player";

type ConnectionsData = {
  summary: Record<string, number | boolean>;
  // Discriminated by kind — TS-loose on purpose so we can render
  // optional sections without a giant union.
  user?: { id: number; name: string; email: string; role: string } | null;
  member?: unknown;
  members?: Array<{ id: number; firstName: string; lastName: string; status: string }>;
  children?: Array<{ id: number; name: string; teamId: number | null; jerseyNumber?: string | null }>;
  coachTeams?: Array<{ id: number; name: string; division: string | null }>;
  team?: { id: number; name: string; division: string | null; coachUserId: number | null } | null;
  parent?: { id: number; name: string; email: string } | null;
  player?: { id: number; name: string; jerseyNumber?: string | null; division?: string | null } | null;
  roster?: Array<{ id: number; name: string; jerseyNumber: string | null; waiverOnFile: boolean }>;
  tournaments?: Array<{
    id: number;
    tournamentId: number | null;
    status: string;
    paymentStatus: string;
    tournamentName: string | null;
    startDate: string | null;
  }>;
  attestations?: Array<{ id: number; signedByName: string; attestedAt: string }>;
  changeRequests?: Array<{ id: number; kind: string; status: string; createdAt: string }>;
  recentCheckins?: Array<{
    id: number;
    playerName?: string;
    timestamp: string;
    isLate: boolean;
    tournamentId: number | null;
  }>;
  recentWaivers?: Array<{ id: number; playerName: string; signedAt: string; expiresAt: string | null }>;
  recentInvoices?: Array<{ id: number; amountCents: number; status: string; createdAt: string }>;
  checkins?: Array<{
    id: number;
    timestamp: string;
    tournamentName: string | null;
    isLate: boolean;
    source: string | null;
  }>;
  waivers?: Array<{ id: number; signedAt: string; expiresAt: string | null }>;
  error?: string;
};

export function ConnectionsCard({ kind, id }: { kind: Kind; id: number }) {
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/connections?kind=${kind}&id=${id}`);
        if (cancel) return;
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error || `Failed (${res.status})`);
          return;
        }
        setData(await res.json());
      } catch {
        setError("Network error");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [kind, id]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-text-muted text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading connections…
        </div>
      </Shell>
    );
  }
  if (error || !data || data.error) {
    return (
      <Shell>
        <div className="text-text-muted text-sm py-2 inline-flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> {error || data?.error || "No data"}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <SummaryRow data={data} kind={kind} />
      <Sections data={data} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-white border border-border rounded-xl p-4 mt-4">
      <h3 className="text-navy text-sm font-bold uppercase tracking-wider mb-3">
        Connections
      </h3>
      {children}
    </section>
  );
}

function SummaryRow({ data, kind }: { data: ConnectionsData; kind: Kind }) {
  const items: Array<{ icon: React.ReactNode; label: string; value: number | string }> = [];
  const s = data.summary || {};
  if (kind === "member") {
    items.push({ icon: <UserCircle className="w-3.5 h-3.5" />, label: "Portal acct", value: s.hasUserAccount ? "yes" : "no" });
    items.push({ icon: <Users className="w-3.5 h-3.5" />, label: "Children", value: Number(s.childrenCount) || 0 });
    items.push({ icon: <FileCheck className="w-3.5 h-3.5" />, label: "Waivers", value: Number(s.waivers) || 0 });
    items.push({ icon: <CreditCard className="w-3.5 h-3.5" />, label: "Invoices", value: Number(s.invoices) || 0 });
    items.push({ icon: <Bell className="w-3.5 h-3.5" />, label: "Push subs", value: Number(s.pushSubs) || 0 });
    items.push({ icon: <MessageSquare className="w-3.5 h-3.5" />, label: "DM threads", value: Number(s.dmThreads) || 0 });
  } else if (kind === "user") {
    items.push({ icon: <Users className="w-3.5 h-3.5" />, label: "Member rows", value: Number(s.members) || 0 });
    items.push({ icon: <Trophy className="w-3.5 h-3.5" />, label: "Coach teams", value: Number(s.coachTeams) || 0 });
    items.push({ icon: <Users className="w-3.5 h-3.5" />, label: "Children", value: Number(s.children) || 0 });
    items.push({ icon: <Bell className="w-3.5 h-3.5" />, label: "Push subs", value: Number(s.pushSubs) || 0 });
  } else if (kind === "team") {
    items.push({ icon: <Users className="w-3.5 h-3.5" />, label: "Roster", value: Number(s.rosterSize) || 0 });
    items.push({ icon: <FileCheck className="w-3.5 h-3.5" />, label: "Waivers", value: Number(s.waiversOnFile) || 0 });
    items.push({ icon: <Trophy className="w-3.5 h-3.5" />, label: "Tournaments", value: Number(s.tournamentsRegistered) || 0 });
    items.push({ icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Change reqs", value: Number(s.pendingChangeRequests) || 0 });
    items.push({ icon: <Clock className="w-3.5 h-3.5" />, label: "Check-ins", value: Number(s.recentCheckins) || 0 });
  } else if (kind === "player") {
    items.push({ icon: <UserCircle className="w-3.5 h-3.5" />, label: "Parent", value: s.hasParent ? "yes" : "no" });
    items.push({ icon: <Trophy className="w-3.5 h-3.5" />, label: "Team", value: s.hasTeam ? "yes" : "no" });
    items.push({ icon: <Calendar className="w-3.5 h-3.5" />, label: "Tournaments", value: Number(s.tournaments) || 0 });
    items.push({ icon: <Clock className="w-3.5 h-3.5" />, label: "Check-ins", value: Number(s.checkins) || 0 });
    items.push({ icon: <FileCheck className="w-3.5 h-3.5" />, label: "Waivers", value: Number(s.waivers) || 0 });
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
      {items.map((item) => (
        <div key={item.label} className="bg-off-white rounded-lg px-3 py-2">
          <div className="flex items-center gap-1 text-text-muted text-[10px] uppercase tracking-wider font-bold">
            {item.icon}
            {item.label}
          </div>
          <p className="text-navy font-bold text-lg tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function Sections({ data }: { data: ConnectionsData }) {
  return (
    <div className="space-y-4">
      {data.user && (
        <Block title="Portal account">
          <Link
            href={`/admin/users?email=${encodeURIComponent(data.user.email)}`}
            className="text-sm text-navy hover:text-red flex items-center justify-between gap-2 p-2 rounded hover:bg-off-white"
          >
            <span>
              <span className="font-semibold">{data.user.name}</span>
              <span className="text-text-muted text-xs ml-2">{data.user.email}</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
          </Link>
        </Block>
      )}
      {data.children && data.children.length > 0 && (
        <Block title={`Children (${data.children.length})`}>
          <ul className="divide-y divide-border">
            {data.children.map((c) => (
              <li key={c.id} className="py-1.5">
                <Link href={`/portal/players/${c.id}`} className="text-sm text-navy hover:text-red flex items-center justify-between">
                  <span>
                    {c.name}
                    {c.jerseyNumber && <span className="text-text-muted text-xs ml-2">#{c.jerseyNumber}</span>}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {data.coachTeams && data.coachTeams.length > 0 && (
        <Block title={`Coaches (${data.coachTeams.length})`}>
          <ul className="divide-y divide-border">
            {data.coachTeams.map((t) => (
              <li key={t.id} className="py-1.5 text-sm text-navy">
                {t.name}
                {t.division && <span className="text-text-muted text-xs ml-2">{t.division}</span>}
              </li>
            ))}
          </ul>
        </Block>
      )}
      {data.tournaments && data.tournaments.length > 0 && (
        <Block title={`Tournaments (${data.tournaments.length})`}>
          <ul className="divide-y divide-border">
            {data.tournaments.slice(0, 5).map((reg) => (
              <li key={reg.id} className="py-1.5 text-sm flex items-center justify-between">
                <span className="text-navy truncate">
                  {reg.tournamentName || `Tournament #${reg.tournamentId}`}
                </span>
                <span className="text-text-muted text-xs">
                  {reg.status} · {reg.paymentStatus}
                </span>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {data.recentInvoices && data.recentInvoices.length > 0 && (
        <Block title={`Recent invoices (${data.recentInvoices.length})`}>
          <ul className="divide-y divide-border">
            {data.recentInvoices.map((inv) => (
              <li key={inv.id} className="py-1.5 text-sm flex items-center justify-between">
                <span className="text-navy">${(inv.amountCents / 100).toFixed(2)}</span>
                <span className="text-text-muted text-xs">{inv.status} · {new Date(inv.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {data.recentWaivers && data.recentWaivers.length > 0 && (
        <Block title={`Recent waivers (${data.recentWaivers.length})`}>
          <ul className="divide-y divide-border">
            {data.recentWaivers.map((w) => (
              <li key={w.id} className="py-1.5 text-sm flex items-center justify-between">
                <span className="text-navy truncate">{w.playerName}</span>
                <span className="text-text-muted text-xs">{new Date(w.signedAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {data.recentCheckins && data.recentCheckins.length > 0 && (
        <Block title={`Recent check-ins (${data.recentCheckins.length})`}>
          <ul className="divide-y divide-border">
            {data.recentCheckins.slice(0, 6).map((c) => (
              <li key={c.id} className="py-1.5 text-sm flex items-center justify-between">
                <span className="text-navy truncate">
                  {c.playerName || "Player"}
                  {c.isLate && (
                    <span className="ml-2 text-amber-700 text-[10px] uppercase tracking-wider font-bold">
                      late
                    </span>
                  )}
                </span>
                <span className="text-text-muted text-xs">{new Date(c.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {data.attestations && data.attestations.length > 0 && (
        <Block title={`Attestations (${data.attestations.length})`}>
          <ul className="divide-y divide-border">
            {data.attestations.slice(0, 5).map((a) => (
              <li key={a.id} className="py-1.5 text-sm flex items-center justify-between">
                <span className="text-navy">{a.signedByName}</span>
                <span className="text-text-muted text-xs">{new Date(a.attestedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {data.changeRequests && data.changeRequests.length > 0 && (
        <Block title={`Pending change requests (${data.changeRequests.length})`}>
          <ul className="divide-y divide-border">
            {data.changeRequests.map((c) => (
              <li key={c.id} className="py-1.5 text-sm flex items-center justify-between">
                <span className="text-navy capitalize">{c.kind}</span>
                <span className="text-text-muted text-xs">{c.status}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mb-1">{title}</p>
      {children}
    </div>
  );
}
