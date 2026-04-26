import type { Metadata } from "next";
import {
  FACILITY_ADDRESS,
  FACILITY_EMAIL,
  FACILITY_NAME,
  FACILITY_PHONE,
  SITE_URL,
} from "@/lib/constants";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | Inspire Courts AZ — Gilbert, Arizona",
  description:
    "Get in touch with Inspire Courts AZ. Questions about tournaments, facility rentals, training, or game day? We'll get back to you fast.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: "Contact Inspire Courts AZ",
    description:
      "Reach out about tournaments, court rentals, training programs, or anything else. Inspire Courts AZ — Gilbert, Arizona.",
    url: `${SITE_URL}/contact`,
    images: [
      {
        url: `${SITE_URL}/images/courts-bg.jpg`,
        width: 1200,
        height: 630,
        alt: "Inspire Courts AZ — Contact Us",
      },
    ],
    siteName: "Inspire Courts AZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Inspire Courts AZ",
    description: "Questions about tournaments, rentals, or training? Get in touch with Inspire Courts AZ.",
    images: [`${SITE_URL}/images/courts-bg.jpg`],
  },
};

// LocalBusiness schema so Google can render rich knowledge-panel-style
// results when someone searches for the facility by name. Mirrors the
// SportsActivityLocation block on /facility but uses LocalBusiness here
// because the contact page is the canonical "how to reach us" surface.
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#contact`,
  name: FACILITY_NAME,
  url: `${SITE_URL}/contact`,
  telephone: `+1${FACILITY_PHONE.replace(/\D/g, "")}`,
  email: FACILITY_EMAIL,
  image: `${SITE_URL}/images/courts-bg.jpg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: `${FACILITY_ADDRESS.street}, ${FACILITY_ADDRESS.suite}`,
    addressLocality: FACILITY_ADDRESS.city,
    addressRegion: FACILITY_ADDRESS.state,
    postalCode: FACILITY_ADDRESS.zip,
    addressCountry: "US",
  },
  // Daily 6am–10pm — matches what's surfaced elsewhere on the site.
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
      ],
      opens: "06:00",
      closes: "22:00",
    },
  ],
  // Schema.org-recommended fields for LocalBusiness — these power the
  // "$$" indicator on Google's knowledge panel and the payment icons
  // on the local pack listing.
  priceRange: "$$",
  paymentAccepted: "Cash, Credit Card, Debit Card",
  currenciesAccepted: "USD",
};

const contactBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact` },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactBreadcrumbLd) }}
      />
      <ContactClient />
    </>
  );
}
