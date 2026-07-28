/**
 * URL pública del sitio, en un único lugar.
 *
 * La usan el layout (metadataBase y Open Graph), el sitemap y robots.txt. Antes
 * estaba duplicada en el layout y era fácil que se desincronizara.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://memecoin.codezun.com"
).replace(/\/$/, "");
