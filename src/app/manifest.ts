import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA.
 *
 * Hace la web instalable en móvil y escritorio. **No la hace funcionar sin
 * conexión a propósito**: esto es una app de precios en vivo, y servir datos
 * cacheados sería peor que no servir nada.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Memecoin Plaza — precios y debate de meme coins",
    short_name: "Memecoin Plaza",
    description:
      "Precios en tiempo real y foro de la comunidad para las 20 meme coins que mueven el mercado.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "es",
    dir: "ltr",
    categories: ["finance", "social"],
    background_color: "#FFFBF3",
    theme_color: "#FFFBF3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android recorta el icono con la forma del sistema; este lleva el logo
      // reducido y centrado para que el recorte no se coma nada.
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
