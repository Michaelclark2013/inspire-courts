import type { Metadata } from "next";
import Link from "next/link";
import { Star, ArrowRight, MessageSquare, Heart } from "lucide-react";

// SMS-friendly short URL we send happy customers to. Splits the path:
// 5-star → bounce straight to Google review form. 1-4 → private
// feedback inquiry that hits /admin/inquiries instead of the public
// review system. Classic NPS pattern: amplify promoters, intercept
// detractors before they leave a 1-star public review.

const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "https://g.page/r/INSPIRE-COURTS-PLACEHOLDER/review";

export const metadata: Metadata = {
  title: "Leave a Review — Inspire Courts AZ",
  description: "Tell us how it went. Five stars goes to Google; anything else comes straight to us.",
  robots: { index: false }, // Don't surface this in search — it's a campaign destination only.
};

export default function LeaveReviewPage() {
  return (
    <main className="min-h-screen bg-navy text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-7 h-7 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-3">
            How&apos;d it go?
          </h1>
          <p className="text-white/70 text-sm">
            Loved your experience? Tell the world. Something off? Tell us first — we want to make it right.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white text-navy rounded-2xl p-5 hover:shadow-xl transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-red fill-red" />
              <span className="font-bold text-lg">5-star experience</span>
            </div>
            <p className="text-text-muted text-sm mb-3">
              Loved it? Take 30 seconds to tell other Phoenix families on Google.
            </p>
            <span className="inline-flex items-center gap-1 text-red font-bold text-xs uppercase tracking-wider">
              Leave a Google review <ArrowRight className="w-3 h-3" />
            </span>
          </a>

          <Link
            href="/inquire?source=leave-a-review-feedback"
            className="block bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-6 h-6 text-amber-300" />
              <span className="font-bold text-lg">Something was off</span>
            </div>
            <p className="text-white/70 text-sm mb-3">
              We want to know what to fix. A real human from our team will reach out within the day.
            </p>
            <span className="inline-flex items-center gap-1 text-amber-300 font-bold text-xs uppercase tracking-wider">
              Tell us privately <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>

        <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] text-center mt-8">
          Inspire Courts AZ · Gilbert, Arizona
        </p>
      </div>
    </main>
  );
}
