import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/layout/AdminSidebar";
import SessionProvider from "@/components/layout/SessionProvider";
import { isAdminRole } from "@/lib/permissions";

export const metadata = {
  title: "Admin Dashboard | Inspire Courts AZ",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (!isAdminRole(session.user.role)) {
    redirect("/portal");
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-bg lg:flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</main>
      </div>
    </SessionProvider>
  );
}
