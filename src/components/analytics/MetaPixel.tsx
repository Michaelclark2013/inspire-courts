"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasAnalyticsConsent } from "@/components/layout/CookieConsent";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function MetaPixel() {
  const pathname = usePathname();

  // Gate on the same cookie-consent banner as Google Analytics so
  // declining blocks all third-party tracking, not just GA.
  const [consented, setConsented] = useState(false);
  useEffect(() => {
    setConsented(hasAnalyticsConsent());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ value: "accepted" | "declined" }>).detail;
      setConsented(detail?.value === "accepted");
    }
    window.addEventListener("inspire-consent-change", onChange);
    return () => window.removeEventListener("inspire-consent-change", onChange);
  }, []);

  useEffect(() => {
    if (!PIXEL_ID || !consented) return;
    window.fbq?.("track", "PageView");
  }, [pathname, consented]);

  if (!PIXEL_ID || !consented) return null;

  return (
    <>
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
