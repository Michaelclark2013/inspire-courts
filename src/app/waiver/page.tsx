import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import WaiverClient from "./WaiverClient";

export const metadata: Metadata = {
  title: "Sign Liability Waiver | Inspire Courts AZ",
  description:
    "Sign the Inspire Courts liability waiver online before tournaments, open gym, or training sessions. E-signature accepted.",
  alternates: { canonical: `${SITE_URL}/waiver` },
  openGraph: {
    title: "Sign Liability Waiver — Inspire Courts AZ",
    description: "Electronic liability waiver for players, parents, and guests at Inspire Courts AZ.",
    url: `${SITE_URL}/waiver`,
    images: [{ url: `${SITE_URL}/images/hero-bg.jpg`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <WaiverClient />;
}
