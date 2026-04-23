import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

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
