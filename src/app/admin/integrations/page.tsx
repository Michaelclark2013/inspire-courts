"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Key, Webhook, Copy, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { SkeletonRows } from "@/components/ui/SkeletonCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type ApiKey = { id: number; label: string; prefix: string; scopes: string; lastUsedAt: string | null; revokedAt: string | null; createdAt: string };
type WebhookSub = { id: number; url: string; events: string; active: boolean; lastDeliveryStatus: number | null; failureCount: number; createdAt: string };

export default function IntegrationsPage() {
  useDocumentTitle("Integrations");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [hooks, setHooks] = useState<WebhookSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState("read");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState("*");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  // Mutation feedback — covers create-key/create-hook/revoke/delete.
  // Cleared on next mutation. Without this a 500 on revoke leaves the
  // key visible and the admin assumes it's revoked.
  const [actionError, setActionError] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const [kRes, wRes] = await Promise.all([
        adminFetch("/api/admin/api-keys", { cache: "no-store" }),
        adminFetch("/api/admin/webhooks", { cache: "no-store" }),
      ]);
      const errors: string[] = [];
      if (kRes.ok) {
        setKeys((await kRes.json()).rows || []);
      } else {
        errors.push(`API keys ${kRes.status}`);
      }
      if (wRes.ok) {
        setHooks((await wRes.json()).rows || []);
      } else {
        errors.push(`webhooks ${wRes.status}`);
      }
      setLoadError(errors.length > 0 ? `Couldn't load: ${errors.join(", ")}.` : null);
    } catch (err) {
      if ((err as Error)?.name !== "SessionExpiredError") {
        setLoadError("Network error loading integrations.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createKey() {
    if (!newKeyLabel) return;
    const res = await adminFetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newKeyLabel, scopes: newKeyScopes }),
    });
    if (res.ok) {
      const json = await res.json();
      setRevealedKey(json.key);
      setNewKeyLabel("");
      setActionError(null);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || `Couldn't create API key (${res.status}).`);
    }
  }

  async function revokeKey(id: number) {
    if (!confirm("Revoke this API key? Existing integrations will stop working immediately.")) return;
    setActionError(null);
    const res = await adminFetch(`/api/admin/api-keys?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || `Couldn't revoke API key (${res.status}).`);
      return;
    }
    load();
  }

  async function createHook() {
    if (!newWebhookUrl) return;
    const res = await adminFetch("/api/admin/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: newWebhookUrl, events: newWebhookEvents }),
    });
    if (res.ok) {
      const json = await res.json();
      setRevealedSecret(json.secret);
      setNewWebhookUrl("");
      setActionError(null);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || `Couldn't create webhook (${res.status}).`);
    }
  }

  async function deleteHook(id: number) {
    if (!confirm("Delete this webhook?")) return;
    setActionError(null);
    const res = await adminFetch(`/api/admin/webhooks?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || `Couldn't delete webhook (${res.status}).`);
      return;
    }
    load();
  }

  if (loading) return <div className="p-8"><SkeletonRows count={6} /></div>;
  if (loadError && keys.length === 0 && hooks.length === 0) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <div className="bg-red/5 border border-red/20 text-red rounded-2xl p-6 text-center">
          <p className="font-bold mb-1">Couldn&apos;t load integrations</p>
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

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <div className="mb-5">
        <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Public API · Webhooks</p>
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
          Integrations
        </h1>
        <p className="text-text-muted text-sm mt-1">
          API keys for external apps + webhook subscriptions for real-time event delivery.
        </p>
      </div>

      {actionError && (
        <div className="bg-red/5 border border-red/30 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
          <p className="text-navy text-sm font-semibold">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-xs text-text-secondary hover:text-navy">Dismiss</button>
        </div>
      )}

      {/* Reveal modals */}
      {revealedKey && <SecretReveal label="Your new API key" value={revealedKey} note="Copy this now — it won't be shown again." onClose={() => setRevealedKey(null)} />}
      {revealedSecret && <SecretReveal label="Webhook signing secret" value={revealedSecret} note="Use this to verify the X-Inspire-Signature header on inbound deliveries." onClose={() => setRevealedSecret(null)} />}

      {/* API Keys */}
      <section className="bg-white border border-border rounded-2xl p-5 mb-5 shadow-sm">
        <h2 className="text-navy font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-red" /> API Keys
        </h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            value={newKeyLabel}
            onChange={(e) => setNewKeyLabel(e.target.value)}
            placeholder="Label (e.g. Zapier integration)"
            className="flex-1 min-w-[200px] bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={newKeyScopes}
            onChange={(e) => setNewKeyScopes(e.target.value)}
            className="bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="read">read</option>
            <option value="read,read:contact">read + contact</option>
            <option value="read,write">read + write</option>
          </select>
          <button onClick={createKey} className="bg-navy hover:bg-navy/90 text-white font-bold uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> Generate
          </button>
        </div>
        {keys.length === 0 ? (
          <p className="text-text-muted text-sm">
            No API keys yet. Generate one above to give a Zapier / external
            app access to <code className="font-mono text-[11px] bg-off-white px-1 py-0.5 rounded">/api/v1/*</code>.
            Keys are sha256-hashed in storage; the plaintext shows ONCE on
            creation. Per-key rate limit: 60 req/min.
          </p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {keys.map((k) => (
              <li key={k.id} className="px-2 py-2 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy font-semibold">{k.label}</p>
                  <p className="text-xs text-text-muted font-mono">
                    {k.prefix}… · {k.scopes} · {k.revokedAt ? "REVOKED" : k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "never used"}
                  </p>
                </div>
                {!k.revokedAt && (
                  <button onClick={() => revokeKey(k.id)} aria-label="Revoke API key" className="text-red hover:bg-red/5 p-1.5 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Webhooks */}
      <section className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="text-navy font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
          <Webhook className="w-4 h-4 text-red" /> Webhook subscriptions
        </h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            value={newWebhookUrl}
            onChange={(e) => setNewWebhookUrl(e.target.value)}
            placeholder="https://your-endpoint.com/inspire-events"
            className="flex-1 min-w-[240px] bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={newWebhookEvents}
            onChange={(e) => setNewWebhookEvents(e.target.value)}
            placeholder="* or comma-sep events"
            className="bg-off-white border border-border rounded-lg px-3 py-2 text-sm w-[200px]"
          />
          <button onClick={createHook} className="bg-navy hover:bg-navy/90 text-white font-bold uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {hooks.length === 0 ? (
          <p className="text-text-muted text-sm">
            No webhook subscriptions. Add a URL above and we&apos;ll POST signed
            event payloads (HMAC-SHA256 in <code className="font-mono text-[11px] bg-off-white px-1 py-0.5 rounded">X-Inspire-Signature</code>)
            for events like <code className="font-mono text-[11px] bg-off-white px-1 py-0.5 rounded">inquiry.created</code>.
          </p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {hooks.map((h) => (
              <li key={h.id} className="px-2 py-2 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy font-semibold truncate">{h.url}</p>
                  <p className="text-xs text-text-muted">
                    events: {h.events} · last status: {h.lastDeliveryStatus ?? "—"} · failures: {h.failureCount}
                  </p>
                </div>
                <button onClick={() => deleteHook(h.id)} aria-label="Delete webhook" className="text-red hover:bg-red/5 p-1.5 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-text-muted mt-6">
        Public API base URL: <code className="bg-off-white px-1.5 py-0.5 rounded">https://inspirecourtsaz.com/api/v1/</code>
        {" · "}
        Auth: <code className="bg-off-white px-1.5 py-0.5 rounded">Authorization: Bearer ic_…</code>
      </p>
    </div>
  );
}

function SecretReveal({ label, value, note, onClose }: { label: string; value: string; note: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-2">{label}</h3>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">{note}</p>
        <div className="bg-off-white border border-border rounded-lg p-3 font-mono text-xs break-all mb-3">{value}</div>
        <div className="flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(value)} className="flex-1 bg-navy text-white font-bold uppercase tracking-wider px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1">
            <Copy className="w-4 h-4" /> Copy
          </button>
          <button onClick={onClose} className="text-text-muted text-sm px-3">Done</button>
        </div>
      </div>
    </div>
  );
}
