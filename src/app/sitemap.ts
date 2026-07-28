import type { MetadataRoute } from "next";

import { TRACKED_COINS } from "@/lib/coins";
import { SITE_URL } from "@/lib/site-config";

/**
 * Sitemap. Solo entran páginas públicas e indexables: nada de rutas con sesión
 * (`/profile`) ni de endpoints (`/api/*`).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: ahora,
      // Los precios cambian solos, pero la página en sí no; a diario es honesto.
      changeFrequency: "daily",
      priority: 1,
    },
    ...TRACKED_COINS.map((coin) => ({
      url: `${SITE_URL}/coin/${coin.slug}`,
      lastModified: ahora,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/signup`,
      lastModified: ahora,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: ahora,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
  ];
}
