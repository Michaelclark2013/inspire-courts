import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata: Metadata = {
  title: "Verify Email | Inspire Courts AZ",
  description: "Confirm your email address to finish setting up your account.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient />
    </Suspense>
  );
}
