import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Inspire Courts AZ",
  description:
    "Get in touch with Inspire Courts AZ in Gilbert, Arizona. Reach out about facility rentals, tournaments, club programs, and more.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/contact",
  },
  openGraph: {
    title: "Contact Inspire Courts AZ",
    description: "Questions about events, rentals, or training? Contact Inspire Courts AZ in Gilbert, Arizona.",
    url: "https://inspirecourtsaz.com/contact",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Contact Inspire Courts AZ" }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
