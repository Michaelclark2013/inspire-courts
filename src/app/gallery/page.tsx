import type { Metadata } from "next";
import GalleryPageClient from "./GalleryPageClient";

export const metadata: Metadata = {
  title: "Photo Gallery | Inspire Courts AZ",
  description:
    "Browse tournament action, facility photos, and player highlights from Inspire Courts AZ and OFF SZN HOOPS events in Gilbert, Arizona.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/gallery",
  },
  openGraph: {
    title: "Photo Gallery | Inspire Courts AZ",
    description: "Tournament action, facility photos, and player highlights from Inspire Courts AZ and OFF SZN HOOPS events.",
    url: "https://inspirecourtsaz.com/gallery",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Courts AZ photo gallery" }],
  },
};

export default function GalleryPage() {
  return <GalleryPageClient />;
}
