import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournament Registration | Inspire Courts AZ",
  description:
    "Register your team for a tournament at Inspire Courts AZ.",
};

export default function TournamentRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
