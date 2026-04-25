import { db } from "@/lib/db";
import {
  journeys,
  journeySteps,
  journeyEnrollments,
  members,
  memberRiskScores,
} from "@/lib/db/schema";
import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { sendSms, interpolate } from "@/lib/sms";
import { sendBroadcastEmail } from "@/lib/notify";

// Enroll a member in a journey. If they're already enrolled and not
// completed, this is a no-op (prevents duplicate cascades).
export async function enrollMember(opts: {
  journeyId: number;
  memberId: number;
}): Promise<{ enrollmentId: number; alreadyEnrolled: boolean }> {
  const [existing] = await db
    .select()
    .from(journeyEnrollments)
    .where(
      and(
        eq(journeyEnrollments.journeyId, opts.journeyId),
        eq(journeyEnrollments.memberId, opts.memberId),
        eq(journeyEnrollments.status, "active")
      )
    )
    .limit(1);
  if (existing) return { enrollmentId: existing.id, alreadyEnrolled: true };

  const [firstStep] = await db
    .select()
    .from(journeySteps)
    .where(eq(journeySteps.journeyId, opts.journeyId))
    .orderBy(asc(journeySteps.ordering))
    .limit(1);
  if (!firstStep) throw new Error("Journey has no steps");

  const fireAt = new Date(Date.now() + firstStep.delayHours * 3_600_000).toISOString();
  const [row] = await db
    .insert(journeyEnrollments)
    .values({
      journeyId: opts.journeyId,
      memberId: opts.memberId,
      status: "active",
      nextStepOrdering: firstStep.ordering,
      nextFireAt: fireAt,
    })
    .returning({ id: journeyEnrollments.id });
  return { enrollmentId: row.id, alreadyEnrolled: false };
}

// Process all enrollments whose next step is due. Idempotent — fires
// each step exactly once per (enrollment, ordering) because we
// advance the cursor before sending.
export async function runJourneyTick(): Promise<{
  fired: number;
  skipped: number;
  completed: number;
  failed: number;
}> {
  const now = new Date().toISOString();

  const due = await db
    .select()
    .from(journeyEnrollments)
    .where(
      and(
        eq(journeyEnrollments.status, "active"),
        isNotNull(journeyEnrollments.nextFireAt),
        lte(journeyEnrollments.nextFireAt, now)
      )
    );

  let fired = 0;
  let skipped = 0;
  let completed = 0;
  let failed = 0;

  for (const e of due) {
    try {
      const [step] = await db
        .select()
        .from(journeySteps)
        .where(
          and(eq(journeySteps.journeyId, e.journeyId), eq(journeySteps.ordering, e.nextStepOrdering))
        )
        .limit(1);

      if (!step) {
        // No more steps — mark complete.
        await db
          .update(journeyEnrollments)
          .set({ status: "completed", completedAt: now })
          .where(eq(journeyEnrollments.id, e.id));
        completed++;
        continue;
      }

      // Halted by reply? Skip silently.
      if (e.haltedByReplyAt) {
        await db
          .update(journeyEnrollments)
          .set({ status: "completed", completedAt: now })
          .where(eq(journeyEnrollments.id, e.id));
        skipped++;
        continue;
      }

      // Fetch member context for interpolation.
      const [m] = await db.select().from(members).where(eq(members.id, e.memberId)).limit(1);
      if (!m) {
        await db
          .update(journeyEnrollments)
          .set({ status: "cancelled", completedAt: now })
          .where(eq(journeyEnrollments.id, e.id));
        skipped++;
        continue;
      }

      const [risk] = await db
        .select({ daysSinceLastVisit: memberRiskScores.daysSinceLastVisit })
        .from(memberRiskScores)
        .where(eq(memberRiskScores.memberId, m.id))
        .limit(1);

      const ctx: Record<string, string | number | null> = {
        firstName: m.firstName,
        lastName: m.lastName,
        daysSinceLastVisit: risk?.daysSinceLastVisit ?? null,
      };
      const body = interpolate(step.body, ctx);

      // Send via channel.
      if (step.channel === "sms" && m.phone) {
        const r = await sendSms({
          to: m.phone,
          body,
          memberId: m.id,
          journeyId: e.journeyId,
          journeyStepId: step.id,
          threadKey: `journey-${e.id}`,
        });
        if (r.ok) fired++; else failed++;
      } else if (step.channel === "email" && m.email) {
        const r = await sendBroadcastEmail({
          recipients: [m.email],
          subject: step.subject || "Inspire Courts AZ",
          html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
        });
        if (r.sent > 0) fired++; else failed++;
      } else {
        skipped++;
      }

      // Advance cursor — pull all steps in order, find the one after current.
      const allSteps = await db
        .select()
        .from(journeySteps)
        .where(eq(journeySteps.journeyId, e.journeyId))
        .orderBy(asc(journeySteps.ordering));
      const idx = allSteps.findIndex((s) => s.ordering === e.nextStepOrdering);
      const next = idx >= 0 ? allSteps[idx + 1] : null;

      if (next) {
        await db
          .update(journeyEnrollments)
          .set({
            nextStepOrdering: next.ordering,
            nextFireAt: new Date(Date.now() + next.delayHours * 3_600_000).toISOString(),
          })
          .where(eq(journeyEnrollments.id, e.id));
      } else {
        await db
          .update(journeyEnrollments)
          .set({ status: "completed", completedAt: new Date().toISOString(), nextFireAt: null })
          .where(eq(journeyEnrollments.id, e.id));
        completed++;
      }
    } catch (err) {
      logger.error("journey tick: step failed", { enrollmentId: e.id, error: String(err) });
      failed++;
    }
  }

  return { fired, skipped, completed, failed };
}
