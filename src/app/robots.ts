import type { MetadataRoute } from "next";

import { ANSWER_ENGINE_CRAWLERS } from "@/lib/crawlers";
import { SITE_URL } from "@/lib/site-config";

const DISALLOW = [
  // Endpoints: no son páginas y no aportan nada en un buscador.
  "/api/",
  // Rutas con sesión o de un solo uso. Rastrearlas no lleva a ningún sitio
  // útil y además gasta presupuesto de rastreo.
  "/profile",
  "/auth/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      // Los motores de respuestas pueden leer y citar el sitio, con las mismas
      // exclusiones. El grupo tiene que repetirlas: un rastreador obedece solo
      // su grupo más específico y no hereda nada de `*` (ver lib/crawlers.ts).
      // Si algún día se excluye otra ruta, va en la constante de arriba y entra
      // en los dos grupos a la vez.
      {
        userAgent: [...ANSWER_ENGINE_CRAWLERS],
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
