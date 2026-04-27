"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Search,
  X,
  ArrowLeft,
  Plus,
  RefreshCw,
} from "lucide-react";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";

// Portal-side mirror of the admin Messages UI. Same API endpoints
// (GET /api/admin/messages and friends — they're participant-scoped
// at the API layer so coaches/parents only see threads they're in).
//
// Role differences vs admin page:
//   - No "scope=all" toggle in compose — coaches/parents only message
//     admin-side users (the API enforces this; the picker honors it
//     by passing scope=staff).
//   - Sits inside the portal layout (no AdminSidebar), so it gets
//     the portal nav/back-to-dashboard chrome from the layout.

type ThreadOther = { id: number; name: string; email: string; role: string };
type Thread = {
  id: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageSenderId: number | null;
  myLastReadAt: string | null;
  unread: boolean;
  other: ThreadOther | null;
};
type Message = {
  id: number;
  body: string;
  createdAt: string;
  senderUserId: number;
  senderName: string | null;
};
type Recipient = { id: number; name: string; email: string; role: string };

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(iso).toLocaleDateString();
}

function PortalMessagesInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { data: session } = useSession();
  const myId = Number(session?.user?.id);
  const initialConvId = Number(search.get("c")) || null;
  const initialRecipient = Number(search.get("to")) || null;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(initialConvId);
  const [composeOpen, setComposeOpen] = useState(!!initialRecipient);

  const refreshThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as { threads: Thread[] };
      setThreads(data.threads || []);
      setError(null);
    } catch {
      setError("Network error");
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    const t = setInterval(() => void refreshThreads(), 20_000);
    return () => clearInterval(t);
  }, [refreshThreads]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedId) || null,
    [threads, selectedId],
  );
  const totalUnread = useMemo(() => threads.filter((t) => t.unread).length, [threads]);

  function selectThread(id: number) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("c", String(id));
    url.searchParams.delete("to");
    window.history.replaceState({}, "", url.toString());
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: false, myLastReadAt: new Date().toISOString() } : t)),
    );
  }
  function closeThread() {
    setSelectedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("c");
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-red/10 p-2 rounded-lg flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-red" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-navy truncate">Messages</h1>
            <p className="text-xs text-text-muted">
              {totalUnread > 0
                ? `${totalUnread} unread thread${totalUnread === 1 ? "" : "s"}`
                : "DM with the gym staff"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red text-white text-sm font-semibold hover:bg-red/90"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> New
        </button>
      </header>

      {error && (
        <div className="mb-3 bg-red/10 border border-red/20 rounded-lg px-3 py-2 text-red text-xs">
          {error} ·{" "}
          <button onClick={() => void refreshThreads()} className="underline">
            retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
        <aside
          className={
            "bg-white border border-border rounded-xl overflow-hidden lg:block " +
            (selectedId !== null ? "hidden lg:block" : "block")
          }
        >
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Conversations
            </p>
          </div>
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {threadsLoading ? (
              <div className="p-6 text-text-muted text-sm text-center">Loading…</div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-muted">
                No conversations yet.
              </div>
            ) : (
              threads.map((t) => {
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectThread(t.id)}
                    className={
                      "w-full text-left px-3 py-3 hover:bg-off-white transition-colors " +
                      (active ? "bg-red/5" : "")
                    }
                  >
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-navy truncate flex items-center gap-2">
                        {t.unread && (
                          <span
                            className="w-2 h-2 rounded-full bg-red flex-shrink-0"
                            aria-label="Unread"
                          />
                        )}
                        {t.other?.name || "(deleted user)"}
                      </span>
                      <span className="text-[10px] text-text-muted flex-shrink-0">
                        {formatRelative(t.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-text-muted truncate flex-1">
                        {t.lastMessagePreview || "(no messages)"}
                      </span>
                      {t.other?.role && (
                        <span
                          className={
                            "text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase " +
                            (ROLE_COLORS[t.other.role as UserRole] || "bg-gray-100 text-gray-600")
                          }
                        >
                          {ROLE_LABELS[t.other.role as UserRole] || t.other.role}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section
          className={
            "bg-white border border-border rounded-xl overflow-hidden flex flex-col " +
            (selectedId === null ? "hidden lg:flex" : "flex")
          }
        >
          {selectedId !== null ? (
            <ConversationPane
              key={selectedId}
              conversationId={selectedId}
              other={selectedThread?.other ?? null}
              myId={myId}
              onBack={closeThread}
              onSent={() => void refreshThreads()}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm p-8">
              Select a conversation to start chatting.
            </div>
          )}
        </section>
      </div>

      {composeOpen && (
        <ComposeDialog
          initialRecipientId={initialRecipient}
          onClose={() => setComposeOpen(false)}
          onCreated={(id) => {
            setComposeOpen(false);
            void refreshThreads();
            setSelectedId(id);
            const url = new URL(window.location.href);
            url.searchParams.set("c", String(id));
            url.searchParams.delete("to");
            window.history.replaceState({}, "", url.toString());
          }}
        />
      )}

      <div className="mt-4 text-center">
        <Link href="/portal" className="text-text-muted text-xs hover:text-navy">
          ← Back to portal
        </Link>
        {router && null}
      </div>
    </div>
  );
}

export default function PortalMessagesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-text-muted text-sm">Loading…</div>}>
      <PortalMessagesInner />
    </Suspense>
  );
}

function ConversationPane({
  conversationId,
  other,
  myId,
  onBack,
  onSent,
}: {
  conversationId: number;
  other: ThreadOther | null;
  myId: number;
  onBack: () => void;
  onSent: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/messages/${conversationId}`, { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Failed (${res.status})`);
        return;
      }
      const d = (await res.json()) as { messages: Message[] };
      setMessages(d.messages || []);
      setError(null);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => void refresh(), 8_000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Send failed (${res.status})`);
        return;
      }
      setBody("");
      await refresh();
      onSent();
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-off-white">
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-md hover:bg-white text-text-muted"
          aria-label="Back to thread list"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {(other?.name || "?")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy truncate">
            {other?.name || "(deleted user)"}
          </p>
          <p className="text-xs text-text-muted truncate">{other?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="p-1.5 rounded-md hover:bg-white text-text-muted"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red/10 text-red text-xs border-b border-red/20">
          {error}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-white max-h-[55vh] min-h-[40vh]"
      >
        {loading ? (
          <p className="text-text-muted text-sm text-center py-8">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No messages yet — say hi.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderUserId === myId;
            return (
              <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                <div
                  className={
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words " +
                    (mine
                      ? "bg-red text-white rounded-br-sm"
                      : "bg-off-white text-navy rounded-bl-sm")
                  }
                >
                  {!mine && (
                    <p className="text-[10px] uppercase tracking-wide font-semibold mb-0.5 text-text-muted">
                      {m.senderName || "User"}
                    </p>
                  )}
                  <p>{m.body}</p>
                  <p
                    className={
                      "text-[10px] mt-1 " + (mine ? "text-white/70" : "text-text-muted")
                    }
                  >
                    {formatRelative(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className="border-t border-border p-3 bg-off-white flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          maxLength={2000}
          placeholder="Write a message…  (Enter to send, Shift+Enter for newline)"
          className="flex-1 resize-none rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:border-navy/50"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="px-3 py-2 rounded-lg bg-red text-white text-sm font-semibold hover:bg-red/90 disabled:opacity-50 inline-flex items-center gap-1.5 flex-shrink-0"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </>
  );
}

function ComposeDialog({
  initialRecipientId,
  onClose,
  onCreated,
}: {
  initialRecipientId: number | null;
  onClose: () => void;
  onCreated: (conversationId: number) => void;
}) {
  const [q, setQ] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim().length >= 2) params.set("q", q.trim());
      params.set("scope", "staff");
      const res = await fetch(`/api/admin/messages/recipients?${params}`);
      if (!res.ok) {
        setError(`Failed loading staff (${res.status})`);
        return;
      }
      const data = (await res.json()) as { recipients: Recipient[] };
      setRecipients(data.recipients || []);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => void search(), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [search, q]);

  useEffect(() => {
    if (!initialRecipientId || selected) return;
    void (async () => {
      const res = await fetch("/api/admin/messages/recipients?scope=staff");
      if (!res.ok) return;
      const d = (await res.json()) as { recipients: Recipient[] };
      const found = d.recipients?.find((r) => r.id === initialRecipientId);
      if (found) setSelected(found);
    })();
  }, [initialRecipientId, selected]);

  async function send() {
    if (!selected || !body.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUserId: selected.id, body: body.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Send failed (${res.status})`);
        return;
      }
      const d = (await res.json()) as { conversationId: number };
      onCreated(d.conversationId);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">New Message</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-off-white text-text-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          {selected ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-off-white rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy truncate">{selected.name}</p>
                <p className="text-xs text-text-muted truncate">
                  {selected.email} ·{" "}
                  {ROLE_LABELS[selected.role as UserRole] || selected.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-text-muted hover:text-red"
              >
                Change
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Recipient (gym staff)
              </label>
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-navy/50"
                />
              </div>
              <div className="mt-2 max-h-60 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {loading ? (
                  <p className="text-xs text-text-muted text-center py-4">Loading…</p>
                ) : recipients.length === 0 ? (
                  <p className="p-3 text-xs text-text-muted text-center">No matches.</p>
                ) : (
                  recipients.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelected(r)}
                      className="w-full text-left px-3 py-2 hover:bg-off-white"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-navy truncate">{r.name}</span>
                        <span
                          className={
                            "text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase " +
                            (ROLE_COLORS[r.role as UserRole] || "bg-gray-100 text-gray-600")
                          }
                        >
                          {ROLE_LABELS[r.role as UserRole] || r.role}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted truncate">{r.email}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Type your message…"
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:border-navy/50"
              disabled={sending}
            />
            <p className="text-[10px] text-text-muted text-right mt-1">{body.length}/2000</p>
          </div>

          {error && (
            <div className="bg-red/10 border border-red/20 rounded-lg px-3 py-2 text-red text-xs">
              {error}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-text-muted hover:bg-off-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={!selected || !body.trim() || sending}
            className="px-3 py-2 rounded-lg bg-red text-white text-sm font-semibold hover:bg-red/90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" aria-hidden="true" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
