import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  tournamentRegistrations,
  tournamentTeams,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/square";

// POST /api/webhooks/square — Square payment webhook
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature") || "";
  const url = request.url;

  // Verify signature (skip if no key configured — dev/sandbox)
  const sigKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (sigKey) {
    const valid = await verifyWebhookSignature(body, signature, url);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: {
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

  // Handle payment.completed
  if (event.type === "payment.completed" || event.type === "payment.updated") {
    const payment = event.data?.object?.payment;
    if (!payment) {
      return NextResponse.json({ ok: true });
    }

    // Find registration by order ID
    const orderId = payment.order_id;
    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    const [reg] = await db
      .select()
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.squareOrderId, orderId));

    if (!reg) {
      // Could be a non-tournament payment — ignore
      return NextResponse.json({ ok: true });
    }

    if (reg.paymentStatus === "paid") {
      // Already processed
      return NextResponse.json({ ok: true });
    }

    // Mark as paid
    await db
      .update(tournamentRegistrations)
      .set({
        paymentStatus: "paid",
        squarePaymentId: payment.id,
        status: "approved",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tournamentRegistrations.id, reg.id));

    // Auto-add team to tournament
    const existingTeams = await db
      .select()
      .from(tournamentTeams)
      .where(eq(tournamentTeams.tournamentId, reg.tournamentId));

    await db.insert(tournamentTeams).values({
      tournamentId: reg.tournamentId,
      teamName: reg.teamName,
      division: reg.division || null,
      seed: existingTeams.length + 1,
    });
  }

  return NextResponse.json({ ok: true });
}
