import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Forgot Password | Inspire Courts AZ",
  description: "Reset your Inspire Courts AZ account password. Enter your email and we'll send you a reset link.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/forgot-password",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
