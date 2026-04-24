// Profile-completeness helpers.
//
// A user's profile is "complete" when we have enough fact-checking info
// to let them take consequential actions — tournament registration,
// waiver signing, member visit logging. Admins bypass this gate; their
// rows are backfilled complete=true by the migration.

export interface ProfileLike {
  birthDate?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  role?: string;
}

/**
 * Returns true when the user has enough profile fields to pass our
 * fact-check gates. Admins always pass (they don't register players
 * or sign waivers; they manage the site).
 */
export function isProfileComplete(u: ProfileLike | null | undefined): boolean {
  if (!u) return false;
  if (u.role === "admin") return true;
  return (
    typeof u.birthDate === "string" &&
    u.birthDate.length > 0 &&
    typeof u.emergencyContactName === "string" &&
    u.emergencyContactName.length > 0 &&
    typeof u.emergencyContactPhone === "string" &&
    u.emergencyContactPhone.length > 0
  );
}

/**
 * Computes an age from a YYYY-MM-DD birth-date string and a reference
 * date (defaults to today). Returns null if birthDate is missing or
 * unparseable. Uses calendar-year math so Feb-29 edge cases don't
 * shift by a day — birthday hasn't occurred yet this year → age is
 * one less than year diff.
 *
 * Used for tournament age-group eligibility checks (e.g. "12U" =
 * athlete is 12 or under on the tournament start date).
 */
export function ageFromBirthDate(
  birthDate: string | null | undefined,
  at: Date = new Date()
): number | null {
  if (!birthDate) return null;
  const parts = birthDate.slice(0, 10).split("-").map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  let age = at.getUTCFullYear() - y;
  const monthDelta = at.getUTCMonth() + 1 - m;
  if (monthDelta < 0 || (monthDelta === 0 && at.getUTCDate() < d)) age--;
  return age >= 0 && age < 130 ? age : null;
}

/**
 * Age-group compliance: does a user's age fit a division tag like
 * "8U", "10U", "Open", "HS"? Returns null when we can't decide
 * (missing birth date, unrecognized division format) — callers should
 * treat null as "don't block; prompt admin".
 */
export function fitsAgeDivision(
  birthDate: string | null | undefined,
  division: string | null | undefined,
  at: Date = new Date()
): boolean | null {
  if (!division) return null;
  const trimmed = division.trim().toUpperCase();
  // Open / Adult / HS etc. — no age limit enforced here.
  if (trimmed === "OPEN" || trimmed === "ADULT") return true;
  // NU pattern (8U, 10U, …, 18U).
  const m = trimmed.match(/^(\d{1,2})U$/);
  if (!m) return null;
  const cap = Number(m[1]);
  const age = ageFromBirthDate(birthDate, at);
  if (age == null) return null;
  return age <= cap;
}
