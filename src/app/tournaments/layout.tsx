import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournaments | Inspire Courts AZ",
  description:
    "Browse and register for basketball tournaments at Inspire Courts AZ in Gilbert, Arizona. OFF SZN HOOPS and more.",
};

export default function TournamentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
