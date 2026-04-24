import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessWithOverrides, type AdminPage } from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";

// Server-component page guard. Use at the top of an admin page.tsx to
// ensure the current user actually has access — respects per-user
// overrides in addition to the role default.
//
// Middleware already catches most cases, but calling this in a page
// closes the loop for any path not in permission-paths.ts.
//
// Example:
//   export default async function MyPage() {
//     await requireAccess("revenue");
//     return <div>…</div>;
//   }
export async function requireAccess(page: AdminPage): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role) redirect("/login");

  const role = session.user.role as UserRole;
  // Main admin bypass — always allowed.
  if (role === "admin") return;

  const overrides = (
    session.user as { permissionOverrides?: Array<{ page: string; granted: boolean }> }
  ).permissionOverrides as Array<{ page: AdminPage; granted: boolean }> | undefined;

  if (!canAccessWithOverrides(role, page, overrides)) {
    redirect(`/admin?denied=${encodeURIComponent(page)}`);
  }
}
