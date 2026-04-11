import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Inspire Courts AZ",
  description:
    "Get in touch with Inspire Courts AZ in Gilbert, Arizona. Reach out about facility rentals, tournaments, club programs, and more.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
