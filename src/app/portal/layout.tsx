import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PortalSidebar from "@/components/portal/PortalSidebar";
import SessionProvider from "@/components/layout/SessionProvider";
import { PortalViewProvider } from "@/components/portal/PortalViewContext";

export const metadata = {
  title: "Portal | Inspire Courts AZ",
  robots: "noindex, nofollow",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <div className="min-h-screen bg-bg flex">
          <PortalSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </PortalViewProvider>
    </SessionProvider>
  );
}
