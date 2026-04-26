import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { sendVerificationEmail } from "@/lib/notify";
import {
  generateVerifyToken,
  hashVerifyToken,
  verifyTokenExpiryIso,
  verifyUrlFor,
} from "@/lib/email-verification";

// Resend verification email — port of OFF SZN R780.
//
// Two entry paths:
//   (a) Signed-in user hits /verify-email → banner "Resend" — we use
//       the session to identify them.
//   (b) Unauthenticated request with { email } — useful when the user
//       landed without a session. We always return 200 to avoid
//       leaking which emails are registered; internally we only send
//       if the address maps to an unverified, still-active user.
//
// Rate limiting:
//   - 5 resends per IP per hour (anti-harvest)
//   - 3 resends per user-email per hour (anti-spam-yourself)
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(`resend-verify:ip:${ip}`, 5, 60 * 60_000)) {
    return NextResponse.json(
      { error: "Too many resend requests. Try again later." },
      { status: 429 }
    );
  }

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const session = await getServerSession(authOptions);

  // Prefer session identity when present; fall back to posted email.
  let email = "";
  if (session?.user?.email) {
    email = session.user.email.toLowerCase();
  } else if (typeof body?.email === "string") {
    email = body.email.trim().toLowerCase().slice(0, 200);
  }

  if (!email) {
    // Silent no-op — never tell the caller why.
    return NextResponse.json({ ok: true, sent: false });
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Silent no-op: non-existent, already verified, or disabled — caller
    // never learns which.
    if (!user || user.emailVerifiedAt) {
      return NextResponse.json({ ok: true, sent: false });
    }

    // Per-address limit — prevents a single account from spamming
    // itself with resend clicks even from rotating IPs.
    if (isRateLimited(`resend-verify:email:${user.email}`, 3, 60 * 60_000)) {
      return NextResponse.json(
        { error: "Too many resends for this account. Try again later." },
        { status: 429 }
      );
    }

    const token = generateVerifyToken();
    const expiresAt = verifyTokenExpiryIso();

    await db
      .update(users)
      .set({
        emailVerifyToken: hashVerifyToken(token),
        emailVerifyExpiresAt: expiresAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    // Fire the email; a delivery failure shouldn't be fatal — the row
    // was updated, and the user can try again.
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl: verifyUrlFor(token),
    });

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    logger.error("Resend verification failed", { error: String(err) });
    return NextResponse.json(
      { error: "Could not issue a new verification link." },
      { status: 500 }
    );
  }
}
