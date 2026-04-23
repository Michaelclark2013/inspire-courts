import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Log In | Inspire Courts AZ",
  description: "Log in to your Inspire Courts AZ account to access tournament registrations, the player portal, and admin dashboard.",
  alternates: { canonical: `${SITE_URL}/login` },
  openGraph: {
    title: "Log In — Inspire Courts AZ",
    url: `${SITE_URL}/login`,
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <LoginClient />;
}
