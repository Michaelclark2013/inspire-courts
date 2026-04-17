import webpush from "web-push";
import { logger } from "@/lib/logger";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:info@inspirecourtsaz.com";

let vapidConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  } catch (err) {
    logger.warn("Failed to configure VAPID keys", { error: String(err) });
  }
} else {
  logger.warn(
    "VAPID keys not set — push notifications disabled. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env."
  );
}

export function isVapidConfigured(): boolean {
  return vapidConfigured;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string; icon?: string }
): Promise<boolean> {
  if (!vapidConfigured) {
    logger.warn("Cannot send push — VAPID keys not configured");
    return false;
  }

  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && "statusCode" in error && (error as { statusCode: number }).statusCode === 410) {
      // Subscription expired — caller should delete it
      return false;
    }
    throw error;
  }
}

export { VAPID_PUBLIC_KEY };
