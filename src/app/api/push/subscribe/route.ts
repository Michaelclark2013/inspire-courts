import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { isRateLimited } from "@/lib/rate-limit";

// Web Push subscription shape (RFC 8030). Endpoints are URLs from
// push services (FCM/APNs proxy); keys are base64url-encoded.
const subscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 subscriptions per 10 minutes per user
  if (isRateLimited(`push-sub:${session.user.id}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid subscription data" },
        { status: 400 }
      );
    }
    const { endpoint, keys } = parsed.data;

    // Upsert: delete existing subscription for this endpoint, then insert
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    await db.insert(pushSubscriptions).values({
      userId: String(session.user.id ?? ""),
      userEmail: session.user.email ?? "",
      userRole: session.user.role ?? "",
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Push subscribe failed", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = unsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }
    const { endpoint } = parsed.data;

    // Only allow deleting subscriptions owned by the current user
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, String(session.user.id ?? ""))
        )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Push unsubscribe failed", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
