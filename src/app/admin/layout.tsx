import AdminSidebar from "@/components/layout/AdminSidebar";
import SessionProvider from "@/components/layout/SessionProvider";

export const metadata = {
  title: "Admin Dashboard | Inspire Courts AZ",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth temporarily disabled for development access
  return (
    <SessionProvider>
      <div className="min-h-screen bg-bg flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </SessionProvider>
  );
}
