"use client";

import { useEffect } from "react";

/** Registers the PWA service worker after the page is interactive. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    // Avoid SW in local next/dev HMR noise; still allow testing with ?sw=1
    const isDev = process.env.NODE_ENV === "development";
    const force = new URLSearchParams(window.location.search).has("sw");
    if (isDev && !force) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Installability still works without SW in some browsers; ignore failures.
    });
  }, []);

  return null;
}
