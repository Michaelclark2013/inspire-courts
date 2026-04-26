"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Send,
  Search,
  X,
  RefreshCw,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SkeletonRows } from "@/components/ui/SkeletonCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";

type ThreadOther = {
  id: number;
  name: string;
  email: string;
  role: string;
};

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

type Recipient = {
  id: number;
  name: string;
  email: string;
  role: string;
};

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

function MessagesPageInner() {
  useDocumentTitle("Messages");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const myRole = (session?.user?.role || "admin") as UserRole;
  const myId = Number(session?.user?.id);

  const initialConvId = Number(searchParams.get("c")) || null;
  const initialRecipientId = Number(searchParams.get("to")) || null;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(initialConvId);
  const [composeOpen, setComposeOpen] = useState(false);
  const [pendingRecipientId, setPendingRecipientId] = useState<number | null>(initialRecipientId);

  const refreshThreads = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/messages");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setThreadsError((data as { error?: string })?.error || `Failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as { threads: Thread[] };
      setThreads(data.threads || []);
      setThreadsError(null);
    } catch {
      setThreadsError("Network error loading threads.");
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshThreads();
  }, [refreshThreads]);

  // Poll thread list every 20s for new arrivals.
  useEffect(() => {
    const t = setInterval(() => void refreshThreads(), 20_000);
    return () => clearInterval(t);
  }, [refreshThreads]);

  // If url had ?to=USERID, open compose with that recipient pre-selected.
  useEffect(() => {
    if (initialRecipientId && !initialConvId) setComposeOpen(true);
  }, [initialRecipientId, initialConvId]);

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
    // Optimistic: clear unread now; server marks read on GET.
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
    <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-[1400px] mx-auto">
      <header className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-red/10 p-2 rounded-lg flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-red" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-navy truncate">Messages</h1>
            <p className="text-xs sm:text-sm text-text-muted">
              {totalUnread > 0
                ? `${totalUnread} unread thread${totalUnread === 1 ? "" : "s"}`
                : "Direct messages with your team"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red text-white text-sm font-semibold hover:bg-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">New message</span>
          <span className="sm:hidden">New</span>
        </button>
      </header>

      {threadsError && (
        <ErrorBanner
          message={threadsError}
          onDismiss={() => {
            setThreadsError(null);
            setThreadsLoading(true);
            void refreshThreads();
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 lg:gap-6 min-h-[60vh]">
        {/* Thread list — hidden on mobile when a thread is open */}
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
              <div className="p-3"><SkeletonRows count={5} /></div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-muted">
                No conversations yet. Tap <span className="font-semibold">New message</span> to start one.
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
                          <span className="w-2 h-2 rounded-full bg-red flex-shrink-0" aria-label="Unread" />
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
                        <span className={"text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase " + (ROLE_COLORS[t.other.role as UserRole] || "bg-gray-100 text-gray-600")}>
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

        {/* Conversation pane */}
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
          myRole={myRole}
          initialRecipientId={pendingRecipientId}
          onClose={() => {
            setComposeOpen(false);
            setPendingRecipientId(null);
          }}
          onCreated={(conversationId) => {
            setComposeOpen(false);
            setPendingRecipientId(null);
            void refreshThreads();
            setSelectedId(conversationId);
            const url = new URL(window.location.href);
            url.searchParams.set("c", String(conversationId));
            url.searchParams.delete("to");
            window.history.replaceState({}, "", url.toString());
          }}
        />
      )}
    </div>
  );
}

export default function MessagesPage() {
  // useSearchParams must be wrapped in Suspense in the App Router.
  return (
    <Suspense fallback={<div className="p-6 text-text-muted text-sm">Loading messages…</div>}>
      <MessagesPageInner />
    </Suspense>
  );
}

// ── Conversation pane ──────────────────────────────────────────────

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
      const res = await adminFetch(`/api/admin/messages/${conversationId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string })?.error || `Failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as { messages: Message[] };
      setMessages(data.messages || []);
      setError(null);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  // Poll the open thread every 8s for replies.
  useEffect(() => {
    const t = setInterval(() => void refresh(), 8_000);
    return () => clearInterval(t);
  }, [refresh]);

  // Scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await adminFetch(`/api/admin/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string })?.error || `Send failed (${res.status})`);
        return;
      }
      setBody("");
      await refresh();
      onSent();
    } catch {
      setError("Network error sending message.");
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
          {(other?.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy truncate">
            {other?.name || "(deleted user)"}
          </p>
          <p className="text-xs text-text-muted truncate">
            {other?.email}
            {other?.role && (
              <span className={"ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase " + (ROLE_COLORS[other.role as UserRole] || "bg-gray-100 text-gray-600")}>
                {ROLE_LABELS[other.role as UserRole] || other.role}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="p-1.5 rounded-md hover:bg-white text-text-muted"
          title="Refresh"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-white max-h-[55vh] min-h-[40vh]">
        {loading ? (
          <div className="space-y-2">
            <SkeletonRows count={4} />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-text-muted py-8">No messages yet — say hi.</p>
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
                  <p className={"text-[10px] mt-1 " + (mine ? "text-white/70" : "text-text-muted")}>
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
          void handleSend();
        }}
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
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
          className="px-3 py-2 rounded-lg bg-red text-white text-sm font-semibold hover:bg-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 inline-flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </>
  );
}

// ── Compose dialog ─────────────────────────────────────────────────

function ComposeDialog({
  myRole,
  initialRecipientId,
  onClose,
  onCreated,
}: {
  myRole: UserRole;
  initialRecipientId: number | null;
  onClose: () => void;
  onCreated: (conversationId: number) => void;
}) {
  const [scope, setScope] = useState<"staff" | "all">(myRole === "admin" ? "all" : "staff");
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
      params.set("scope", scope);
      const res = await adminFetch(`/api/admin/messages/recipients?${params}`);
      if (!res.ok) {
        setError(`Failed loading recipients (${res.status})`);
        return;
      }
      const data = (await res.json()) as { recipients: Recipient[] };
      setRecipients(data.recipients || []);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [q, scope]);

  useEffect(() => {
    const t = setTimeout(() => void search(), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [search, q]);

  // Pre-fill selection when launched with ?to=USERID
  useEffect(() => {
    if (!initialRecipientId || selected) return;
    void (async () => {
      const res = await adminFetch(`/api/admin/messages/recipients?scope=${scope}`);
      if (!res.ok) return;
      const data = (await res.json()) as { recipients: Recipient[] };
      const found = data.recipients?.find((r) => r.id === initialRecipientId);
      if (found) setSelected(found);
    })();
  }, [initialRecipientId, selected, scope]);

  async function handleSend() {
    if (!selected || !body.trim() || sending) return;
    setSending(true);
    try {
      const res = await adminFetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUserId: selected.id, body: body.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string })?.error || `Send failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as { conversationId: number };
      onCreated(data.conversationId);
    } catch {
      setError("Network error.");
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
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
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
          {myRole === "admin" && (
            <div className="flex gap-2">
              {(["staff", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors " +
                    (scope === s
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-text-muted border-border hover:border-navy/30")
                  }
                >
                  {s === "staff" ? "Staff only" : "All users (incl. coaches/parents)"}
                </button>
              ))}
            </div>
          )}

          {selected ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-off-white rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy truncate">{selected.name}</p>
                <p className="text-xs text-text-muted truncate">{selected.email} · {ROLE_LABELS[selected.role as UserRole] || selected.role}</p>
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
                Recipient
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
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
                  <div className="p-3"><SkeletonRows count={3} /></div>
                ) : recipients.length === 0 ? (
                  <p className="p-3 text-xs text-text-muted text-center">No matches.</p>
                ) : (
                  recipients.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelected(r)}
                      className="w-full text-left px-3 py-2 hover:bg-off-white transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-navy truncate">{r.name}</span>
                        <span className={"text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase " + (ROLE_COLORS[r.role as UserRole] || "bg-gray-100 text-gray-600")}>
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

          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
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
            onClick={() => void handleSend()}
            disabled={!selected || !body.trim() || sending}
            className="px-3 py-2 rounded-lg bg-red text-white text-sm font-semibold hover:bg-red/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
