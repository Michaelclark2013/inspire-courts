import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ | Inspire Courts AZ — Tournaments, Rentals & Training",
  description:
    "Answers to frequently asked questions about tournaments, facility rentals, training programs, game day policies, and more at Inspire Courts AZ in Gilbert, Arizona.",
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: "FAQ | Inspire Courts AZ",
    description:
      "Common questions about tournaments, facility rentals, training, and game day at Inspire Courts AZ in Gilbert, Arizona.",
    url: `${SITE_URL}/faq`,
    images: [
      {
        url: `${SITE_URL}/images/hero-bg.jpg`,
        width: 1200,
        height: 630,
        alt: "Inspire Courts AZ FAQ",
      },
    ],
    siteName: "Inspire Courts AZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | Inspire Courts AZ",
    description: "Common questions about tournaments, rentals, and training at Inspire Courts AZ.",
    images: [`${SITE_URL}/images/hero-bg.jpg`],
  },
};

const FAQ_ITEMS = [
  { q: "How do I register for a tournament?", a: "Visit our Tournaments page, select your event, choose your division, complete the registration form with your team name and coach contact info, and submit payment. You'll receive a confirmation once registered." },
  { q: "How do I register a team?", a: "Coaches register on behalf of their team. Go to our Tournaments page, select the tournament, pick your age/gender division, fill in your team and coach details, and pay the entry fee." },
  { q: "What age group divisions do you offer?", a: "We run divisions from 10U through 17U, for both boys and girls. Division availability varies by event." },
  { q: "What payment methods do you accept?", a: "Tournament registrations accept all major credit and debit cards via Square. For in-person purchases, we accept both cash and card." },
  { q: "How much does it cost to rent the facility?", a: "Pricing depends on the number of courts, rental duration, and event type. Contact us for a custom quote." },
  { q: "How do I book the facility?", a: "Fill out the booking request form at inspirecourtsaz.com/book. We'll respond within 24 hours to confirm availability and pricing." },
  { q: "What is your cancellation and refund policy?", a: "Tournament registrations are generally non-refundable but may be transferable to another event. For facility rentals, cancellations 7+ days in advance may be eligible for a credit." },
  { q: "What should I bring on game day?", a: "Players: team jersey, non-marking court shoes, and water. Coaches: valid photo ID for check-in. Spectators: admission at the door — cash and card accepted." },
  { q: "Where do I park?", a: "Free parking is available at 1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233." },
  { q: "What training programs do you offer?", a: "We offer private 1-on-1 sessions, small group workouts, and shooting sessions for basketball covering shooting, ball handling, footwork, and game IQ." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQClient />
    </>
  );
}
