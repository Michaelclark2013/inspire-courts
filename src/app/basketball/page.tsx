import type { Metadata } from "next";
import { SportMicrosite } from "@/components/sport/SportMicrosite";
import { getSportConfig } from "@/lib/sport-microsites";

const config = getSportConfig("basketball")!;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  openGraph: { title: config.metaTitle, description: config.metaDescription },
};

export default function BasketballPage() {
  return <SportMicrosite config={config} />;
}
