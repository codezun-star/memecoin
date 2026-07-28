import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA.
 *
 * Hace la web instalable en móvil y escritorio. **No la hace funcionar sin
 * conexión a propósito**: esto es una app de precios en vivo, y servir datos
 * cacheados sería peor que no servir nada.
 *
 * Los campos van cuidados como una ficha de tienda de aplicaciones, porque es
 * exactamente lo que el navegador muestra al ofrecer la instalación: nombre
 * corto que no se corte, descripción que diga qué hace, capturas reales y
 * accesos directos a las dos acciones más frecuentes.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Memecoin Plaza — precios en vivo y foro de meme coins",
    // Bajo el icono se cortan los nombres largos; doce caracteres van sobrados.
    short_name: "Memecoin",
    description:
      "Precios en tiempo real de las 20 meme coins más importantes (Dogecoin, Shiba Inu, Pepe, Bonk y más), gráficos por rangos, foro de la comunidad y guías para entender el mercado. En español.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "es",
    dir: "ltr",
    categories: ["finance", "news", "social"],
    background_color: "#FFFBF3",
    theme_color: "#FFFBF3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android recorta el icono con la forma del sistema; este lleva el logo
      // reducido y centrado para que el recorte no se coma nada.
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    /**
     * Capturas reales de la aplicación. Con ellas, el navegador muestra un
     * diálogo de instalación enriquecido en lugar de una línea de texto; sin
     * ellas, la instalación se ofrece igual pero sin ninguna previsualización.
     */
    screenshots: [
      {
        src: "/screenshots/movil-mercado.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Precios en vivo de las 20 meme coins",
      },
      {
        src: "/screenshots/movil-moneda.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Ficha de cada moneda con gráfico y debate",
      },
      {
        src: "/screenshots/escritorio-mercado.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "El mercado completo en una pantalla",
      },
      {
        src: "/screenshots/escritorio-blog.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "Guías para entender las meme coins",
      },
    ],
    /** Accesos directos al mantener pulsado el icono de la aplicación. */
    shortcuts: [
      {
        name: "Ver el mercado",
        short_name: "Mercado",
        description: "Precios en vivo de las 20 meme coins",
        url: "/#mercado",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Leer el blog",
        short_name: "Blog",
        description: "Guías y análisis sobre meme coins",
        url: "/blog",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
