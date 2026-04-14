import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Inspire Courts AZ",
  description:
    "Frequently asked questions about Inspire Courts AZ — tournament registration, facility rentals, waivers, game film, and more.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/faq",
  },
  openGraph: {
    title: "FAQ | Inspire Courts AZ",
    description: "Answers to common questions about tournaments, facility rentals, waivers, game film, and policies at Inspire Courts AZ.",
    url: "https://inspirecourtsaz.com/faq",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Courts AZ frequently asked questions" }],
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
