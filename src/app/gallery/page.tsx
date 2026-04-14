import type { Metadata } from "next";
import GalleryPageClient from "./GalleryPageClient";

export const metadata: Metadata = {
  title: "Photo Gallery | Inspire Courts AZ",
  description:
    "Browse tournament action, facility photos, and player highlights from Inspire Courts AZ and OFF SZN HOOPS events in Gilbert, Arizona.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/gallery",
  },
};

export default function GalleryPage() {
  return <GalleryPageClient />;
}
