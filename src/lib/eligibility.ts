// Player eligibility — given a division string and a player's birth
// date, decide if they can play.
//
// Rules:
//   - Age divisions are written like "12U", "10U", "18U" — meaning
//     the player must be UNDER that age as of the cutoff date.
//   - Cutoff date: August 31 of the tournament's start-year. This
//     matches USAB / school-year conventions. Override per-tournament
//     by passing `cutoffDate`.
//   - Grade divisions like "8th" or "Varsity" are informational only
//     today — we surface the player's `grade` next to the chip but
//     don't block. (Most leagues use age, not grade, for eligibility.)
//   - Co-ed / open divisions ("OPEN", "ADULT") never block.
//
// Returns `eligible: true` when we can't decide (missing DOB,
// non-age-division) so we don't false-positive a block. Coaches see a
// "DOB needed" hint instead.

export type EligibilityResult = {
  eligible: boolean;
  reason?: string;
  cutoffAge?: number;
  cutoffDate?: string; // ISO YYYY-MM-DD
  ageOnCutoff?: number;
};

/**
 * Parse "12U" / "8U" / "18U" into a max-age number, or null if the
 * division isn't an age-cap division.
 */
export function parseAgeDivision(division: string | null | undefined): number | null {
  if (!division) return null;
  const m = String(division).trim().toUpperCase().match(/^(\d{1,2})\s*U$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 && n <= 30 ? n : null;
}

/**
 * Default cutoff = Aug 31 of the year of `seasonStart` (or current year
 * if not provided). USAB convention.
 */
export function defaultCutoffDate(seasonStart?: string | Date | null): string {
  const d = seasonStart ? new Date(seasonStart) : new Date();
  const year = Number.isFinite(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
  return `${year}-08-31`;
}

/** Age (whole years) on a given ISO cutoff date. */
export function ageOn(birthDate: string, cutoffDate: string): number | null {
  const b = new Date(birthDate);
  const c = new Date(cutoffDate);
  if (!Number.isFinite(b.getTime()) || !Number.isFinite(c.getTime())) return null;
  let age = c.getFullYear() - b.getFullYear();
  const beforeBirthday =
    c.getMonth() < b.getMonth() ||
    (c.getMonth() === b.getMonth() && c.getDate() < b.getDate());
  if (beforeBirthday) age--;
  return age;
}

/**
 * Decide if a player is eligible for a division.
 *
 * - No DOB: returns eligible=true with reason "DOB missing" so the UI
 *   can show a soft amber chip ("Add DOB").
 * - Non-age division: eligible=true, reason "open division".
 * - Age division: blocks if age-on-cutoff >= the cap.
 */
export function checkEligibility(opts: {
  birthDate?: string | null;
  division?: string | null;
  seasonStart?: string | Date | null;
  cutoffDate?: string | null;
}): EligibilityResult {
  const cap = parseAgeDivision(opts.division);
  if (cap == null) {
    return { eligible: true, reason: "Open division — no age cap" };
  }
  if (!opts.birthDate) {
    return {
      eligible: true,
      reason: "DOB needed to verify",
      cutoffAge: cap,
    };
  }
  const cutoffDate = opts.cutoffDate || defaultCutoffDate(opts.seasonStart);
  const age = ageOn(opts.birthDate, cutoffDate);
  if (age == null) {
    return {
      eligible: true,
      reason: "Invalid birth date",
      cutoffAge: cap,
      cutoffDate,
    };
  }
  if (age >= cap) {
    return {
      eligible: false,
      reason: `Age ${age} on ${cutoffDate} — division allows under ${cap}`,
      cutoffAge: cap,
      cutoffDate,
      ageOnCutoff: age,
    };
  }
  return {
    eligible: true,
    reason: `Age ${age} on ${cutoffDate} — eligible (under ${cap})`,
    cutoffAge: cap,
    cutoffDate,
    ageOnCutoff: age,
  };
}
