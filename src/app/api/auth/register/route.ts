import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveRegistrationToDrive, appendSheetRow, sanitizeSheetRow, SHEETS } from "@/lib/google-sheets";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { timestampAZ } from "@/lib/utils";

// Validate incoming registration payload. Kept inline (not in lib/schemas.ts)
// because it's route-local and small.
const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email("Invalid email").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["parent", "coach", "staff", "ref", "front_desk"]),
  phone: z.string().trim().max(30).optional().nullable(),
});

/** Strip HTML special characters to prevent XSS in stored data. */
function sanitize(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 registrations per 10 minutes per IP.
  // Namespaced key so it doesn't share a counter with other bare-IP endpoints.
  const ip = getClientIp(request);
  if (isRateLimited(`register:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }
    const { name, email, password, role, phone } = parsed.data;

    // Check if email already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const sanitizedName = sanitize(String(name).slice(0, 200));
    const sanitizedEmail = email.toLowerCase().slice(0, 254);
    const sanitizedPhone = phone ? sanitize(String(phone).slice(0, 20)) : null;

    const passwordHash = await bcrypt.hash(password, 12);
    const needsApproval = ["staff", "ref", "front_desk"].includes(role);

    await db.insert(users).values({
      email: sanitizedEmail,
      name: sanitizedName,
      passwordHash,
      role,
      phone: sanitizedPhone,
      approved: !needsApproval,
    });

    // Save contact info to Google Drive and Sheets (non-blocking)
    const timestamp = timestampAZ();
    Promise.allSettled([
      saveRegistrationToDrive(sanitizedName, sanitizedEmail, role, sanitizedPhone ?? ""),
      appendSheetRow(SHEETS.prospectPipeline, "Sheet1!A:G", [
        sanitizeSheetRow([
          timestamp,
          sanitizedName,
          sanitizedEmail,
          sanitizedPhone || "",
          role,
          "Website Registration",
          "Active",
        ]),
      ]),
    ]).catch((err) => logger.warn("Failed to sync registration to Google Sheets/Drive", { error: String(err) }));

    return NextResponse.json(
      { success: true, pendingApproval: needsApproval },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration error", { error: String(error) });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
