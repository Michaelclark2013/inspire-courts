import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { generateApiKey } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select({
      id: apiKeys.id,
      label: apiKeys.label,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .orderBy(desc(apiKeys.createdAt));
  return NextResponse.json({ rows });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body?.label) return NextResponse.json({ error: "label required" }, { status: 400 });
    const { plaintext, hash, prefix } = generateApiKey();
    const [row] = await db
      .insert(apiKeys)
      .values({
        label: String(body.label).slice(0, 80),
        keyHash: hash,
        prefix,
        scopes: body.scopes || "read",
        createdBy: session.user.id ? Number(session.user.id) : null,
        expiresAt: body.expiresAt || null,
      })
      .returning({ id: apiKeys.id });
    await recordAudit({
      session,
      request,
      action: "api_key.created",
      entityType: "api_key",
      entityId: String(row.id),
      after: { label: body.label, prefix },
    });
    return NextResponse.json({ id: row.id, key: plaintext, prefix }, { status: 201 });
  } catch (err) {
    logger.error("api key create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.update(apiKeys).set({ revokedAt: new Date().toISOString() }).where(eq(apiKeys.id, id));
  await recordAudit({
    session,
    request,
    action: "api_key.revoked",
    entityType: "api_key",
    entityId: String(id),
  });
  return NextResponse.json({ ok: true });
}
