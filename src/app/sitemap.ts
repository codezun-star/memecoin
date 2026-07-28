import type { MetadataRoute } from "next";

import { TRACKED_COINS } from "@/lib/coins";
import { getAllPosts, getPostsPaginados } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-config";

/**
 * Sitemap. Solo entran páginas públicas e indexables: nada de rutas con sesión
 * (`/profile`) ni de endpoints (`/api/*`).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();

  // Los artículos entran solos: publicar un .md lo añade al sitemap.
  const [posts, { totalPaginas }] = await Promise.all([getAllPosts(), getPostsPaginados(1)]);

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
      url: `${SITE_URL}/operaciones`,
      lastModified: ahora,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: posts[0] ? new Date(posts[0].date) : ahora,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    // Páginas 2 en adelante del listado: si no entran, los artículos antiguos
    // dependen de que el rastreador siga los enlaces de paginación.
    ...Array.from({ length: Math.max(0, totalPaginas - 1) }, (_, i) => ({
      url: `${SITE_URL}/blog/pagina/${i + 2}`,
      lastModified: ahora,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      // La fecha real del artículo, no la del build: es lo que mira un buscador
      // para saber si hay algo nuevo.
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
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
