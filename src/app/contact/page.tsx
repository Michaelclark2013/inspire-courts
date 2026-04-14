import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | Inspire Courts AZ — Gilbert, Arizona",
  description:
    "Get in touch with Inspire Courts AZ. Questions about tournaments, facility rentals, training, or game day? We'll get back to you fast.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/contact",
  },
  openGraph: {
    title: "Contact Inspire Courts AZ",
    description:
      "Reach out about tournaments, court rentals, training programs, or anything else. Inspire Courts AZ — Gilbert, Arizona.",
    url: "https://inspirecourtsaz.com/contact",
    images: [
      {
        url: "https://inspirecourtsaz.com/images/hero-bg.jpg",
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
    images: ["https://inspirecourtsaz.com/images/hero-bg.jpg"],
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
