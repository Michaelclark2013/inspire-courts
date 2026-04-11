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

  // Admin routes: require admin-level role
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!ADMIN_ROLES.includes(token.role as string)) {
      // Coach/parent → send to portal
      if (PORTAL_ROLES.includes(token.role as string)) {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Portal routes: require portal-level role
  if (pathname.startsWith("/portal")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!PORTAL_ROLES.includes(token.role as string)) {
      // Staff/ref/front_desk → send to admin
      if (ADMIN_ROLES.includes(token.role as string)) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
