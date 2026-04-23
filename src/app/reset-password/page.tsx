import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Reset Password | Inspire Courts AZ",
  description: "Set a new password for your Inspire Courts AZ account.",
  alternates: { canonical: `${SITE_URL}/reset-password` },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordClient />;
}
