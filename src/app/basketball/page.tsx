import type { Metadata } from "next";
import { SportMicrosite } from "@/components/sport/SportMicrosite";
import { getSportConfig } from "@/lib/sport-microsites";

const config = getSportConfig("basketball")!;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: "/basketball" },
  openGraph: { title: config.metaTitle, description: config.metaDescription, url: "/basketball" },
};

export default function BasketballPage() {
  return <SportMicrosite config={config} />;
}
