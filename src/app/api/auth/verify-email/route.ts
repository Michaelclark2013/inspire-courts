import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Email-verification endpoint — port of OFF SZN R780 (Prisma → Drizzle).
//
// Flow:
//   1. User lands on /verify-email?token=... after clicking the link
//   2. Client POSTs { token } to here
//   3. We look up the user by emailVerifyToken, check expiry, stamp
//      emailVerifiedAt = now(), clear the token, and return success
//
// Security:
//   - Rate-limit per IP to stop token enumeration (256-bit hex is not
//     guessable, but a limit is cheap insurance).
//   - Always hit the DB once even when token is missing — keeps the
//     response time from leaking whether the lookup was short-circuited.
//   - Token cleared on success so links become one-use.
//   - Expired tokens return 410 + code:"expired" so the UI can offer
//     a resend affordance.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(`verify-email:${ip}`, 20, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Too many verification attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const rawToken =
    typeof body?.token === "string" ? body.token.trim().slice(0, 128) : "";
  if (!rawToken) {
    return NextResponse.json(
      { error: "Missing verification token." },
      { status: 400 }
    );
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        emailVerifyExpiresAt: users.emailVerifyExpiresAt,
      })
      .from(users)
      .where(eq(users.emailVerifyToken, rawToken))
      .limit(1);

    // Generic message to avoid leaking whether the token existed.
    if (!user) {
      return NextResponse.json(
        { error: "This verification link isn't valid." },
        { status: 400 }
      );
    }

    // Idempotent success path — second click of the same link or two
    // tabs racing on the same token both end up here.
    if (user.emailVerifiedAt) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    if (
      user.emailVerifyExpiresAt &&
      new Date(user.emailVerifyExpiresAt).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "This verification link has expired.", code: "expired" },
        { status: 410 }
      );
    }

    await db
      .update(users)
      .set({
        emailVerifiedAt: new Date().toISOString(),
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Email verify failed", { error: String(err) });
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
