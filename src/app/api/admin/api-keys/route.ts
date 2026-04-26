import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { generateApiKey } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api-helpers";
import { canAccess } from "@/lib/permissions";
import { z } from "zod";

const apiKeyCreateSchema = z.object({
  label: z.string().trim().min(1).max(80),
  scopes: z.string().max(200).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "integrations")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  if (!session?.user?.role || !canAccess(session.user.role, "integrations")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = await parseJsonBody(request, apiKeyCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  try {
    const { plaintext, hash, prefix } = generateApiKey();
    const [row] = await db
      .insert(apiKeys)
      .values({
        label: body.label,
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
  if (!session?.user?.role || !canAccess(session.user.role, "integrations")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id required" }, { status: 400 });
  // Look up first so we can 404 vs blind-update no-op (which used to
  // silently succeed even on a typo'd id) and we don't pollute the
  // audit log with phantom revocations.
  const [existing] = await db.select({ id: apiKeys.id, revokedAt: apiKeys.revokedAt }).from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "API key not found" }, { status: 404 });
  if (existing.revokedAt) {
    // Already revoked — return 200 so the UI can refresh, but skip
    // a duplicate audit entry.
    return NextResponse.json({ ok: true, alreadyRevoked: true });
  }
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
