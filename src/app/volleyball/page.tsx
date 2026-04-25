import type { Metadata } from "next";
import { SportMicrosite } from "@/components/sport/SportMicrosite";
import { getSportConfig } from "@/lib/sport-microsites";

const config = getSportConfig("volleyball")!;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: "/volleyball" },
  openGraph: { title: config.metaTitle, description: config.metaDescription, url: "/volleyball" },
};

export default function VolleyballPage() {
  return <SportMicrosite config={config} />;
}
