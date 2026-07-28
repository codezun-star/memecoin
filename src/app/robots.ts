import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Endpoints: no son páginas y no aportan nada en un buscador.
        "/api/",
        // Rutas con sesión o de un solo uso. Rastrearlas no lleva a ningún sitio
        // útil y además gasta presupuesto de rastreo.
        "/profile",
        "/auth/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
