import type { Metadata } from "next";
import ConfirmationClient from "./ConfirmationClient";

export const metadata: Metadata = {
  title: "Registration Confirmed | Inspire Courts AZ",
  description: "Tournament registration confirmed. Review your team, payment, and next steps.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ConfirmationClient />;
}
