import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Inspire Courts AZ",
  description: "Reset your Inspire Courts AZ account password.",
  robots: "noindex, nofollow",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
