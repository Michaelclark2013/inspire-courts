import type { Metadata } from "next";
import { SportMicrosite } from "@/components/sport/SportMicrosite";
import { getSportConfig } from "@/lib/sport-microsites";

const config = getSportConfig("pickleball")!;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: "/pickleball" },
  openGraph: { title: config.metaTitle, description: config.metaDescription, url: "/pickleball" },
};

export default function PickleballPage() {
  return <SportMicrosite config={config} />;
}
