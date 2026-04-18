"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logger } from "@/lib/logger";

export function ServiceWorkerRegistrar() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isAdmin = pathname.startsWith("/admin");
    const swUrl = isAdmin ? "/admin-sw.js" : "/sw.js";
    const scope = isAdmin ? "/admin/" : "/";

    navigator.serviceWorker
      .register(swUrl, { scope })
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new version is waiting — dispatch event for any toast listener
              window.dispatchEvent(
                new CustomEvent("sw-update-available", {
                  detail: { registration: reg },
                })
              );
            }
          });
        });
      })
      .catch((err) => {
        logger.warn("SW registration failed", { error: String(err) });
      });

    // Reload when the new SW takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
