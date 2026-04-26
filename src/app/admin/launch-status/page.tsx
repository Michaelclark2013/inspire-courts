"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Rocket,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Sparkles,
} from "lucide-react";

type Check = { key: string; present: boolean; note?: string };
type Data = {
  env: Record<string, Check[]>;
  seed: {
    adminUsers: number;
    permissionTemplates: number;
    fleetVehicles: number;
    equipmentItems: number;
    tournaments: number;
  };
  rollup: {
    critical: boolean;
    emailReady: boolean;
    paymentsReady: boolean;
    paymentsSandboxOnly: boolean;
    pushReady: boolean;
    calendarReady: boolean;
    cronReady: boolean;
    hasAdmin: boolean;
    hasTournament: boolean;
    hasVehicles: boolean;
    hasInventory: boolean;
    hasTemplates: boolean;
  };
};

const GROUP_LABELS: Record<string, string> = {
  critical: "Critical (nothing works without these)",
  auth: "Auth / Login",
  email: "Email",
  payments: "Payments (Square)",
  sheets: "Google Sheets",
  push: "Push Notifications",
  analytics: "Analytics",
  calendar: "Calendar Feed",
  cron: "Cron Secrets",
};

export default function LaunchStatusPage() {
  const [data, setData] = useState<Data | null>(null);
  const [seedingKey, setSeedingKey] = useState<string | null>(null);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/launch-status");
      if (res.ok) {
        setData(await res.json());
        setLoadError(null);
      } else {
        // Without a banner the page sat at "Loading launch status…"
        // forever on a 5xx. Now we tell the admin what went wrong.
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error || `Couldn't load launch status (${res.status}).`);
      }
    } catch {
      setLoadError("Network error loading launch status.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function seedPath(label: string, path: string, key: string) {
    setSeedingKey(key);
    setSeedMsg(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSeedMsg(`${label} failed: ${body.error || `HTTP ${res.status}`}`);
        return;
      }
      setSeedMsg(`${label}: inserted ${body.inserted || 0}, skipped ${body.skipped || 0}.`);
      load();
    } catch { setSeedMsg(`${label} failed: network error`); }
    finally { setSeedingKey(null); }
  }

  function copyMissing() {
    if (!data) return;
    const all = Object.values(data.env).flat();
    const missing = all.filter((c) => !c.present).map((c) => c.key);
    const envExample = missing.map((k) => `${k}=`).join("\n");
    navigator.clipboard.writeText(envExample);
    setSeedMsg(`Copied ${missing.length} missing env var names to clipboard.`);
    setTimeout(() => setSeedMsg(null), 3000);
  }

  if (!data) {
    if (loadError) {
      return (
        <div className="p-8 max-w-md mx-auto">
          <div className="bg-red/5 border border-red/20 text-red rounded-2xl p-6 text-center">
            <p className="font-bold mb-1">Couldn&apos;t load launch status</p>
            <p className="text-sm">{loadError}</p>
            <button
              onClick={load}
              className="mt-3 inline-flex items-center gap-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return <div className="p-8 text-text-muted">Loading launch status…</div>;
  }

  const all = Object.values(data.env).flat();
  const totalPresent = all.filter((c) => c.present).length;
  const totalChecks = all.length;

  const seedItems = [
    { key: "adminUsers", label: "Admin account", count: data.seed.adminUsers, ready: data.rollup.hasAdmin, href: "/admin/users" },
    {
      key: "permissionTemplates",
      label: "Permission templates",
      count: data.seed.permissionTemplates,
      ready: data.rollup.hasTemplates,
      href: "/admin/permissions/templates",
      action: () => seedPath("Permission Templates", "/api/admin/seed/permission-templates", "pt"),
      actionLabel: "Seed defaults",
      actionBusy: seedingKey === "pt",
    },
    { key: "tournaments", label: "Tournament configured", count: data.seed.tournaments, ready: data.rollup.hasTournament, href: "/admin/tournaments/manage" },
    { key: "fleetVehicles", label: "Fleet vehicles", count: data.seed.fleetVehicles, ready: data.rollup.hasVehicles, href: "/admin/resources/new" },
    {
      key: "equipmentItems",
      label: "Inventory items",
      count: data.seed.equipmentItems,
      ready: data.rollup.hasInventory,
      href: "/admin/equipment",
      action: () => seedPath("Inventory", "/api/admin/seed/inventory", "inv"),
      actionLabel: "Seed 29 starter items",
      actionBusy: seedingKey === "inv",
    },
    {
      key: "membershipPlans",
      label: "Membership plans",
      count: 0,
      ready: false,
      href: "/admin/membership-plans",
      action: () => seedPath("Membership Plans", "/api/admin/seed/membership-plans", "mp"),
      actionLabel: "Seed 5 default tiers",
      actionBusy: seedingKey === "mp",
    },
  ];

  const rollupItems = [
    { key: "critical", label: "Critical env vars", ready: data.rollup.critical },
    { key: "emailReady", label: "Email sending", ready: data.rollup.emailReady },
    { key: "paymentsReady", label: "Payments (production)", ready: data.rollup.paymentsReady, warn: data.rollup.paymentsSandboxOnly, warnText: "Sandbox mode — flip SQUARE_ENVIRONMENT to production" },
    { key: "pushReady", label: "Push notifications", ready: data.rollup.pushReady },
    { key: "calendarReady", label: "Calendar feed", ready: data.rollup.calendarReady },
    { key: "cronReady", label: "Cron secret", ready: data.rollup.cronReady },
  ];

  const readyCount = rollupItems.filter((r) => r.ready).length + seedItems.filter((s) => s.ready).length;
  const totalLaunchItems = rollupItems.length + seedItems.length;
  const launchPercent = Math.round((readyCount / totalLaunchItems) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Pre-launch</p>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3 mb-2">
            <Rocket className="w-8 h-8 text-red" />
            Launch Status
          </h1>
          <p className="text-white/60 text-sm max-w-xl mb-4">
            {readyCount} of {totalLaunchItems} launch items ready · Env vars: {totalPresent}/{totalChecks}
          </p>

          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-2">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${launchPercent}%` }} />
          </div>
          <p className="text-white/70 text-xs">{launchPercent}% ready to go live</p>
        </div>
      </section>

      {seedMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-5 py-3 text-sm font-semibold">
          {seedMsg}
        </div>
      )}

      {/* Rollup status */}
      <section className="bg-white border border-border rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Go-Live Rollup</h2>
        </div>
        <ul className="divide-y divide-border">
          {rollupItems.map((r) => (
            <li key={r.key} className="px-5 py-3 flex items-center gap-3">
              {r.ready ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : r.warn ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-navy font-semibold text-sm">{r.label}</p>
                {r.warn && r.warnText && <p className="text-amber-700 text-xs mt-0.5">{r.warnText}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Seed data */}
      <section className="bg-white border border-border rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red" /> Seed Data
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {seedItems.map((s) => (
            <li key={s.key} className="px-5 py-3 flex items-center gap-3">
              {s.ready ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-text-muted flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-navy font-semibold text-sm">{s.label}</p>
                <p className="text-text-muted text-xs">{s.count} in database</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.action && (
                  <button
                    onClick={() => s.action && s.action()}
                    disabled={s.actionBusy}
                    className="bg-red hover:bg-red-hover disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                  >
                    {s.actionBusy ? "Working…" : s.actionLabel}
                  </button>
                )}
                <Link href={s.href} className="text-red text-xs font-semibold hover:text-red-hover">
                  Open →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Env vars */}
      <section className="bg-white border border-border rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Environment Variables</h2>
          <button
            onClick={copyMissing}
            className="bg-white border border-border hover:bg-off-white text-navy text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <Copy className="w-3 h-3" /> Copy Missing
          </button>
        </div>
        <div className="divide-y divide-border">
          {Object.entries(data.env).map(([group, checks]) => (
            <div key={group}>
              <div className="px-5 py-2 bg-off-white/40">
                <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold">{GROUP_LABELS[group] || group}</p>
              </div>
              {checks.map((c) => (
                <div key={c.key} className="px-5 py-2 flex items-center gap-3 border-t border-border first:border-t-0">
                  {c.present ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-text-muted flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-navy font-mono text-xs">{c.key}</p>
                    {c.note && <p className="text-text-muted text-[11px]">{c.note}</p>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${
                    c.present ? "bg-emerald-50 text-emerald-700" : "bg-off-white text-text-muted"
                  }`}>
                    {c.present ? "Set" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="bg-red/5 border border-red/20 rounded-2xl p-5">
        <h2 className="text-navy font-bold text-base mb-3 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-red" /> Go-Live Sequence
        </h2>
        <ol className="space-y-2 text-sm text-navy">
          <li>1. Flip <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded">SQUARE_ENVIRONMENT=production</span> in Vercel</li>
          <li>2. Rotate <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded">NEXTAUTH_SECRET</span> (final)</li>
          <li>3. Hit <Link href="/admin/security" className="text-red font-semibold hover:underline">Security page</Link> → Force Re-login All</li>
          <li>4. Redeploy on Vercel</li>
          <li>5. Open the tournament for public registration</li>
          <li>6. Post a pinned Announcement (<Link href="/admin/announcements" className="text-red font-semibold hover:underline">Announcements</Link>)</li>
        </ol>
      </section>
    </div>
  );
}
