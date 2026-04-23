import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  sendPushNotification,
  isVapidConfigured,
} from "@/lib/push-notifications";
import { logger } from "@/lib/logger";

// Max-length caps protect against oversized payloads — web-push limits
// the total encrypted payload to ~4KB, so keep fields well under that.
const sendSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  url: z.string().max(500).optional(),
  audience: z.enum(["all", "coaches", "parents", "admins"]).optional(),
});

const ADMIN_ROLES = ["admin", "staff"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isVapidConfigured()) {
    return NextResponse.json(
      { error: "Push notifications not configured — VAPID keys missing" },
      { status: 503 }
    );
  }

  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = sendSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }
    const { title, body: notifBody, url, audience } = parsed.data;

    // Query subscriptions filtered by audience/role
    let subs;
    const roleMap: Record<string, string[]> = {
      coaches: ["coach"],
      parents: ["parent"],
      admins: ["admin", "staff"],
    };

    if (audience && audience !== "all" && roleMap[audience]) {
      const roles = roleMap[audience];
      subs = await db
        .select()
        .from(pushSubscriptions)
        .where(inArray(pushSubscriptions.userRole, roles));
    } else {
      subs = await db.select().from(pushSubscriptions);
    }

    let sent = 0;
    let failed = 0;
    let expired = 0;

    const payload = {
      title,
      body: notifBody,
      url: url || "/",
      icon: "/apple-icon-180x180.png",
    };

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          const success = await sendPushNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );

          if (success) {
            sent++;
          } else {
            // 410 — expired, delete it
            expired++;
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
          }
        } catch {
          failed++;
        }
      })
    );

    return NextResponse.json({ sent, failed, expired });
  } catch (err) {
    logger.error("Push send failed", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
