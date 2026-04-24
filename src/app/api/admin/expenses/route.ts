import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { expenses, EXPENSE_CATEGORIES } from "@/lib/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

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
  try {
    const body = await request.json();
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const amountCents = Number(body?.amountCents);
    const incurredAt = typeof body?.incurredAt === "string" ? body.incurredAt : "";
    if (!description) return NextResponse.json({ error: "Description required" }, { status: 400 });
    if (!Number.isFinite(amountCents) || amountCents < 0) {
      return NextResponse.json({ error: "Amount required" }, { status: 400 });
    }
    if (!incurredAt) return NextResponse.json({ error: "Date required" }, { status: 400 });

    const rawCat = typeof body?.category === "string" ? body.category : "other";
    const category = (EXPENSE_CATEGORIES as readonly string[]).includes(rawCat)
      ? (rawCat as (typeof EXPENSE_CATEGORIES)[number])
      : "other";

    const [created] = await db
      .insert(expenses)
      .values({
        description,
        category,
        amountCents: Math.round(amountCents),
        vendor: typeof body?.vendor === "string" ? body.vendor.trim() || null : null,
        paymentMethod: typeof body?.paymentMethod === "string" ? body.paymentMethod.trim() || null : null,
        incurredAt,
        receiptUrl: typeof body?.receiptUrl === "string" ? body.receiptUrl.trim() || null : null,
        taxDeductible: body?.taxDeductible !== false,
        resourceId: Number.isInteger(Number(body?.resourceId)) && Number(body.resourceId) > 0 ? Number(body.resourceId) : null,
        notes: typeof body?.notes === "string" ? body.notes.trim() || null : null,
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
