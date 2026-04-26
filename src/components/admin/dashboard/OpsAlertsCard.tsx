"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Cake, Package, History, AlertTriangle, ArrowUpRight, Clock } from "lucide-react";

type Cert = {
  id: number; type: string; label: string | null;
  expiresAt: string | null; userId: number;
  userName: string | null; userPhotoUrl: string | null;
  expired: boolean;
};

type Birthday = {
  id: number; firstName: string; lastName: string; birthDate: string | null;
};

type LowStock = {
  id: number; name: string; onHand: number; minQuantity: number; supplier: string | null;
};

type Audit = {
  id: number; action: string; actorEmail: string | null;
  entityType: string; createdAt: string;
};

type Payload = {
  expiringCerts: Cert[];
  todaysBirthdays: Birthday[];
  lowStock: LowStock[];
  recentAudits: Audit[];
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((t - Date.now()) / 864e5);
}

function fmtRel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function prettyAction(a: string): string {
  return a.replace(/\./g, " · ").replace(/_/g, " ");
}

// 4-up operational alert grid: expiring certs, today's birthdays,
// low-stock inventory, recent admin activity. Hidden when everything
// is healthy — doesn't clutter the dashboard on quiet days.
export default function OpsAlertsCard() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    fetch("/api/admin/ops-alerts")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const hasAnything =
    data.expiringCerts.length > 0 ||
    data.todaysBirthdays.length > 0 ||
    data.lowStock.length > 0 ||
    data.recentAudits.length > 0;
  if (!hasAnything) return null;

  return (
    <section aria-label="Ops alerts" className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Expiring certifications */}
      {data.expiringCerts.length > 0 && (
        <Panel
          title="Certifications"
          subtitle={`${data.expiringCerts.length} expiring or expired`}
          href="/admin/certifications"
          icon={<BadgeCheck className="w-4 h-4 text-amber-600" />}
        >
          <ul className="divide-y divide-border">
            {data.expiringCerts.slice(0, 5).map((c) => {
              const days = daysUntil(c.expiresAt);
              return (
                <li key={c.id} className="px-5 py-2.5 flex items-center gap-3">
                  {c.userPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.userPhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-off-white flex items-center justify-center">
                      <span className="text-navy text-[10px] font-bold">
                        {(c.userName || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-navy font-semibold text-sm truncate">{c.userName || "—"}</p>
                    <p className="text-text-muted text-[11px] truncate">
                      {c.label || c.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 ${
                    c.expired ? "bg-red/10 text-red" : (days !== null && days <= 7) ? "bg-amber-50 text-amber-700" : "bg-off-white text-text-muted"
                  }`}>
                    {c.expired ? (
                      <><AlertTriangle className="w-3 h-3" /> Expired</>
                    ) : days !== null ? (
                      <>{days}d</>
                    ) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {/* Today's birthdays */}
      {data.todaysBirthdays.length > 0 && (
        <Panel
          title="Birthdays Today"
          subtitle={`${data.todaysBirthdays.length} member${data.todaysBirthdays.length === 1 ? "" : "s"}`}
          href="/admin/members"
          icon={<Cake className="w-4 h-4 text-purple-600" />}
        >
          <ul className="divide-y divide-border">
            {data.todaysBirthdays.map((m) => (
              <li key={m.id} className="px-5 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                  <span className="text-purple-700 text-sm">🎂</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-semibold text-sm truncate">{m.firstName} {m.lastName}</p>
                  {m.birthDate && (() => {
                    const age = new Date().getFullYear() - new Date(m.birthDate).getFullYear();
                    return <p className="text-text-muted text-[11px]">Turning {age}</p>;
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Low stock */}
      {data.lowStock.length > 0 && (
        <Panel
          title="Restock"
          subtitle={`${data.lowStock.length} below threshold`}
          href="/admin/equipment?filter=reorder"
          icon={<Package className="w-4 h-4 text-red" />}
        >
          <ul className="divide-y divide-border">
            {data.lowStock.slice(0, 5).map((i) => (
              <li key={i.id} className="px-5 py-2.5 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-red/10 text-red text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i.onHand}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-semibold text-sm truncate">{i.name}</p>
                  <p className="text-text-muted text-[11px] truncate">
                    min {i.minQuantity}{i.supplier ? ` · ${i.supplier}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Recent audit activity */}
      {data.recentAudits.length > 0 && (
        <Panel
          title="Recent Changes"
          subtitle={`Last ${data.recentAudits.length} admin actions`}
          href="/admin/audit-log"
          icon={<History className="w-4 h-4 text-blue-600" />}
        >
          <ul className="divide-y divide-border">
            {data.recentAudits.slice(0, 5).map((a) => (
              <li key={a.id} className="px-5 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <History className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-semibold text-sm truncate">{prettyAction(a.action)}</p>
                  <p className="text-text-muted text-[11px] truncate flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {fmtRel(a.createdAt)} · {a.actorEmail || "system"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </section>
  );
}

function Panel({
  title,
  subtitle,
  href,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider leading-tight">{title}</h2>
            <p className="text-text-muted text-[10px] uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>
        <Link href={href} className="text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1 rounded">
          View <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      {children}
    </div>
  );
}
