"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Send, RefreshCw } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Row = {
  id: number;
  memberId: number | null;
  phone: string;
  direction: "outbound" | "inbound";
  body: string;
  status: string;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
};

// Group messages by phone — that's the conversation key.
type Thread = {
  phone: string;
  memberId: number | null;
  name: string;
  lastMessage: Row;
  unread: boolean; // last message is inbound
  messages: Row[];
};

function buildThreads(rows: Row[]): Thread[] {
  const map = new Map<string, Thread>();
  // rows are newest-first; iterate so latest wins for lastMessage
  for (const r of rows) {
    const key = r.phone;
    if (!map.has(key)) {
      map.set(key, {
        phone: r.phone,
        memberId: r.memberId,
        name: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.phone,
        lastMessage: r,
        unread: r.direction === "inbound",
        messages: [],
      });
    }
    map.get(key)!.messages.push(r);
  }
  // Conversation messages oldest-first for display
  for (const t of map.values()) t.messages.reverse();
  return Array.from(map.values());
}

export default function InboxPage() {
  useDocumentTitle("Inbox");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Thread | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/sms", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const t = buildThreads(json.rows || []);
        setThreads(t);
        if (active) {
          const updated = t.find((x) => x.phone === active.phone);
          if (updated) setActive(updated);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => { load(); }, [load]);

  async function send() {
    if (!active || !reply.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await adminFetch("/api/admin/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: active.phone,
          body: reply,
          memberId: active.memberId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSendError(data?.error || `Send failed (${res.status}). Try again.`);
        return;
      }
      setReply("");
      await load();
    } catch {
      setSendError("Network issue. Reply not sent — try again.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="p-8 text-text-muted">Loading inbox…</div>;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <div className="mb-5 flex items-end justify-between">
        <div className="hidden md:block">
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Two-way SMS</p>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
            Inbox
          </h1>
        </div>
        <button onClick={load} className="md:ml-auto text-text-muted hover:text-navy text-xs flex items-center gap-1.5 min-h-[44px] px-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        {/* Thread list */}
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden max-h-[70vh] overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-sm">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-navy mb-1">No conversations yet.</p>
              <p className="text-xs leading-relaxed">
                Inbound texts to your Twilio number land here.{" "}
                <Link href="/admin/launch-readiness" className="underline">
                  Confirm Twilio is configured
                </Link>{" "}
                and point your number&apos;s webhook at{" "}
                <code className="bg-off-white px-1 py-0.5 rounded font-mono text-[10px] break-all">
                  /api/webhooks/twilio
                </code>.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {threads.map((t) => (
                <li key={t.phone}>
                  <button
                    onClick={() => setActive(t)}
                    className={`w-full text-left px-4 py-3 hover:bg-off-white ${
                      active?.phone === t.phone ? "bg-off-white" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm text-navy font-semibold truncate flex-1">{t.name}</p>
                      {t.unread && <span className="w-2 h-2 rounded-full bg-red flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-text-muted truncate">{t.lastMessage.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Conversation pane */}
        <div className="bg-white border border-border rounded-2xl shadow-sm flex flex-col max-h-[70vh]">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
              Pick a conversation
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm text-navy font-semibold">{active.name}</p>
                <p className="text-xs text-text-muted">{active.phone}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      m.direction === "outbound"
                        ? "ml-auto bg-navy text-white"
                        : "bg-off-white text-navy"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.direction === "outbound" ? "text-white/60" : "text-text-muted"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      {m.direction === "outbound" && m.status === "failed" && " · failed"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border">
                {sendError && (
                  <div className="px-3 pt-2 text-red text-xs" role="alert" aria-live="assertive">
                    {sendError}
                  </div>
                )}
                <div className="p-3 flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => { setReply(e.target.value); if (sendError) setSendError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Type a reply…"
                    className="flex-1 bg-off-white border border-border rounded-xl px-3 py-2 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                  <button
                    onClick={send}
                    disabled={!reply.trim() || sending}
                    aria-busy={sending}
                    aria-label="Send reply"
                    className="bg-navy hover:bg-navy/90 disabled:opacity-50 text-white px-4 py-2 min-h-[44px] min-w-[44px] rounded-xl flex items-center gap-1.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
