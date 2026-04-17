import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Roles that can access /admin routes
const ADMIN_ROLES = ["admin", "staff", "ref", "front_desk"];
// Roles that can access /portal routes
const PORTAL_ROLES = ["admin", "coach", "parent"];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith("/api/");
  const unauthorizedResponse = () =>
    isApiRoute
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));

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
        return NextResponse.redirect(new URL("/portal", request.url));
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
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return unauthorizedResponse();
    }
  }

  const response = NextResponse.next();

  // Security headers
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
