import type { Metadata } from "next";
import OfflineClient from "./OfflineClient";

export const metadata: Metadata = {
  title: "Offline | Inspire Courts AZ",
  description: "You're currently offline. Reconnect to access live scores and registrations.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OfflineClient />;
}
