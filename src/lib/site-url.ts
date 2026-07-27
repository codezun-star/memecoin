import { headers } from "next/headers";

/**
 * URL absoluta del sitio, necesaria para los `redirectTo` de OAuth.
 *
 * Orden: variable explícita > URL que Vercel inyecta en cada deploy > cabeceras
 * de la request (dev y previews sin configurar).
 */
export async function getSiteUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
