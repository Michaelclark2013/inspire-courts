import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pageFromAdminPath } from "@/lib/permission-paths";
import { canAccessWithOverrides, type AdminPage } from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";

// Roles that can access /admin routes
const ADMIN_ROLES = ["admin", "staff", "ref", "front_desk"];
// Roles that can access /portal routes
const PORTAL_ROLES = ["admin", "coach", "parent", "staff", "ref", "front_desk"];

// CSP for middleware-originated responses (errors, redirects, and the
// final NextResponse.next passthrough).
//
// Scoped intentionally so legit third-party embeds work:
//   - frame-src: YouTube video embeds (hero reel, player highlights),
//     QuickScores schedule iframe, Stripe + Google Maps (future).
//   - script-src: 'unsafe-inline' for Next's inline bootstrap (we don't
//     configure nonces), plus the GA/GTM/Meta Pixel hosts if those env
//     vars are set (loaded via next/script).
//   - connect-src: outbound XHR/fetch targets — own APIs + Vercel
//     Analytics + GA measurement endpoints + YouTube oembed.
//   - style-src 'unsafe-inline' stays because Tailwind emits style
//     attributes and inline styles on SSR hydration.
//   - img-src + media-src: permissive on https: so Drive-hosted media,
//     YouTube thumbnails, and user-uploaded signatures all load.
//   - frame-ancestors 'none' keeps other sites from iframing ours.
const CSP_HEADER = [
  "default-src 'self'",
  "img-src 'self' data: https: blob:",
  "media-src 'self' https: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.youtube.com https://s.ytimg.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://*.facebook.com https://api.stripe.com https://vitals.vercel-insights.com https://vercel.live",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://quickscores.com https://www.google.com https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// Apply the standard security header set to any middleware response.
// Keeps 401/redirect responses from missing headers the final
// NextResponse.next path already sets. Also stamps a per-request
// X-Request-Id so client errors, server logs, and audit rows can be
// correlated by a single token.
function applySecurityHeaders(response: NextResponse, requestId?: string): NextResponse {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set("Content-Security-Policy", CSP_HEADER);
  if (requestId) response.headers.set("X-Request-Id", requestId);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Use an existing upstream X-Request-Id if present (e.g. from a
  // load balancer), otherwise generate a fresh UUID. This token is
  // echoed in the response so clients can quote it when reporting
  // errors, and server logs + audit rows can be grep'd for it.
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  // Short-circuit CORS preflight on /api/admin and /api/portal before
  // touching the session store. Without this, every OPTIONS preflight
  // would 405 and the browser would refuse to issue the real request.
  //
  // Echo the request Origin only when it matches our own host (or the
  // configured NEXTAUTH_URL). Wildcarding to "*" was harmless today
  // because we don't set Allow-Credentials on this response, but a
  // future change that did would have shipped a session-hijack vector.
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") ?? "";
    const allowed = (() => {
      if (!origin) return null;
      try {
        const reqHost = new URL(request.url).host;
        const originHost = new URL(origin).host;
        if (originHost === reqHost) return origin;
        const configured = process.env.NEXTAUTH_URL;
        if (configured && new URL(configured).host === originHost) return origin;
      } catch {
        // fall through
      }
      return null;
    })();
    const res = new NextResponse(null, {
      status: 204,
      headers: {
        ...(allowed ? { "Access-Control-Allow-Origin": allowed } : {}),
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, If-Match, If-None-Match, Idempotency-Key, X-Cron-Secret, X-Request-Id",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      },
    });
    return applySecurityHeaders(res, requestId);
  }

  const token = await getToken({ req: request });
  const isApiRoute = pathname.startsWith("/api/");
  const unauthorizedResponse = () =>
    applySecurityHeaders(
      isApiRoute
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : NextResponse.redirect(new URL("/login", request.url)),
      requestId
    );

  // Offline pages — always public
  if (pathname === "/offline" || pathname === "/admin/offline") {
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }

  // Admin routes: require admin-level role
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!token) return unauthorizedResponse();
    if (!ADMIN_ROLES.includes(token.role as string)) {
      if (!isApiRoute && PORTAL_ROLES.includes(token.role as string)) {
        return applySecurityHeaders(NextResponse.redirect(new URL("/portal", request.url)), requestId);
      }
      return unauthorizedResponse();
    }

    // Page-level enforcement using per-user permission overrides.
    //
    // Admin role normally passes (catches any new pages the override
    // map doesn't list yet). BUT if the admin has activated
    // "view as user" mode (icaz-view-as cookie), we swap in the target
    // user's role + overrides so the preview faithfully reproduces
    // what that user would see, including denied-page redirects.
    if (!isApiRoute) {
      let effectiveRole = token.role as UserRole;
      let effectiveOverrides =
        (token as { permissionOverrides?: Array<{ page: string; granted: boolean; expiresAt?: string | null }> })
          .permissionOverrides;

      const viewAsCookie = request.cookies.get("icaz-view-as")?.value;
      if (viewAsCookie && token.role === "admin") {
        try {
          const parsed = JSON.parse(viewAsCookie);
          if (parsed?.role) effectiveRole = parsed.role as UserRole;
          if (Array.isArray(parsed?.overrides)) effectiveOverrides = parsed.overrides;
        } catch {
          /* ignore malformed cookie */
        }
      }

      // Only gate non-admin effective roles. Main admin still has full
      // access unless view-as swaps them into a lower tier.
      if (effectiveRole !== "admin") {
        const page = pageFromAdminPath(pathname);
        if (page) {
          const allowed = canAccessWithOverrides(
            effectiveRole,
            page as AdminPage,
            effectiveOverrides as Array<{ page: AdminPage; granted: boolean; expiresAt?: string | null }> | undefined
          );
          if (!allowed) {
            return applySecurityHeaders(
              NextResponse.redirect(new URL("/admin?denied=" + encodeURIComponent(page), request.url)),
              requestId
            );
          }
        }
      }
    }
  }

  // Portal routes: require portal-level role (all portal pages now
  // require authentication — coaches/players/staff/refs must log in).
  if (pathname.startsWith("/portal") || pathname.startsWith("/api/portal")) {
    if (!token) return unauthorizedResponse();
    if (!PORTAL_ROLES.includes(token.role as string)) {
      if (!isApiRoute && ADMIN_ROLES.includes(token.role as string)) {
        return applySecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)), requestId);
      }
      return unauthorizedResponse();
    }
  }

  return applySecurityHeaders(NextResponse.next(), requestId);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/api/admin/:path*",
    "/api/portal/:path*",
    // Apply security headers to all pages
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
