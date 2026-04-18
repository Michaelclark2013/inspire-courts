import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registration Confirmed | Inspire Courts AZ",
  description: "Your tournament registration has been confirmed.",
  robots: "noindex, nofollow",
};

export default function ConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
