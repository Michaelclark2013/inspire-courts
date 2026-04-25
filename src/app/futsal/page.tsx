import type { Metadata } from "next";
import { SportMicrosite } from "@/components/sport/SportMicrosite";
import { getSportConfig } from "@/lib/sport-microsites";

const config = getSportConfig("futsal")!;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: "/futsal" },
  openGraph: { title: config.metaTitle, description: config.metaDescription, url: "/futsal" },
};

export default function FutsalPage() {
  return <SportMicrosite config={config} />;
}
