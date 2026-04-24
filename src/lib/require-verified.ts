// `requireVerifiedEmail` API route guard — ported from OFF SZN (R780).
//
// Usage pattern:
//
//   export async function POST(req: NextRequest) {
//     const guard = await requireVerifiedEmail();
//     if (guard.error) return guard.error;
//     // guard.user — authenticated & verified
//     ...
//   }
//
// Three outcomes:
//   401 — no session
//   403 — session exists but emailVerifiedAt is null
//   OK  — { user } to use downstream
//
// We re-check the DB on every call instead of trusting the session
// flag alone. Session JWTs are 8h-lived; a user who just verified
// should be allowed through even if their stale JWT still says
// unverified. The cost is one small indexed SELECT per guarded POST.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { isVerified } from "./email-verification";

export async function requireVerifiedEmail(): Promise<{
  error: NextResponse | null;
  user: {
    id: number;
    email: string;
    emailVerifiedAt: string | null;
  } | null;
}> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user;

  if (!sessionUser?.id || !sessionUser?.email) {
    return {
      error: NextResponse.json(
        { error: "Sign in required" },
        { status: 401 }
      ),
      user: null,
    };
  }

  const userId = Number(sessionUser.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return {
      error: NextResponse.json({ error: "Invalid session" }, { status: 401 }),
      user: null,
    };
  }

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    return {
      error: NextResponse.json({ error: "Sign in required" }, { status: 401 }),
      user: null,
    };
  }

  if (!isVerified(row)) {
    return {
      error: NextResponse.json(
        {
          error:
            "Verify your email before using this feature. Check your inbox or request a new link from the banner at the top of the site.",
          code: "email_not_verified",
        },
        { status: 403 }
      ),
      user: null,
    };
  }

  return {
    error: null,
    user: {
      id: row.id,
      email: row.email,
      emailVerifiedAt: row.emailVerifiedAt ?? null,
    },
  };
}
