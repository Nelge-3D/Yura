"use client";

import { useEffect } from "react";

const CACHE = "yura-v1"; // même nom que dans public/sw.js

export default function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // En développement, le service worker servirait des fichiers en cache périmés pendant qu'on
    // modifie le code : on n'en installe pas, et on retire celui d'une session précédente.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      caches?.delete(CACHE).catch(() => {});
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      // Hors ligne indisponible, mais l'app fonctionne normalement
      .catch((err) => console.warn("SW registration failed:", err));
  }, []);

  return null;
}
