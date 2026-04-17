import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminFAB from "@/components/admin/AdminFAB";
import SessionProvider from "@/components/layout/SessionProvider";
import { ToastProvider } from "@/components/ui/Toast";
import ScrollToTop from "@/components/ui/ScrollToTop";
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
      <ToastProvider>
        <ScrollToTop />
        <div className="min-h-screen bg-off-white lg:flex">
          <AdminSidebar />
          <main className="flex-1 min-w-0 pb-20 lg:pb-0 page-transition">{children}</main>
          <AdminFAB />
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
