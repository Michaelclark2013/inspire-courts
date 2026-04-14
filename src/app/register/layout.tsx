import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Inspire Courts AZ",
  description: "Create your Inspire Courts AZ account to manage registrations and access your coach or parent dashboard.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/register",
  },
  openGraph: {
    title: "Create Account | Inspire Courts AZ",
    description: "Sign up as a coach or parent to manage registrations and access your Inspire Courts dashboard.",
    url: "https://inspirecourtsaz.com/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
