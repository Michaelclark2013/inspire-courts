import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | Inspire Courts AZ — Gilbert, Arizona",
  description:
    "Get in touch with Inspire Courts AZ. Questions about tournaments, facility rentals, training, or game day? We'll get back to you fast.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: "Contact Inspire Courts AZ",
    description:
      "Reach out about tournaments, court rentals, training programs, or anything else. Inspire Courts AZ — Gilbert, Arizona.",
    url: `${SITE_URL}/contact`,
    images: [
      {
        url: `${SITE_URL}/images/hero-bg.jpg`,
        width: 1200,
        height: 630,
        alt: "Inspire Courts AZ — Contact Us",
      },
    ],
    siteName: "Inspire Courts AZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Inspire Courts AZ",
    description: "Questions about tournaments, rentals, or training? Get in touch with Inspire Courts AZ.",
    images: [`${SITE_URL}/images/hero-bg.jpg`],
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
