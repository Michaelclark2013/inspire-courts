import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Inspire Courts AZ",
  description:
    "Frequently asked questions about Inspire Courts AZ — tournament registration, facility rentals, waivers, game film, and more.",
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
