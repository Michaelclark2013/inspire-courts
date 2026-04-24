import { db } from "@/lib/db";
import { pushSubscriptions, announcements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { sendPushNotification, isVapidConfigured } from "@/lib/push-notifications";

// Fan-out a push notification to every subscribed user that matches
// an announcement's audience. Returns how many devices actually
// received it. Silently noops if VAPID isn't configured — admin UI
// can still mark the announcement as "pushed" so the button reflects
// intent even if the infra isn't wired yet.
export async function pushAnnouncement(announcementId: number): Promise<{ sent: number; total: number }> {
  const [a] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1);
  if (!a) return { sent: 0, total: 0 };

  // Pull subscriptions. We don't join on users; the push_subscriptions
  // row stores userRole directly so audience filtering is cheap.
  const subs = await db.select().from(pushSubscriptions);

  const filtered = subs.filter((s) => {
    if (!a.audience || a.audience === "all") return true;
    const role = (s.userRole || "").toLowerCase();
    if (a.audience === role) return true;
    if (a.audience === "coaches" && role === "coach") return true;
    if (a.audience === "parents" && role === "parent") return true;
    if (a.audience === "staff" && ["staff", "front_desk", "ref"].includes(role)) return true;
    return false;
  });

  if (!isVapidConfigured()) {
    await db
      .update(announcements)
      .set({ pushSent: true, pushSentAt: new Date().toISOString() })
      .where(eq(announcements.id, announcementId));
    return { sent: 0, total: filtered.length };
  }

  let sent = 0;
  const dead: number[] = [];
  for (const s of filtered) {
    try {
      const ok = await sendPushNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        {
          title: a.title,
          body: a.body.slice(0, 200),
          url: a.ctaUrl || "/portal",
        }
      );
      if (ok) sent++;
      else dead.push(s.id);
    } catch (err) {
      logger.warn("push delivery failed", { error: String(err), subId: s.id });
    }
  }

  // Clean up expired subscriptions (410 Gone)
  if (dead.length > 0) {
    for (const id of dead) {
      try { await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id)); } catch { /* ignore */ }
    }
  }

  await db
    .update(announcements)
    .set({ pushSent: true, pushSentAt: new Date().toISOString() })
    .where(eq(announcements.id, announcementId));

  return { sent, total: filtered.length };
}
