// Shared helpers for the email-verification flow.
// Ported from OFF SZN (R780) and adapted for Inspire Courts' Drizzle +
// Gmail stack.
//
// Generates cryptographically-random tokens, builds the verify URL,
// and encapsulates the "has this user verified?" predicate so the
// gate surface (API routes + UI banner) has one place to update.

import crypto from "crypto";
import { SITE_URL } from "./constants";

// 32 bytes = 256 bits of entropy; hex-encodes to 64 chars. Collision
// probability is negligible but we still put a unique index on
// users.email_verify_token so a bad RNG surfaces as an INSERT
// constraint failure rather than a silent dupe.
const TOKEN_BYTES = 32;

// 24 hours — standard window. Short enough that a leaked link from a
// forwarded inbox becomes stale quickly; long enough that a user who
// doesn't check email for a day can still complete signup.
export const EMAIL_VERIFY_TTL_HOURS = 24;

export function generateVerifyToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

export function verifyUrlFor(token: string): string {
  return `${SITE_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

export function verifyTokenExpiryIso(): string {
  return new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60_000).toISOString();
}

/**
 * True when the user has a completed verification. Null = not
 * verified yet (treat as "unverified" and gate risky actions).
 *
 * Accepts both string (what Drizzle returns for a text column) and
 * Date (what some callers may construct). Anything truthy counts.
 */
export function isVerified(
  u: { emailVerifiedAt: string | Date | null | undefined } | null | undefined
): boolean {
  return !!u && u.emailVerifiedAt != null;
}
