import { NextResponse } from "next/server";

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
