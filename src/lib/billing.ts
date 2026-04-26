import { db } from "@/lib/db";
import {
  subscriptions,
  invoices,
  paymentMethods,
  members,
  membershipPlans,
} from "@/lib/db/schema";
import { and, eq, isNotNull, lte, or } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { chargeSavedCard, isSquareConfigured } from "@/lib/square";
import { sendBroadcastEmail } from "@/lib/notify";
import { recordAudit } from "@/lib/audit";

// ── Constants ────────────────────────────────────────────────────────
// Dunning ladder. Day-offsets from the failed charge.
const RETRY_SCHEDULE_DAYS = [3, 5, 7];
const MAX_FAILED_ATTEMPTS = 3;

// ── Helpers ──────────────────────────────────────────────────────────

function addInterval(iso: string, interval: "monthly" | "annual"): string {
  const d = new Date(iso);
  if (interval === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Create a subscription. Pulls price from the plan, locks it in, and
 * sets the first period to start now. If `paymentMethodId` is null,
 * the subscription will be flagged for manual collection.
 */
export async function createSubscription(opts: {
  memberId: number;
  planId: number;
  interval?: "monthly" | "annual";
  paymentMethodId?: number | null;
  trialDays?: number;
  startAt?: string; // ISO; defaults to now
}): Promise<{ subscriptionId: number }> {
  const [plan] = await db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.id, opts.planId))
    .limit(1);
  if (!plan) throw new Error("Membership plan not found");

  const interval = opts.interval || "monthly";
  const priceCents =
    interval === "annual"
      ? plan.priceAnnualCents ?? (plan.priceMonthlyCents || 0) * 12
      : plan.priceMonthlyCents || 0;

  if (priceCents <= 0) throw new Error("Plan has no price configured for this interval");

  const start = opts.startAt || new Date().toISOString();
  const end = addInterval(start, interval);
  const trialEndsAt = opts.trialDays && opts.trialDays > 0 ? daysFromNow(opts.trialDays) : null;

  const [row] = await db
    .insert(subscriptions)
    .values({
      memberId: opts.memberId,
      planId: opts.planId,
      status: trialEndsAt ? "trialing" : "active",
      interval,
      priceCents,
      trialEndsAt,
      currentPeriodStart: start,
      // If trialing, the first charge happens at the end of the trial,
      // not at the natural period end.
      currentPeriodEnd: trialEndsAt || end,
      paymentMethodId: opts.paymentMethodId ?? null,
    })
    .returning({ id: subscriptions.id });

  return { subscriptionId: row.id };
}

/**
 * Charge a subscription right now. Used by:
 *   - the renewal cron (when currentPeriodEnd is reached)
 *   - the retry cron (when nextRetryAt is reached)
 *   - admin "charge now" button
 *
 * Logs every attempt to invoices. On success: bumps the period forward,
 * resets failed_attempts, returns invoice. On failure: increments
 * failed_attempts, schedules next retry (or cancels at MAX_FAILED_ATTEMPTS).
 */
