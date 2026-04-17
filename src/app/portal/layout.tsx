import { redirect } from "next/navigation";
import { headers } from "next/headers";
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

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const isPublic = headersList.get("x-portal-public") === "1";

  // Public player/coach portal pages — no auth required, no sidebar
  if (isPublic) {
    return (
      <div className="min-h-screen bg-off-white">
        {children}
      </div>
    );
  }

  // Authenticated portal — require session
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (!["admin", "coach", "parent"].includes(session.user.role || "")) {
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
          <main id="portal-main" className="flex-1 min-w-0">{children}</main>
        </div>
      </PortalViewProvider>
    </SessionProvider>
  );
}
