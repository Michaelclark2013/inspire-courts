import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournament Registration | Inspire Courts AZ",
  description:
    "Register your team for OFF SZN HOOPS youth basketball tournaments at Inspire Courts AZ in Gilbert, Arizona. 10U–17U divisions, 3+ game guarantee, game film available.",
  alternates: {
    canonical: "https://inspirecourtsaz.com/tournaments",
  },
  openGraph: {
    title: "Tournament Registration | Inspire Courts AZ",
    description:
      "Register your team for youth basketball tournaments at Arizona's premier facility. 3+ game guarantee, game film, electronic scoreboards.",
    url: "https://inspirecourtsaz.com/tournaments",
    images: [
      {
        url: "https://inspirecourtsaz.com/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Inspire Courts AZ youth basketball tournament registration",
      },
    ],
  },
};

export default function TournamentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
