// Shared client-side fetch wrapper for admin pages.
//
// Every admin page hits a /api/admin/* endpoint that returns 401 if
// the session is gone (expired cookie, signed out in another tab,
// JWT rotation race). Without consistent handling, each page either
// silently fails ("Loading…" forever) or surfaces a raw error string.
// Both are confusing.
//
// adminFetch() detects 401 and redirects to /admin/login?from=<current>
// so the user gets bounced cleanly to the sign-in screen and post-auth
// returns to wherever they were trying to go.

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

/**
 * Fetch wrapper that:
 *   - includes credentials (defensive — defaults to same-origin but
 *     explicit beats implicit when cross-app behavior changes)
 *   - on 401, navigates the browser to /admin/login?from=<current>
 *     and throws SessionExpiredError so callers can stop loading-state
 *     spinners gracefully
 *   - on any other status, returns the Response untouched so callers
 *     keep their normal `if (!res.ok)` branches
 *
 * Usage:
 *     const res = await adminFetch("/api/admin/owner/snapshot");
 *     if (!res.ok) { setError(...); return; }
 *     const data = await res.json();
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, {
    cache: "no-store",
    credentials: "same-origin",
    ...init,
  });
  if (res.status === 401 && typeof window !== "undefined") {
    const here = window.location.pathname + window.location.search;
    // Avoid a redirect loop if the login page itself somehow 401s.
    if (!here.startsWith("/admin/login")) {
      window.location.href = `/admin/login?from=${encodeURIComponent(here)}`;
    }
    throw new SessionExpiredError();
  }
  return res;
}
