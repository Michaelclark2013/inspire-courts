import type { Metadata } from "next";
import { Work_Sans, Chakra_Petch } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileRegisterBar from "@/components/layout/MobileRegisterBar";
import ChatWidget from "@/components/layout/ChatWidget";
import Analytics from "@/components/layout/Analytics";

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
  title: "Inspire Courts AZ | Indoor Basketball Facility & Tournaments in Gilbert, Arizona",
  description:
    "Arizona's premier indoor basketball facility. 2 courts, live digital scoreboards, game film every game. Home of OFF SZN HOOPS tournaments in Gilbert, AZ.",
  openGraph: {
    title: "Inspire Courts AZ | Indoor Basketball Facility & Tournaments",
    description:
      "Arizona's premier indoor basketball facility. 2 courts, live scoreboards, game film every game.",
    url: "https://inspirecourtsaz.com",
    siteName: "Inspire Courts AZ",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inspire Courts AZ",
    description: "Arizona's premier indoor basketball facility.",
  },
  metadataBase: new URL("https://inspirecourtsaz.com"),
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
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileRegisterBar />
        <ChatWidget />
        <Analytics />
      </body>
    </html>
  );
}
