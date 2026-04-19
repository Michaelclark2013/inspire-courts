import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Roles that can access /admin routes
const ADMIN_ROLES = ["admin", "staff", "ref", "front_desk"];
// Roles that can access /portal routes
const PORTAL_ROLES = ["admin", "coach", "parent"];

// Apply the standard security header set to any middleware response.
// Keeps 401/redirect responses from missing headers the final NextResponse.next
// path already sets.
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Short-circuit CORS preflight on /api/admin and /api/portal before
  // touching the session store. Without this, every OPTIONS preflight
  // would 405 and the browser would refuse to issue the real request.
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const res = new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": request.headers.get("origin") ?? "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, If-Match, If-None-Match, Idempotency-Key, X-Cron-Secret",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      },
    });
    return applySecurityHeaders(res);
  }

  const token = await getToken({ req: request });
  const isApiRoute = pathname.startsWith("/api/");
  const unauthorizedResponse = () =>
    applySecurityHeaders(
      isApiRoute
        ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        : NextResponse.redirect(new URL("/login", request.url))
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
        return applySecurityHeaders(NextResponse.redirect(new URL("/portal", request.url)));
      }
      return unauthorizedResponse();
    }
  }

  // Public-facing player & coach portal pages — no auth required
  const PUBLIC_PORTAL_PATHS = ["/portal/player", "/portal/coach"];
  const isPublicPortalPath = PUBLIC_PORTAL_PATHS.some((p) => pathname.startsWith(p));

  if (isPublicPortalPath) {
    const response = NextResponse.next();
    response.headers.set("x-portal-public", "1");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }

  // Portal routes: require portal-level role
  if (pathname.startsWith("/portal") || pathname.startsWith("/api/portal")) {
    if (!token) return unauthorizedResponse();
    if (!PORTAL_ROLES.includes(token.role as string)) {
      if (!isApiRoute && ADMIN_ROLES.includes(token.role as string)) {
        return applySecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
      }
      return unauthorizedResponse();
    }
  }

  return applySecurityHeaders(NextResponse.next());
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
