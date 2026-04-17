import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  sendPushNotification,
  isVapidConfigured,
} from "@/lib/push-notifications";

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
    const body = await req.json();
    const { title, body: notifBody, url, audience } = body;

    if (!title || !notifBody) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    // Query subscriptions filtered by audience/role
    let subs;
    const roleMap: Record<string, string[]> = {
      coaches: ["coach"],
      parents: ["parent"],
      admins: ["admin", "staff"],
    };

    if (audience && audience !== "all" && roleMap[audience]) {
      const roles = roleMap[audience];
      // Drizzle doesn't have an .in() for text easily, so we query all and filter
      const allSubs = await db.select().from(pushSubscriptions);
      subs = allSubs.filter((s) => roles.includes(s.userRole ?? ""));
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
    console.error("[push/send] Error:", err);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
