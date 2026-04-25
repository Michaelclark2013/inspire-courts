import twilio from "twilio";
import { db } from "@/lib/db";
import { smsMessages, smsOptOuts, members } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ── Twilio client (lazy) ─────────────────────────────────────────────
const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
const authToken = process.env.TWILIO_AUTH_TOKEN || "";
const fromNumber = process.env.TWILIO_PHONE_NUMBER || "";

let _client: ReturnType<typeof twilio> | null = null;
function getClient() {
  if (!_client) _client = twilio(accountSid, authToken);
  return _client;
}

export function isTwilioConfigured(): boolean {
  return Boolean(accountSid && authToken && fromNumber);
}

// ── Phone normalization ──────────────────────────────────────────────
// Always store + match on E.164 (+1480xxxxxxx). Strip everything else.
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+")) return raw;
  return null;
}

// ── Opt-out check ────────────────────────────────────────────────────
export async function isOptedOut(phone: string): Promise<boolean> {
  const norm = normalizePhone(phone);
  if (!norm) return true; // can't send to invalid numbers
  const [row] = await db.select().from(smsOptOuts).where(eq(smsOptOuts.phone, norm)).limit(1);
  return !!row;
}

export async function recordOptOut(phone: string, reason?: string): Promise<void> {
  const norm = normalizePhone(phone);
  if (!norm) return;
  await db
    .insert(smsOptOuts)
    .values({ phone: norm, reason: reason || "user_replied_stop" })
    .onConflictDoNothing();
}

// ── Body interpolation ───────────────────────────────────────────────
// Replace {placeholder} tokens with member fields. Unknown tokens are
// left as-is so the human can spot them in the journey UI.
export function interpolate(body: string, ctx: Record<string, string | number | null>): string {
  return body.replace(/\{(\w+)\}/g, (m, key) => {
    const v = ctx[key];
    return v === null || v === undefined ? m : String(v);
  });
}

// ── Send ─────────────────────────────────────────────────────────────
export async function sendSms(opts: {
  to: string;
  body: string;
  memberId?: number | null;
  userId?: number | null;
  threadKey?: string;
  journeyId?: number | null;
  journeyStepId?: number | null;
  sentBy?: number | null;
}): Promise<{ ok: boolean; sid?: string; error?: string; messageId: number }> {
  const norm = normalizePhone(opts.to);
  if (!norm) {
    const [row] = await db
      .insert(smsMessages)
      .values({
        memberId: opts.memberId ?? null,
        userId: opts.userId ?? null,
        phone: opts.to,
        direction: "outbound",
        body: opts.body,
        status: "failed",
        errorCode: "INVALID_PHONE",
        errorMessage: "Phone could not be normalized to E.164",
        threadKey: opts.threadKey || null,
        journeyId: opts.journeyId ?? null,
        journeyStepId: opts.journeyStepId ?? null,
        sentBy: opts.sentBy ?? null,
      })
      .returning({ id: smsMessages.id });
    return { ok: false, error: "INVALID_PHONE", messageId: row.id };
  }

  if (await isOptedOut(norm)) {
    const [row] = await db
      .insert(smsMessages)
      .values({
        memberId: opts.memberId ?? null,
        userId: opts.userId ?? null,
        phone: norm,
        direction: "outbound",
        body: opts.body,
        status: "failed",
        errorCode: "OPTED_OUT",
        errorMessage: "Recipient previously opted out",
        threadKey: opts.threadKey || null,
        journeyId: opts.journeyId ?? null,
        journeyStepId: opts.journeyStepId ?? null,
        sentBy: opts.sentBy ?? null,
      })
      .returning({ id: smsMessages.id });
    return { ok: false, error: "OPTED_OUT", messageId: row.id };
  }

  // Insert pending row up front so we always have a record even if
  // Twilio throws.
  const [pending] = await db
    .insert(smsMessages)
    .values({
      memberId: opts.memberId ?? null,
      userId: opts.userId ?? null,
      phone: norm,
      direction: "outbound",
      body: opts.body,
      status: "queued",
      threadKey: opts.threadKey || null,
      journeyId: opts.journeyId ?? null,
      journeyStepId: opts.journeyStepId ?? null,
      sentBy: opts.sentBy ?? null,
    })
    .returning({ id: smsMessages.id });

  if (!isTwilioConfigured()) {
    logger.warn("Twilio not configured, SMS would have sent", { to: norm, body: opts.body });
    await db
      .update(smsMessages)
      .set({ status: "failed", errorCode: "TWILIO_NOT_CONFIGURED" })
      .where(eq(smsMessages.id, pending.id));
    return { ok: false, error: "TWILIO_NOT_CONFIGURED", messageId: pending.id };
  }

  try {
    const msg = await getClient().messages.create({
      to: norm,
      from: fromNumber,
      body: opts.body,
    });
    await db
      .update(smsMessages)
      .set({ status: "sent", twilioSid: msg.sid })
      .where(eq(smsMessages.id, pending.id));
    return { ok: true, sid: msg.sid, messageId: pending.id };
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    await db
      .update(smsMessages)
      .set({ status: "failed", errorCode: String(e.code || "UNKNOWN"), errorMessage: e.message || "Send failed" })
      .where(eq(smsMessages.id, pending.id));
    return { ok: false, error: String(e.code || "UNKNOWN"), messageId: pending.id };
  }
}

// ── Inbound webhook handling ─────────────────────────────────────────
// Twilio POSTs to /api/webhooks/twilio when a number replies.
// We: (1) record it, (2) check for STOP/UNSUBSCRIBE keywords, (3) halt
// any active journey enrollment for this phone so a real human can take over.
const STOP_KEYWORDS = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "QUIT", "END"];
const RESUME_KEYWORDS = ["START", "UNSTOP"];

export async function handleInboundSms(opts: {
  from: string;
  body: string;
  twilioSid: string;
}): Promise<{ recorded: boolean; optOut: boolean }> {
  const norm = normalizePhone(opts.from);
  if (!norm) return { recorded: false, optOut: false };
  const trimmed = opts.body.trim().toUpperCase();

  // Resolve to member if we know this number.
  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(sql`REPLACE(REPLACE(REPLACE(${members.phone}, '-', ''), '(', ''), ')', '') LIKE ${"%" + norm.replace(/\D/g, "").slice(-10) + "%"}`)
    .limit(1);

  // Record inbound first.
  await db.insert(smsMessages).values({
    memberId: member?.id || null,
    phone: norm,
    direction: "inbound",
    body: opts.body,
    status: "received",
    twilioSid: opts.twilioSid,
  });

  // Halt any active journey for this member — a human replied, AI shuts up.
  if (member) {
    const { journeyEnrollments } = await import("@/lib/db/schema");
    const now = new Date().toISOString();
    await db
      .update(journeyEnrollments)
      .set({ haltedByReplyAt: now, status: "completed", completedAt: now })
      .where(eq(journeyEnrollments.memberId, member.id));
  }

  if (STOP_KEYWORDS.includes(trimmed)) {
    await recordOptOut(norm, "user_replied_stop");
    return { recorded: true, optOut: true };
  }
  if (RESUME_KEYWORDS.includes(trimmed)) {
    await db.delete(smsOptOuts).where(eq(smsOptOuts.phone, norm));
  }
  return { recorded: true, optOut: false };
}
