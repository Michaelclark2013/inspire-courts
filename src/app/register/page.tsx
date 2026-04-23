import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Create Account | Inspire Courts AZ",
  description:
    "Register for an Inspire Courts AZ account to sign up for tournaments, access the player portal, and manage your team roster.",
  alternates: { canonical: `${SITE_URL}/register` },
  openGraph: {
    title: "Create Your Inspire Courts Account",
    description: "Sign up to register for tournaments and access the player portal.",
    url: `${SITE_URL}/register`,
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <RegisterClient />;
}
