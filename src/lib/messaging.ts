import { db } from "@/lib/db";
import { conversations, conversationParticipants, messages, users, pushSubscriptions } from "@/lib/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { sendPushNotification, isVapidConfigured } from "@/lib/push-notifications";

// Message body cap — keeps the messages table from accumulating
// pasted-document chunks and keeps push notification payloads under
// browser limits. Mirrors the SMS body cap.
export const MESSAGE_MAX_LENGTH = 2000;

export type ConversationWithLastMessage = {
  id: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageSenderId: number | null;
  myLastReadAt: string | null;
  unread: boolean;
  other: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
};

/**
 * Find an existing 1:1 conversation between two users, or null.
 * Two-row INTERSECT against conversation_participants on userId.
 */
export async function findDirectConversation(
  userIdA: number,
  userIdB: number,
): Promise<number | null> {
  if (userIdA === userIdB) return null;
  // Conversations where BOTH users are participants AND no other
  // participants exist. We model only 1:1 today, but the count guard
  // future-proofs against accidental third-party joins.
  const rows = await db
    .select({ id: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(inArray(conversationParticipants.userId, [userIdA, userIdB]))
    .all();
  // Group counts client-side — small set per user.
  const counts = new Map<number, number>();
  for (const r of rows) counts.set(r.id, (counts.get(r.id) || 0) + 1);
  const candidateIds = [...counts.entries()]
    .filter(([, c]) => c === 2)
    .map(([id]) => id);
  if (candidateIds.length === 0) return null;
  // Of those, pick one whose total participant count is exactly 2.
  for (const cid of candidateIds) {
    const total = await db
      .select({ c: sql<number>`count(*)` })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, cid));
    if (total[0]?.c === 2) return cid;
  }
  return null;
}

/**
 * Get-or-create a 1:1 conversation between two user IDs. Returns the
 * conversation id. Idempotent; safe to call from "compose" buttons.
 */
export async function ensureDirectConversation(
  meUserId: number,
  otherUserId: number,
): Promise<number> {
  const existing = await findDirectConversation(meUserId, otherUserId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const [conv] = await db
    .insert(conversations)
    .values({
      lastMessageAt: now,
      lastMessagePreview: null,
      createdBy: meUserId,
    })
    .returning();
  await db.insert(conversationParticipants).values([
    { conversationId: conv.id, userId: meUserId, joinedAt: now },
    { conversationId: conv.id, userId: otherUserId, joinedAt: now },
  ]);
  return conv.id;
}

/**
 * List my conversations, newest first, with the *other* participant
 * pre-joined and an unread flag computed from my lastReadAt.
 */
export async function listMyConversations(
  meUserId: number,
  limit = 100,
): Promise<ConversationWithLastMessage[]> {
  // Join participants → conversations, scoped to me, sorted by recency.
  const rows = await db
    .select({
      id: conversations.id,
      lastMessageAt: conversations.lastMessageAt,
      lastMessagePreview: conversations.lastMessagePreview,
      lastMessageSenderId: conversations.lastMessageSenderId,
      myLastReadAt: conversationParticipants.lastReadAt,
    })
    .from(conversationParticipants)
    .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
    .where(eq(conversationParticipants.userId, meUserId))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const convIds = rows.map((r) => r.id);
  // Other participants in one query.
  const otherRows = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(users.id, conversationParticipants.userId))
    .where(
      and(
        inArray(conversationParticipants.conversationId, convIds),
        sql`${conversationParticipants.userId} != ${meUserId}`,
      ),
    );
  const otherByConv = new Map<number, ConversationWithLastMessage["other"]>();
  for (const o of otherRows) {
    otherByConv.set(o.conversationId, {
      id: o.userId,
      name: o.name,
      email: o.email,
      role: o.role,
    });
  }

  return rows.map((r) => {
    const unread = !!(r.lastMessageSenderId && r.lastMessageSenderId !== meUserId &&
      (!r.myLastReadAt || r.myLastReadAt < r.lastMessageAt));
    return {
      id: r.id,
      lastMessageAt: r.lastMessageAt,
      lastMessagePreview: r.lastMessagePreview,
      lastMessageSenderId: r.lastMessageSenderId,
      myLastReadAt: r.myLastReadAt,
      unread,
      other: otherByConv.get(r.id) ?? null,
    };
  });
}

/** Count unread threads for a user — used by the sidebar badge. */
export async function countUnreadThreads(meUserId: number): Promise<number> {
  const rows = await listMyConversations(meUserId, 500);
  return rows.filter((r) => r.unread).length;
}

/**
 * Insert a message and update the conversation's last_message_*
 * denormalized fields. Returns the new message row.
 *
 * Caller must have already verified senderUserId is a participant.
 */
export async function insertMessage(
  conversationId: number,
  senderUserId: number,
  body: string,
): Promise<{ id: number; createdAt: string }> {
  const now = new Date().toISOString();
  const trimmed = body.trim().slice(0, MESSAGE_MAX_LENGTH);
  const [m] = await db
    .insert(messages)
    .values({
      conversationId,
      senderUserId,
      body: trimmed,
      createdAt: now,
    })
    .returning();
  await db
    .update(conversations)
    .set({
      lastMessageAt: now,
      lastMessagePreview: trimmed.slice(0, 140),
      lastMessageSenderId: senderUserId,
    })
    .where(eq(conversations.id, conversationId));
  // Bump sender's lastReadAt — they obviously read what they just sent.
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: now })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, senderUserId),
      ),
    );
  return { id: m.id, createdAt: now };
}

/** Verify that userId is a participant on conversationId. */
export async function isParticipant(
  conversationId: number,
  userId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ uid: conversationParticipants.userId })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .limit(1);
  return !!row;
}

/**
 * Notify the recipient(s) of a new message via web push, respecting
 * VAPID config and the user's notification prefs. Fires-and-forgets.
 */
export async function notifyNewMessage(opts: {
  conversationId: number;
  senderUserId: number;
  senderName: string;
  preview: string;
}): Promise<void> {
  if (!isVapidConfigured()) return;
  // Recipients = all participants except the sender.
  const recipients = await db
    .select({ userId: conversationParticipants.userId })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, opts.conversationId),
        sql`${conversationParticipants.userId} != ${opts.senderUserId}`,
      ),
    );
  if (recipients.length === 0) return;

  const recipientIds = recipients.map((r) => String(r.userId));
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, recipientIds));
  if (subs.length === 0) return;

  // Honor opt-outs — re-uses the same push.announcements pref key for
  // now. Splitting per-channel prefs is a follow-up.
  const userRows = await db
    .select({ id: users.id, prefs: users.notificationPrefsJson })
    .from(users)
    .where(inArray(users.id, recipients.map((r) => r.userId)));
  const optedOut = new Set<number>();
  for (const u of userRows) {
    if (!u.prefs) continue;
    try {
      const p = JSON.parse(u.prefs) as { push?: { announcements?: boolean } };
      if (p?.push?.announcements === false) optedOut.add(u.id);
    } catch { /* ignore */ }
  }

  for (const s of subs) {
    const uid = Number(s.userId);
    if (Number.isFinite(uid) && optedOut.has(uid)) continue;
    try {
      await sendPushNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        {
          title: opts.senderName || "New message",
          body: opts.preview.slice(0, 180),
          url: `/admin/messages?c=${opts.conversationId}`,
        },
      );
    } catch (err) {
      logger.warn("message push failed", { err: String(err), subId: s.id });
    }
  }
}
