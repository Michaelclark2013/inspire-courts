import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock, MessageSquare } from "lucide-react";
import { INQUIRY_CONFIGS, getInquiryConfig } from "@/lib/inquiry-forms";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { SITE_URL } from "@/lib/constants";

export function generateStaticParams() {
  return INQUIRY_CONFIGS.filter((c) => c.kind !== "general").map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const config = getInquiryConfig(slug);
  if (!config) return { title: "Inquire — Inspire Courts AZ" };
  const url = `${SITE_URL}/inquire/${slug}`;
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      url,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/images/courts-bg.jpg`,
          width: 1200,
          height: 630,
          alt: `${config.title} — Inspire Courts AZ`,
        },
      ],
    },
  };
}

export default async function InquirePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const config = getInquiryConfig(slug);
  if (!config) notFound();

  return (
    <main className="min-h-screen bg-off-white">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <Link href="/inquire" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-semibold uppercase tracking-wider mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> All inquiries
          </Link>
          <p className="text-white/50 text-[11px] uppercase tracking-[0.3em] mb-2">{config.hero.eyebrow}</p>
          <h1 className="text-3xl sm:text-5xl font-bold font-heading mb-3">
            {config.hero.headline}
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mb-5">{config.hero.body}</p>
          <ul className="space-y-1.5">
            {config.hero.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-white/80 text-sm">
                <Check className="w-4 h-4 text-red flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <InquiryForm config={config} source={sp?.source || `inquire/${config.slug}`} />

        <aside className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5" />
              30-minute response SLA
            </div>
            <p className="text-text-muted text-sm">
              Mon-Fri 8a-7p · Sat 9a-5p. Outside hours we'll reach out first thing the next morning.
            </p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 text-navy text-xs font-bold uppercase tracking-wider mb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Talk to a person
            </div>
            <p className="text-text-muted text-sm mb-2">
              Prefer to chat? Call or text the front desk:
            </p>
            <a href="tel:+14805550100" className="text-navy font-bold">
              (480) 555-0100
            </a>
          </div>
        </aside>
      </section>
    </main>
  );
}