export async function chargeSubscription(subscriptionId: number): Promise<{
  ok: boolean;
  invoiceId: number;
  failureCode?: string;
}> {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  if (!sub) throw new Error("Subscription not found");
  if (sub.status === "cancelled") throw new Error("Subscription is cancelled");

  // Create invoice in pending state up front so we have something to
  // attach the result to even if the call throws.
  const [invoice] = await db
    .insert(invoices)
    .values({
      memberId: sub.memberId,
      subscriptionId: sub.id,
      amountCents: sub.priceCents,
      status: "pending",
      periodStart: sub.currentPeriodStart,
      periodEnd: sub.currentPeriodEnd,
      attemptedAt: new Date().toISOString(),
    })
    .returning({ id: invoices.id });

  // No card on file → mark invoice failed with reason "no_payment_method"
  // and flip subscription to past_due. Front desk can chase manually.
  if (!sub.paymentMethodId) {
    await db
      .update(invoices)
      .set({ status: "failed", failureCode: "NO_PAYMENT_METHOD", failureMessage: "No card on file" })
      .where(eq(invoices.id, invoice.id));
    await markPastDue(sub.id, sub.memberId, sub.failedAttempts + 1);
    return { ok: false, invoiceId: invoice.id, failureCode: "NO_PAYMENT_METHOD" };
  }

  if (!isSquareConfigured()) {
    await db
      .update(invoices)
      .set({ status: "failed", failureCode: "SQUARE_NOT_CONFIGURED", failureMessage: "Square is not configured" })
      .where(eq(invoices.id, invoice.id));
    return { ok: false, invoiceId: invoice.id, failureCode: "SQUARE_NOT_CONFIGURED" };
  }

  const [pm] = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, sub.paymentMethodId))
    .limit(1);
  if (!pm) {
    await db
      .update(invoices)
      .set({ status: "failed", failureCode: "PAYMENT_METHOD_MISSING", failureMessage: "Saved card not found" })
      .where(eq(invoices.id, invoice.id));
    await markPastDue(sub.id, sub.memberId, sub.failedAttempts + 1);
    return { ok: false, invoiceId: invoice.id, failureCode: "PAYMENT_METHOD_MISSING" };
  }

  const result = await chargeSavedCard({
    customerId: pm.squareCustomerId,
    cardId: pm.squareCardId,
    amountCents: sub.priceCents,
    idempotencyKey: `sub-${sub.id}-period-${sub.currentPeriodEnd}`,
    note: `Subscription #${sub.id} renewal`,
  });

  if (result.ok) {
    const now = new Date().toISOString();
    await db
      .update(invoices)
      .set({
        status: "paid",
        paidAt: now,
        squarePaymentId: result.paymentId,
        squareReceiptUrl: result.receiptUrl,
      })
      .where(eq(invoices.id, invoice.id));

    // Advance the subscription period forward by one interval.
    const nextStart = sub.currentPeriodEnd;
    const nextEnd = addInterval(nextStart, sub.interval as "monthly" | "annual");
    await db
      .update(subscriptions)
      .set({
        status: "active",
        currentPeriodStart: nextStart,
        currentPeriodEnd: nextEnd,
        failedAttempts: 0,
        nextRetryAt: null,
        lastChargeAt: now,
        lastChargeStatus: "succeeded",
        updatedAt: now,
      })
      .where(eq(subscriptions.id, sub.id));

    // Keep the legacy nextRenewalAt field in sync for the old UI.
    await db
      .update(members)
      .set({ status: "active", nextRenewalAt: nextEnd, updatedAt: now })
      .where(eq(members.id, sub.memberId));

    await recordAudit({
      session: null,
      action: "subscription.charged",
      entityType: "subscription",
      entityId: String(sub.id),
      after: { invoiceId: invoice.id, amountCents: sub.priceCents },
    });

    return { ok: true, invoiceId: invoice.id };
  }

  // Charge failed.
  await db
    .update(invoices)
    .set({
      status: "failed",
      failureCode: result.failureCode || "CHARGE_FAILED",
      failureMessage: result.failureMessage || "Charge failed",
    })
    .where(eq(invoices.id, invoice.id));

  await markPastDue(sub.id, sub.memberId, sub.failedAttempts + 1);

  return { ok: false, invoiceId: invoice.id, failureCode: result.failureCode };
}

/**
 * Pause a subscription. No charges happen until resume. Member status
 * flips to "paused". Used by the front-desk "Pause membership" button.
 */
export async function pauseSubscription(subscriptionId: number, until?: string): Promise<void> {
  const now = new Date().toISOString();
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  if (!sub) throw new Error("Subscription not found");
  await db
    .update(subscriptions)
    .set({ status: "paused", nextRetryAt: null, updatedAt: now })
    .where(eq(subscriptions.id, subscriptionId));
  await db
    .update(members)
    .set({ status: "paused", pausedUntil: until ?? null, updatedAt: now })
    .where(eq(members.id, sub.memberId));
}

export async function resumeSubscription(subscriptionId: number): Promise<void> {
  const now = new Date().toISOString();
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  if (!sub) throw new Error("Subscription not found");
  await db
    .update(subscriptions)
    .set({ status: "active", updatedAt: now })
    .where(eq(subscriptions.id, subscriptionId));
  await db
    .update(members)
    .set({ status: "active", pausedUntil: null, updatedAt: now })
    .where(eq(members.id, sub.memberId));
}

export async function cancelSubscription(subscriptionId: number, reason?: string): Promise<void> {
  const now = new Date().toISOString();
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  if (!sub) return;
  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: now, cancelReason: reason ?? null, updatedAt: now })
    .where(eq(subscriptions.id, subscriptionId));
  await db
    .update(members)
    .set({ status: "cancelled", updatedAt: now })
    .where(eq(members.id, sub.memberId));
  await recordAudit({
    session: null,
    action: "subscription.cancelled",
    entityType: "subscription",
    entityId: String(subscriptionId),
    before: { reason },
  });
}

