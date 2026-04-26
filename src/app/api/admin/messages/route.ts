import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { apiError } from "@/lib/api-helpers";
import {
  ensureDirectConversation,
  insertMessage,
  listMyConversations,
  notifyNewMessage,
  MESSAGE_MAX_LENGTH,
} from "@/lib/messaging";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/messages — my thread list, newest first.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "messages")) {
    return apiError("Unauthorized", 401);
  }
  const meId = Number(session.user.id);
  if (!Number.isFinite(meId)) return apiError("Bad session", 400);
  const threads = await listMyConversations(meId);
  return NextResponse.json({ threads });
}

// POST /api/admin/messages — start (or open existing) a 1:1 thread
// with `recipientUserId` and send the first `body`. Idempotent on the
// thread; replies happen via /api/admin/messages/[id].
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "messages")) {
    return apiError("Unauthorized", 401);
  }
  const meId = Number(session.user.id);
  if (!Number.isFinite(meId)) return apiError("Bad session", 400);

  let payload: { recipientUserId?: number; body?: string };
  try {
    payload = await req.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }
  const recipientUserId = Number(payload?.recipientUserId);
  const body = (payload?.body || "").trim();
  if (!Number.isFinite(recipientUserId) || recipientUserId <= 0) {
    return apiError("recipientUserId required", 400);
  }
  if (recipientUserId === meId) {
    return apiError("Cannot message yourself", 400);
  }
  if (!body) return apiError("Message body required", 400);
  if (body.length > MESSAGE_MAX_LENGTH) {
    return apiError(`Message too long (max ${MESSAGE_MAX_LENGTH})`, 400);
  }

  const [recipient] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, recipientUserId))
    .limit(1);
  if (!recipient) return apiError("Recipient not found", 404);

  const conversationId = await ensureDirectConversation(meId, recipientUserId);
  const msg = await insertMessage(conversationId, meId, body);

  // Fire-and-forget push.
  notifyNewMessage({
    conversationId,
    senderUserId: meId,
    senderName: session.user.name || session.user.email || "Inspire Courts",
    preview: body,
  }).catch(() => {});

  return NextResponse.json({
    conversationId,
    messageId: msg.id,
    createdAt: msg.createdAt,
  });
}
