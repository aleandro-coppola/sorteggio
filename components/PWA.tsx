"use client";

import { useEffect } from "react";

// Registra il service worker (solo in produzione e se supportato).
export default function PWA() {
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* niente panico: l'app funziona lo stesso */
      });
    }
  }, []);
  return null;
}
