import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  tournamentRegistrations,
  tournamentTeams,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/square";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

// POST /api/webhooks/square — Square payment webhook
//
// Square may redeliver the same webhook event for up to 24h on transient
// network failures. We dedupe on payment.id within the process to avoid
// emitting duplicate audit entries and double-triggering team creation —
// the DB check (`reg.paymentStatus === "paid"`) is the hard guarantee,
// but deduping up-front keeps audit noise down.
const TTL_MS = 10 * 60 * 1000;
const MAX_SEEN = 1000;
const seenPaymentIds = new Map<string, number>();

function rememberPayment(id: string): boolean {
  const now = Date.now();
  // Prune expired as we go so the map never grows unbounded.
  for (const [k, ts] of seenPaymentIds) {
    if (now - ts > TTL_MS) seenPaymentIds.delete(k);
  }
  if (seenPaymentIds.has(id)) return false; // already seen
  seenPaymentIds.set(id, now);
  while (seenPaymentIds.size > MAX_SEEN) {
    const first = seenPaymentIds.keys().next().value;
    if (!first) break;
    seenPaymentIds.delete(first);
  }
  return true;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature") || "";
  const url = request.url;

  // Verify signature. In production we REFUSE to process unsigned
  // webhooks: if SQUARE_WEBHOOK_SIGNATURE_KEY isn't set in prod, that's
  // a partial-config deployment (access token without webhook key) —
  // an attacker could otherwise POST a crafted body and flip registrations
  // to "paid". In dev/sandbox we still allow unsigned for local testing
  // but log loudly so a missing key in prod gets noticed.
  const sigKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (sigKey) {
    const valid = await verifyWebhookSignature(body, signature, url);
    if (!valid) {
      logger.warn("Square webhook signature rejected", {
        ua: request.headers.get("user-agent") || null,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    logger.error("Square webhook hit production without SQUARE_WEBHOOK_SIGNATURE_KEY — refusing to process unsigned event");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  } else {
    logger.warn("Square webhook received without SQUARE_WEBHOOK_SIGNATURE_KEY configured — signature not verified (dev only)");
  }

  let event: {
    event_id?: string;
    type: string;
    data?: {
      object?: {
        payment?: {
          id: string;
          order_id: string;
          status: string;
          reference_id?: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle payment.completed / payment.updated
  if (event.type === "payment.completed" || event.type === "payment.updated") {
    const payment = event.data?.object?.payment;
    if (!payment) {
      return NextResponse.json({ ok: true });
    }

    // Dedupe by payment.id — cheap in-process guard. DB check below
    // is still authoritative.
    const fresh = rememberPayment(payment.id);
    if (!fresh) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const orderId = payment.order_id;
    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    try {
      const [reg] = await db
        .select()
        .from(tournamentRegistrations)
        .where(eq(tournamentRegistrations.squareOrderId, orderId));

      if (!reg) {
        // Non-tournament payment (or stale order) — ignore but audit so
        // we can investigate unmatched payments.
        await recordAudit({
          session: null,
          action: "webhook.square.payment_unmatched",
          entityType: "square_payment",
          entityId: payment.id,
          after: { orderId, eventType: event.type, eventId: event.event_id ?? null },
          request,
        });
        return NextResponse.json({ ok: true });
      }

      if (reg.paymentStatus === "paid") {
        // Already processed — no-op but audit the redelivery for visibility.
        await recordAudit({
          session: null,
          action: "webhook.square.payment_replay",
          entityType: "registration",
          entityId: reg.id,
          after: { paymentId: payment.id, eventType: event.type },
          request,
        });
        return NextResponse.json({ ok: true });
      }

      // Mark as paid + flip to approved
      await db
        .update(tournamentRegistrations)
        .set({
          paymentStatus: "paid",
          squarePaymentId: payment.id,
          status: "approved",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tournamentRegistrations.id, reg.id));

      // Auto-add team to tournament (idempotent — skip if already exists)
      const existingTeams = await db
        .select()
        .from(tournamentTeams)
        .where(eq(tournamentTeams.tournamentId, reg.tournamentId));

      const alreadyAdded = existingTeams.some(
        (t) => t.teamName === reg.teamName && t.division === (reg.division || null)
      );

      if (!alreadyAdded) {
        await db.insert(tournamentTeams).values({
          tournamentId: reg.tournamentId,
          teamName: reg.teamName,
          division: reg.division || null,
          seed: existingTeams.length + 1,
        });
      }

      // Audit the successful state transition. Webhook writes are the only
      // admin-adjacent mutation path without a human actor; this row is
      // how we reconstruct "when did this registration actually get paid?"
      await recordAudit({
        session: null,
        action: "webhook.square.payment_completed",
        entityType: "registration",
        entityId: reg.id,
        before: { paymentStatus: reg.paymentStatus, status: reg.status },
        after: {
          paymentStatus: "paid",
          status: "approved",
          paymentId: payment.id,
          teamPromoted: !alreadyAdded,
          eventId: event.event_id ?? null,
        },
        request,
      });
    } catch (err) {
      logger.error("Square webhook processing failed", {
        paymentId: payment.id,
        orderId,
        error: String(err),
      });
      // Return 500 so Square retries the event — the dedupe guard will
      // short-circuit the replay if the first attempt actually succeeded
      // partway through.
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
