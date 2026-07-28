import type { MetadataRoute } from "next";

import { TRACKED_COINS } from "@/lib/coins";
import { getCoinsConFicha } from "@/lib/coin-content";
import { getAllPosts, getPostsPaginados } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-config";

/**
 * Sitemap.
 *
 * Solo entran páginas públicas e indexables. Fuera quedan las rutas con sesión
 * (`/profile`), los endpoints (`/api/*`) y **las de registro e inicio de
 * sesión**: un formulario de login no responde a ninguna búsqueda, así que
 * pedirle a un buscador que lo rastree es gastar presupuesto de rastreo en algo
 * que nunca va a posicionar. Van con `noindex` en su propia metadata.
 *
 * Sobre las fechas: `lastModified` solo sirve de algo si es verdad. Poner la
 * fecha del build en todas las URLs le dice al buscador que el sitio entero
 * cambió en cada despliegue, y acaba ignorándolas. Aquí cada tipo de página usa
 * la fecha que de verdad le corresponde.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();

  const [posts, { totalPaginas }, fichas] = await Promise.all([
    getAllPosts(),
    getPostsPaginados(1),
    getCoinsConFicha(),
  ]);

  return [
    {
      url: SITE_URL,
      lastModified: ahora,
      // Los precios cambian solos, pero la página en sí no; a diario es honesto.
      changeFrequency: "daily",
      priority: 1,
    },
    ...TRACKED_COINS.map((coin) => {
      const revisada = fichas.get(coin.id);
      return {
        url: `${SITE_URL}/coin/${coin.slug}`,
        // La fecha de revisión de la ficha, no la del despliegue: es lo que mira
        // un buscador para saber si el contenido editorial ha cambiado.
        lastModified: revisada ? new Date(revisada) : ahora,
        changeFrequency: "daily" as const,
        // Las que tienen ficha larga son las que pueden posicionar por sí solas.
        priority: fichas.has(coin.id) ? 0.9 : 0.7,
      };
    }),
    {
      url: `${SITE_URL}/operaciones`,
      lastModified: ahora,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: posts[0] ? new Date(posts[0].updated ?? posts[0].date) : ahora,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    // Páginas 2 en adelante del listado: si no entran, los artículos antiguos
    // dependen de que el rastreador siga los enlaces de paginación.
    ...Array.from({ length: Math.max(0, totalPaginas - 1) }, (_, i) => ({
      url: `${SITE_URL}/blog/pagina/${i + 2}`,
      lastModified: posts[0] ? new Date(posts[0].date) : ahora,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      // La fecha real del artículo, no la del build.
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
