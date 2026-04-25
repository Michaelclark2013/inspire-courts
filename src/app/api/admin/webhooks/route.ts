import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookSubscriptions } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(webhookSubscriptions).orderBy(desc(webhookSubscriptions.createdAt));
  return NextResponse.json({ rows });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body?.url) return NextResponse.json({ error: "url required" }, { status: 400 });
  const secret = `whsec_${randomBytes(24).toString("hex")}`;
  const [row] = await db
    .insert(webhookSubscriptions)
    .values({
      url: String(body.url).slice(0, 500),
      events: body.events || "*",
      secret,
      createdBy: session.user.id ? Number(session.user.id) : null,
    })
    .returning({ id: webhookSubscriptions.id });
  await recordAudit({
    session,
    request,
    action: "webhook.created",
    entityType: "webhook_subscription",
    entityId: String(row.id),
    after: { url: body.url, events: body.events || "*" },
  });
  return NextResponse.json({ id: row.id, secret }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(webhookSubscriptions).where(eq(webhookSubscriptions.id, id));
  await recordAudit({
    session,
    request,
    action: "webhook.deleted",
    entityType: "webhook_subscription",
    entityId: String(id),
  });
  return NextResponse.json({ ok: true });
}
