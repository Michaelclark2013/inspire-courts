import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { expenses, EXPENSE_CATEGORIES } from "@/lib/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api-helpers";
import { z } from "zod";

const expenseCreateSchema = z.object({
  description: z.string().trim().min(1).max(500),
  amountCents: z.number().int().nonnegative(),
  incurredAt: z.string().min(1),
  category: z.string().optional(),
  vendor: z.string().trim().max(200).optional().nullable(),
  paymentMethod: z.string().trim().max(80).optional().nullable(),
  receiptUrl: z.string().trim().max(1000).optional().nullable(),
  taxDeductible: z.boolean().optional(),
  resourceId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

// GET /api/admin/expenses?from=ISO&to=ISO&category=X
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category");

    const where = [];
    if (from) where.push(gte(expenses.incurredAt, from));
    if (to) where.push(lte(expenses.incurredAt, to));
    if (category && (EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
      where.push(eq(expenses.category, category as (typeof EXPENSE_CATEGORIES)[number]));
    }

    const rows = await db
      .select()
      .from(expenses)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(expenses.incurredAt))
      .limit(500);

    // Aggregate by category
    const byCategory = await db
      .select({
        category: expenses.category,
        total: sql<number>`coalesce(sum(${expenses.amountCents}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(where.length ? and(...where) : undefined)
      .groupBy(expenses.category);

    const totalCents = byCategory.reduce((s, r) => s + Number(r.total || 0), 0);

    return NextResponse.json(
      {
        rows,
        byCategory: byCategory.map((r) => ({
          category: r.category,
          totalCents: Number(r.total) || 0,
          count: Number(r.count) || 0,
        })),
        totalCents,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("expenses list failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/expenses
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = await parseJsonBody(request, expenseCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  try {
    const category = body.category && (EXPENSE_CATEGORIES as readonly string[]).includes(body.category)
      ? (body.category as (typeof EXPENSE_CATEGORIES)[number])
      : "other";

    const [created] = await db
      .insert(expenses)
      .values({
        description: body.description,
        category,
        amountCents: Math.round(body.amountCents),
        vendor: body.vendor?.trim() || null,
        paymentMethod: body.paymentMethod?.trim() || null,
        incurredAt: body.incurredAt,
        receiptUrl: body.receiptUrl?.trim() || null,
        taxDeductible: body.taxDeductible !== false,
        resourceId: body.resourceId != null ? Number(body.resourceId) : null,
        notes: body.notes?.trim() || null,
        createdBy: Number(session.user.id),
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("expense create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/admin/expenses?id=N
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await db.delete(expenses).where(eq(expenses.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("expense delete failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
