import type { Metadata, Viewport } from "next";
import { Work_Sans, Chakra_Petch } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "@/lib/env"; // validate required env vars at startup
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import dynamic from "next/dynamic";
import SessionProvider from "@/components/layout/SessionProvider";
import { RouteLoadingBar } from "@/components/ui/RouteLoadingBar";
import { NativeStatusBar } from "@/components/native/NativeStatusBar";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";

// Non-critical components loaded after initial paint
const MobileRegisterBar = dynamic(() => import("@/components/layout/MobileRegisterBar"));
const EditToolbar = dynamic(() => import("@/components/layout/EditToolbar"));
const ScrollProgress = dynamic(() => import("@/components/ui/ScrollProgress"));
const InstallPrompt = dynamic(() => import("@/components/pwa/InstallPrompt").then(m => ({ default: m.InstallPrompt })));
const UpdatePrompt = dynamic(() => import("@/components/pwa/UpdatePrompt").then(m => ({ default: m.UpdatePrompt })));
const GoogleAnalytics = dynamic(() => import("@/components/analytics/GoogleAnalytics"));
const MetaPixel = dynamic(() => import("@/components/analytics/MetaPixel"));
const CookieConsent = dynamic(() => import("@/components/layout/CookieConsent"));
const UnverifiedEmailBanner = dynamic(
  () => import("@/components/layout/UnverifiedEmailBanner")
);
import { AppleSplashScreens } from "@/components/pwa/AppleSplashScreens";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/constants";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B1D3A" },
    { media: "(prefers-color-scheme: dark)", color: "#061325" },
  ],
};

export const metadata: Metadata = {
  title: `${SITE_NAME} | Indoor Basketball & Volleyball Facility in Gilbert, Arizona`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} | Indoor Basketball & Volleyball Facility`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Indoor Basketball & Volleyball Facility in Gilbert, AZ`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Arizona's premier indoor basketball & volleyball facility.",
    images: ["/opengraph-image"],
  },
  metadataBase: new URL(SITE_URL),
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${chakra.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Inspire Courts" />
        <link rel="apple-touch-icon" href="/images/inspire-athletics-logo.png" />
        <AppleSplashScreens />
        <link rel="preconnect" href="https://maps.google.com" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-red focus:text-white focus:px-6 focus:py-3 focus:rounded-lg focus:text-sm focus:font-bold focus:uppercase focus:tracking-wider focus:shadow-lg"
        >
          Skip to content
        </a>
        <SessionProvider>
          <NativeStatusBar />
          <RouteLoadingBar />
          <ScrollProgress />
          <Header />
          <UnverifiedEmailBanner />
          <main id="main-content" tabIndex={-1} className="flex-1 page-transition focus:outline-none">{children}</main>
          <Footer />
          <MobileRegisterBar />
          <EditToolbar />
          {/* GoogleAnalytics uses useSearchParams — must be Suspense-wrapped */}
          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>
          <MetaPixel />
        </SessionProvider>
        <ServiceWorkerRegistrar />
        <InstallPrompt />
        <UpdatePrompt />
        <CookieConsent />
      </body>
    </html>
  );
}
