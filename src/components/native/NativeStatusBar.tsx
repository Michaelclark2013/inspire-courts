"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setStatusBarColor } from "@/lib/capacitor";

export function NativeStatusBar() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdmin = pathname.startsWith("/admin");
    if (isAdmin) {
      setStatusBarColor("#FFFFFF", "dark"); // Light admin theme
    } else {
      setStatusBarColor("#0B1D3A", "light"); // Dark navy public
    }
  }, [pathname]);

  return null;
}
