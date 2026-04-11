import type { Metadata } from "next";
import BookingForm from "./BookingForm";

export const metadata: Metadata = {
  title: "Book the Facility | Inspire Courts AZ",
  description:
    "Book Inspire Courts in Gilbert, AZ for leagues, practices, tournaments, and private events. 7 regulation indoor courts.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/book",
  },
};

export default function BookPage() {
  return <BookingForm />;
}
