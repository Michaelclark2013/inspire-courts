"use client";

import { trackConversion } from "@/lib/analytics";

interface RegisterLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

/** Anchor that fires register_click on both GA4 and Meta before navigating. */
export default function RegisterLink({ href, className, children }: RegisterLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackConversion("register_click")}
    >
      {children}
    </a>
  );
}
