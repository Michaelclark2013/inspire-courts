import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import TournamentRegisterClient from "./RegisterClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Register for Tournament | Inspire Courts AZ",
    description: "Complete your team registration for this Inspire Courts tournament.",
    alternates: { canonical: `${SITE_URL}/tournaments/${id}/register` },
    robots: { index: false, follow: true },
  };
}

export default function Page() {
  return <TournamentRegisterClient />;
}
