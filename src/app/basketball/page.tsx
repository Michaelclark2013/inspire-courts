import type { Metadata } from "next";
import { SportMicrosite } from "@/components/sport/SportMicrosite";
import { getSportConfig } from "@/lib/sport-microsites";
import { SITE_URL } from "@/lib/constants";

const config = getSportConfig("basketball")!;
const ogImage = `${SITE_URL}/images/courts-bg.jpg`;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: "/basketball" },
  openGraph: {
    title: config.metaTitle,
    description: config.metaDescription,
    url: "/basketball",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Inspire Courts AZ basketball" }],
    type: "website",
    siteName: "Inspire Courts AZ",
  },
  twitter: {
    card: "summary_large_image",
    title: config.metaTitle,
    description: config.metaDescription,
    images: [ogImage],
  },
};

export default function BasketballPage() {
  return <SportMicrosite config={config} />;
}
