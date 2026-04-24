import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PortalSidebar from "@/components/portal/PortalSidebar";
import SessionProvider from "@/components/layout/SessionProvider";
import { PortalViewProvider } from "@/components/portal/PortalViewContext";

export const metadata = {
  title: "Portal | Inspire Courts AZ",
  description: "Coach and parent portal — manage rosters, check-ins, waivers, and game schedules at Inspire Courts AZ.",
  robots: "noindex, nofollow",
};

const PORTAL_ROLES = ["admin", "coach", "parent", "staff", "ref", "front_desk"];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // All portal pages now require auth (middleware already gates this —
  // this is the defense-in-depth layer for role enforcement).
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (!PORTAL_ROLES.includes(session.user.role || "")) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <PortalViewProvider>
        <a
          href="#portal-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-red focus:text-white focus:px-6 focus:py-3 focus:rounded-lg focus:text-sm focus:font-bold focus:uppercase focus:tracking-wider focus:shadow-lg"
        >
          Skip to content
        </a>
        <div className="min-h-screen bg-off-white flex">
          <PortalSidebar />
          <main id="portal-main" className="flex-1 min-w-0 overflow-x-hidden pb-24 lg:pb-0">{children}</main>
        </div>
      </PortalViewProvider>
    </SessionProvider>
  );
}
