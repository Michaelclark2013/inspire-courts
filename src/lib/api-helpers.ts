import { NextResponse } from "next/server";
import crypto from "crypto";
import type { ZodSchema } from "zod";

// Constant-time string compare. Plain `!==` leaks information about the
// secret — an attacker who can measure response time across many
// requests can recover the secret byte-by-byte. Buffers of different
// length short-circuit because timingSafeEqual would throw, but
// returning false on mismatched length doesn't help an attacker since
// the secret length is fixed by config.
function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Standard error response helper.
 *
 * Every admin route should return the same shape for single-message errors
 * so clients can reliably `body.error` without branching:
 *     { error: string }
 *
 * Use this helper instead of raw `NextResponse.json({ error: ... }, ...)` so
 * the shape stays consistent even as new routes are added. Optional extras
 * (e.g. currentUpdatedAt on 412, Retry-After on 429) can be merged via the
 * `extras` param without breaking the core contract.
 *
 * For multi-field validation errors, use `apiValidationError()` below which
 * returns { error, errors: { field: message } }.
 */
export function apiError(
  message: string,
  status: number,
  init?: {
    headers?: Record<string, string>;
    extras?: Record<string, unknown>;
  }
) {
  return NextResponse.json(
    { error: message, ...(init?.extras ?? {}) },
    { status, ...(init?.headers ? { headers: init.headers } : {}) }
  );
}

/**
 * Validation error shape — 422 Unprocessable Entity with per-field messages.
 *
 *     { error: "Validation failed", errors: { email: "Required", ... } }
 *
 * The top-level `error` is preserved so generic clients still work; the
 * `errors` map is the per-field detail layer.
 */
export function apiValidationError(
  fieldErrors: Record<string, string>,
  summary = "Validation failed"
) {
  return NextResponse.json(
    { error: summary, errors: fieldErrors },
    { status: 422 }
  );
}

/**
 * Standard 404 helper. Every admin route was hand-rolling its own
 * not-found message ("Not found", "Registration not found", "Game not
 * found", etc.) which made client-side detection string-brittle. The
 * canonical shape is:
 *
 *     { error: "Not found", detail?: "Registration not found" }
 *
 * Clients can match on `error === "Not found"` for generic handling
 * while the optional `detail` preserves the specific entity name for
 * human-readable UI.
 */
export function apiNotFound(detail?: string) {
  return NextResponse.json(
    { error: "Not found", ...(detail ? { detail } : {}) },
    { status: 404 }
  );
}

// ── Cron auth helper ─────────────────────────────────────────────────
// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; manual ops
// triggers may also use `X-Cron-Secret: <CRON_SECRET>` (no Bearer prefix).
// Returns null when authorized, or a NextResponse to short-circuit when not.
// Centralizes the env-check + header-check so every cron route stays
// uniform — adding a new cron is now: write the work + `const fail =
// requireCronSecret(req); if (fail) return fail;` and that's it.
export function requireCronSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }
  const authHeader = request.headers.get("authorization") || "";
  const cronHeader = request.headers.get("x-cron-secret") || "";
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : cronHeader;
  if (!constantTimeEquals(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Parse a request body as JSON + validate against a Zod schema.
 *
 * Returns a discriminated union:
 *   - { ok: true, data }   — validation passed; `data` is the narrowed
 *                            Zod-inferred type.
 *   - { ok: false, response } — a NextResponse the handler should return
 *                            directly (either 400 for malformed JSON or
 *                            422 with per-field errors).
 *
 * Usage:
 *     const parsed = await parseJsonBody(request, announcementSchema);
 *     if (!parsed.ok) return parsed.response;
 *     const { title } = parsed.data;
 *
 * Collapses the 10-line JSON.parse + safeParse + fieldErrors boilerplate
 * every admin POST handler was duplicating.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: apiError("Invalid JSON body", 400) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_root";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, response: apiValidationError(fieldErrors) };
  }
  return { ok: true, data: result.data };
}

/**
 * Escape a value for RFC-4180 CSV output (always quoted) with a
 * formula-injection guard. Excel/Sheets/Numbers evaluate any cell that
 * starts with =, +, -, @, or a tab/CR as a formula when the CSV is
 * opened — so an attacker who can insert their string into an exported
 * column (team name, lead email, registration note) could phish an
 * admin with `=HYPERLINK("https://evil.com","Click to verify")` or
 * similar when the admin downloads + double-clicks the file.
 * OWASP-recommended mitigation: prefix with a single quote, which
 * spreadsheets render literally and strip on display.
 */
export function csvCell(v: unknown): string {
  const raw = v == null ? "" : String(v);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * UTF-8 BOM. Prepend to CSV bodies so Excel auto-detects the encoding
 * when admins double-click the download — without it, accented chars
 * and emoji in user-supplied content render as mojibake.
 */
export const UTF8_BOM = "﻿";

/**
 * Join already-comma-joined row strings with RFC 4180 CRLF terminators
 * and prepend the UTF-8 BOM. Use this for every CSV NextResponse body
 * so all admin downloads stay Excel-compatible.
 */
export function csvBody(rows: string[]): string {
  return UTF8_BOM + rows.join("\r\n");
}

/**
 * Returns the ISO timestamp of midnight on the first of the current
 * Arizona month. Business lives in Phoenix (America/Phoenix, UTC−07:00,
 * no DST). Using this everywhere we partition data by "this month"
 * avoids the 7-hour rollover skew of UTC-anchored month boundaries.
 *
 * Example: on 2026-06-30 at 6 PM Arizona time, returns
 * "2026-06-01T00:00:00-07:00" (the UTC month-start approach would have
 * already rolled over to July because 6 PM AZ = 01:00 UTC the next day).
 */
export function azMonthStartIso(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(at);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return new Date(`${year}-${month}-01T00:00:00-07:00`).toISOString();
}

/**
 * Safely JSON.parse a string that might be null, empty, or malformed —
 * used primarily for DB columns storing JSON-serialized arrays/objects
 * (e.g. tournament.divisions, tournament.courts). If the value doesn't
 * parse, returns the fallback instead of throwing. A single malformed
 * row should not 500 an entire list view.
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
