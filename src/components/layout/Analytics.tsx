"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Track page views
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    // Send page view
    (window as any).gtag?.("config", GA_ID, { page_path: url });
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <Suspense>
        <AnalyticsTracker />
      </Suspense>
    </>
  );
}

// Custom event tracking helper
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window === "undefined" || !(window as any).gtag) return;
  (window as any).gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}
