import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { smsMessages, members } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { sendSms } from "@/lib/sms";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api-helpers";
import { isRateLimited } from "@/lib/rate-limit";
import { z } from "zod";

const smsSendSchema = z.object({
  to: z.string().min(7).max(20),
  body: z.string().min(1).max(1600),
  memberId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]).optional().nullable(),
});

// GET /api/admin/sms — recent SMS conversations (last 100).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({
      id: smsMessages.id,
      memberId: smsMessages.memberId,
      phone: smsMessages.phone,
      direction: smsMessages.direction,
      body: smsMessages.body,
      status: smsMessages.status,
      createdAt: smsMessages.createdAt,
      firstName: members.firstName,
      lastName: members.lastName,
    })
    .from(smsMessages)
    .leftJoin(members, eq(smsMessages.memberId, members.id))
    .orderBy(desc(smsMessages.createdAt))
    .limit(100);
  return NextResponse.json({ rows });
}

// POST /api/admin/sms { to, body, memberId? } — admin sends ad-hoc SMS.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Per-admin send cap. Each Twilio outbound costs real money; a
  // compromised admin session or runaway client loop could rack up
  // a bill before anyone notices. 30 sends/min/admin is generous for
  // legit ad-hoc replies but bounds the worst case at ~$0.30/min.
  const adminId = session.user.id || "anon";
  if (isRateLimited(`admin-sms:${adminId}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "SMS rate limit hit (30/min). Slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  const parsed = await parseJsonBody(request, smsSendSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  try {
    const r = await sendSms({
      to: body.to,
      body: body.body,
      memberId: body.memberId != null ? Number(body.memberId) : null,
      sentBy: session.user.id ? Number(session.user.id) : null,
    });
    return NextResponse.json(r);
  } catch (err) {
    logger.error("admin sms send failed", { error: String(err) });
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
