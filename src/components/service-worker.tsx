"use client";

import { useEffect } from "react";

/**
 * Registra el service worker que hace la web instalable.
 *
 * Se registra después de `load` para no competir por ancho de banda con el
 * primer pintado, que es lo que de verdad le importa a quien acaba de entrar.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        // Que falle no rompe nada: la web funciona igual, solo no se puede instalar.
        console.error("[sw] no se ha podido registrar:", error);
      });
    };

    if (document.readyState === "complete") {
      registrar();
    } else {
      window.addEventListener("load", registrar, { once: true });
      return () => window.removeEventListener("load", registrar);
    }
  }, []);

  return null;
}