// ── Internal ─────────────────────────────────────────────────────────

async function markPastDue(subscriptionId: number, memberId: number, attempt: number): Promise<void> {
  const now = new Date().toISOString();
  // Decide retry vs cancel.
  if (attempt >= MAX_FAILED_ATTEMPTS) {
    await cancelSubscription(subscriptionId, `Auto-cancelled after ${attempt} failed charges`);
    return;
  }
  // Pick the next retry day from the ladder. attempt=1 → +3d, =2 → +5d, =3 → +7d (then cancel).
  const offset = RETRY_SCHEDULE_DAYS[Math.min(attempt - 1, RETRY_SCHEDULE_DAYS.length - 1)];
  const nextRetryAt = daysFromNow(offset);
  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      failedAttempts: attempt,
      lastChargeAt: now,
      lastChargeStatus: "failed",
      nextRetryAt,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscriptionId));

  // Surface to member, and dunning email — caller passed memberId so we
  // skip the redundant subscription re-select that previously lived here.
  const [m] = await db
    .update(members)
    .set({ status: "past_due", updatedAt: now })
    .where(eq(members.id, memberId))
    .returning();
  if (m?.email) {
    try {
      await sendBroadcastEmail({
        recipients: [m.email],
        subject: "Your Inspire Courts payment didn't go through",
        html: `<p>Hi ${m.firstName},</p>
          <p>We tried to charge your card on file for your membership and it didn't go through.
          We'll automatically retry in a few days, but to keep your membership active you can
          update your payment method right now.</p>
          <p><a href="${process.env.NEXTAUTH_URL || ""}/portal/billing">Update payment method →</a></p>
          <p>If you've recently changed cards, this is the most likely fix.</p>
          <p>Thanks,<br/>Inspire Courts AZ</p>`,
      });
    } catch (err) {
      logger.warn("dunning email failed", { error: String(err), subId: subscriptionId });
    }
  }
}

// ── Cron entry point ─────────────────────────────────────────────────

/**
 * Daily renewal + retry tick. Run once per day from a cron secret-protected
 * route. Idempotent: each subscription is only charged once per period
 * (the idempotencyKey is keyed off subscriptionId + periodEnd).
 */
export async function runBillingTick(): Promise<{
  renewed: number;
  retried: number;
  failed: number;
  cancelled: number;
}> {
  const now = new Date().toISOString();

  // Active subs whose period has ended → renewal charge.
  // Past-due subs whose nextRetryAt has passed → retry charge.
  const due = await db
    .select()
    .from(subscriptions)
    .where(
      or(
        and(eq(subscriptions.status, "active"), lte(subscriptions.currentPeriodEnd, now)),
        and(
          eq(subscriptions.status, "past_due"),
          isNotNull(subscriptions.nextRetryAt),
          lte(subscriptions.nextRetryAt, now)
        )
      )
    );

  let renewed = 0;
  let retried = 0;
  let failed = 0;
  let cancelled = 0;

  // Bounded-parallel charge. Sequential `await` in a loop serialized
  // every Square API call (~500ms each) — a daily tick with 100 subs
  // approached Vercel's 60s cron timeout. 5 in flight stays well under
  // Square's published per-app rate limit and cuts wall-clock by ~5×.
  // Each charge owns its own subscription/invoice rows so there's no
  // shared-state contention to worry about.
  const CONCURRENCY = 5;
  for (let i = 0; i < due.length; i += CONCURRENCY) {
    const chunk = due.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (sub) => {
        const wasRetry = sub.status === "past_due";
        try {
          const r = await chargeSubscription(sub.id);
          return {
            ok: r.ok,
            wasRetry,
            willCancel: !r.ok && sub.failedAttempts + 1 >= MAX_FAILED_ATTEMPTS,
          };
        } catch (err) {
          logger.error("billing tick: charge threw", { subId: sub.id, error: String(err) });
          return { ok: false, wasRetry, willCancel: false, threw: true };
        }
      })
    );
    for (const r of results) {
      if (r.ok) {
        if (r.wasRetry) retried++;
        else renewed++;
      } else {
        failed++;
        if (r.willCancel) cancelled++;
      }
    }
  }

  return { renewed, retried, failed, cancelled };
}
