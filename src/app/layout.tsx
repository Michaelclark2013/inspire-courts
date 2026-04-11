import type { Metadata } from "next";
import { Work_Sans, Chakra_Petch } from "next/font/google";
import "./globals.css";
import "@/lib/env"; // validate required env vars at startup
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileRegisterBar from "@/components/layout/MobileRegisterBar";
import ChatWidget from "@/components/layout/ChatWidget";
import Analytics from "@/components/layout/Analytics";
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

export const metadata: Metadata = {
  title: `${SITE_NAME} | Indoor Basketball Facility & Tournaments in Gilbert, Arizona`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} | Indoor Basketball Facility & Tournaments`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Arizona's premier indoor basketball facility.",
  },
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${chakra.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        <MobileRegisterBar />
        <ChatWidget />
        <Analytics />
      </body>
    </html>
  );
}
