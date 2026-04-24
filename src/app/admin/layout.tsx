import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/layout/AdminSidebar";
import MobileAdminHeader from "@/components/admin/MobileAdminHeader";
import AdminFAB from "@/components/admin/AdminFAB";
import KeyboardShortcutsHint from "@/components/admin/KeyboardShortcutsHint";
import SessionProvider from "@/components/layout/SessionProvider";
import { ToastProvider } from "@/components/ui/Toast";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { isAdminRole } from "@/lib/permissions";
import OfflineBanner from "@/components/pwa/OfflineBanner";
import dynamic from "next/dynamic";
const CommandPalette = dynamic(() => import("@/components/admin/CommandPalette"));
const ViewAsUserBanner = dynamic(() => import("@/components/admin/dashboard/ViewAsUserBanner"));

export const metadata = {
  title: "Admin Dashboard | Inspire Courts AZ",
  description: "Inspire Courts AZ admin dashboard — manage tournaments, scores, check-ins, revenue, and team operations.",
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
        <head>
          <link rel="manifest" href="/admin-manifest.json" />
          <meta name="apple-mobile-web-app-title" content="Inspire Admin" />
          <meta name="theme-color" content="#CC0000" />
        </head>
        <ScrollToTop />
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-red focus:text-white focus:px-6 focus:py-3 focus:rounded-lg focus:text-sm focus:font-bold focus:uppercase focus:tracking-wider focus:shadow-lg"
        >
          Skip to content
        </a>
        <div className="min-h-screen bg-off-white lg:flex">
          <AdminSidebar />
          {/* Bottom padding on mobile = bottom-nav (~56px) + safe-area
              inset. Using env() covers notched phones without over-
              reserving space on flat-bottom devices. */}
          <main
            id="admin-main"
            className="flex-1 min-w-0 overflow-x-hidden page-transition"
            style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom) + 16px)" }}
          >
            <ViewAsUserBanner />
            <MobileAdminHeader />
            <OfflineBanner />
            {children}
          </main>
          <AdminFAB />
          <KeyboardShortcutsHint />
          <CommandPalette />
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
