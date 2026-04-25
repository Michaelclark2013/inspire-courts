import { createHash, randomBytes, createHmac } from "crypto";
import { db } from "@/lib/db";
import { apiKeys, webhookSubscriptions, webhookDeliveries } from "@/lib/db/schema";
import { and, eq, isNull, or, gte } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ── API key utilities ────────────────────────────────────────────────

export function generateApiKey(): { plaintext: string; hash: string; prefix: string } {
  const random = randomBytes(24).toString("hex");
  const plaintext = `ic_${random}`; // ic_<48hex> = 51 chars
  const hash = createHash("sha256").update(plaintext).digest("hex");
  const prefix = plaintext.slice(0, 11); // "ic_" + 8 chars
  return { plaintext, hash, prefix };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/**
 * Verify a request's `Authorization: Bearer ic_...` header.
 * Returns the matching key row (with scopes) or null.
 */
export async function verifyApiKey(
  authHeader: string | null
): Promise<{ id: number; scopes: string[] } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token.startsWith("ic_")) return null;
  const hash = hashApiKey(token);
  const now = new Date().toISOString();
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyHash, hash),
        isNull(apiKeys.revokedAt),
        or(isNull(apiKeys.expiresAt), gte(apiKeys.expiresAt, now))
      )
    )
    .limit(1);
  if (!row) return null;
  // Stamp last-used asynchronously — don't block the request.
  db.update(apiKeys)
    .set({ lastUsedAt: now })
    .where(eq(apiKeys.id, row.id))
    .catch(() => {});
  return { id: row.id, scopes: row.scopes.split(",").map((s) => s.trim()) };
}

// ── Webhook delivery ─────────────────────────────────────────────────
// Sign every delivery so receivers can verify authenticity.

export function signWebhook(secret: string, payload: string, timestamp: string): string {
  const signed = `${timestamp}.${payload}`;
  return createHmac("sha256", secret).update(signed).digest("hex");
}

/**
 * Fan out an event to every active subscription whose `events` matches.
 * Best-effort + non-blocking — failures are logged + retried by a future
 * cron tick (we record failureCount but don't block the caller).
 */
export async function fireWebhookEvent(eventType: string, data: unknown): Promise<{ delivered: number }> {
  const subs = await db
    .select()
    .from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.active, true));

  const matches = subs.filter((s) => {
    const events = s.events.split(",").map((e) => e.trim());
    return events.includes("*") || events.includes(eventType);
  });
  if (matches.length === 0) return { delivered: 0 };

  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ event: eventType, timestamp, data });

  let delivered = 0;
  await Promise.all(
    matches.map(async (sub) => {
      const sig = signWebhook(sub.secret, payload, timestamp);
      let status: number | null = null;
      let body: string | null = null;
      let errorMessage: string | null = null;
      try {
        const res = await fetch(sub.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Inspire-Signature": sig,
            "X-Inspire-Timestamp": timestamp,
            "X-Inspire-Event": eventType,
          },
          body: payload,
          signal: AbortSignal.timeout(8_000),
        });
        status = res.status;
        body = (await res.text()).slice(0, 1000);
        if (res.ok) delivered++;
      } catch (err) {
        errorMessage = String(err);
        logger.warn("webhook delivery failed", { url: sub.url, error: errorMessage });
      }

      await db.insert(webhookDeliveries).values({
        subscriptionId: sub.id,
        eventType,
        payload,
        status,
        responseBody: body,
        errorMessage,
      });

      const isOk = status !== null && status >= 200 && status < 300;
      await db
        .update(webhookSubscriptions)
        .set({
          lastDeliveryAt: timestamp,
          lastDeliveryStatus: status,
          failureCount: isOk ? 0 : sub.failureCount + 1,
        })
        .where(eq(webhookSubscriptions.id, sub.id));
    })
  );

  return { delivered };
}
