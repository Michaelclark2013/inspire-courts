import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { apiError } from "@/lib/api-helpers";
import {
  insertMessage,
  isParticipant,
  notifyNewMessage,
  MESSAGE_MAX_LENGTH,
} from "@/lib/messaging";
import { db } from "@/lib/db";
import { messages, users, conversationParticipants } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";

// GET /api/admin/messages/[id] — fetch a thread's messages and mark
// it read for the calling user.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "messages")) {
    return apiError("Unauthorized", 401);
  }
  const meId = Number(session.user.id);
  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isFinite(conversationId)) return apiError("Bad id", 400);

  if (!(await isParticipant(conversationId, meId))) {
    return apiError("Not a participant", 403);
  }

  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      senderUserId: messages.senderUserId,
      senderName: users.name,
    })
    .from(messages)
    .leftJoin(users, eq(users.id, messages.senderUserId))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(500);

  // Mark read.
  const now = new Date().toISOString();
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: now })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, meId),
      ),
    );

  return NextResponse.json({ messages: rows });
}

// POST /api/admin/messages/[id] — send a reply on this thread.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "messages")) {
    return apiError("Unauthorized", 401);
  }
  const meId = Number(session.user.id);
  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isFinite(conversationId)) return apiError("Bad id", 400);

  if (!(await isParticipant(conversationId, meId))) {
    return apiError("Not a participant", 403);
  }

  let payload: { body?: string };
  try {
    payload = await req.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }
  const body = (payload?.body || "").trim();
  if (!body) return apiError("Body required", 400);
  if (body.length > MESSAGE_MAX_LENGTH) {
    return apiError(`Message too long (max ${MESSAGE_MAX_LENGTH})`, 400);
  }

  const msg = await insertMessage(conversationId, meId, body);
  notifyNewMessage({
    conversationId,
    senderUserId: meId,
    senderName: session.user.name || session.user.email || "Inspire Courts",
    preview: body,
  }).catch(() => {});

  return NextResponse.json({
    messageId: msg.id,
    createdAt: msg.createdAt,
  });
}
