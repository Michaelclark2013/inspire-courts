import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournament Registration | Inspire Courts AZ",
  description:
    "Register your team for a tournament at Inspire Courts AZ.",
  // Transactional flow — don't index every tournament/{id}/register URL.
  // The parent /tournaments/{id} page is the indexable entry point.
  robots: "noindex, follow",
};

export default function TournamentRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
