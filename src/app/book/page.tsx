import type { Metadata } from "next";
import BookingForm from "./BookingForm";

export const metadata: Metadata = {
  title: "Book the Facility | Inspire Courts AZ",
  description:
    "Book Inspire Courts in Gilbert, AZ for leagues, practices, tournaments, and private events. 7 regulation indoor courts.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/book",
  },
  openGraph: {
    title: "Book the Facility | Inspire Courts AZ",
    description: "Rent Inspire Courts in Gilbert, AZ for leagues, practices, tournaments, and private events. 7 regulation indoor courts available.",
    url: "https://inspirecourtsaz.com/book",
    images: [{ url: "https://inspirecourtsaz.com/images/hero-bg.jpg", width: 1200, height: 630, alt: "Inspire Courts AZ indoor facility for rent" }],
  },
};

export default function BookPage() {
  return <BookingForm />;
}
