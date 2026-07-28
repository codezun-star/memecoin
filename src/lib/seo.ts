import { SITE_URL } from "@/lib/site-config";
import type { FaqItem } from "@/lib/markdown";

/**
 * Constructores de datos estructurados.
 *
 * Están centralizados para que el nombre de la organización, el logo y la URL
 * no se escriban a mano en cada página: cuando eso pasa, tarde o temprano una
 * página dice «Memecoin Plaza» y otra «MemeCoin Plaza», y un buscador las lee
 * como dos entidades distintas.
 *
 * Nota sobre lo que **no** se marca: no se declara ningún precio en el esquema.
 * Los precios cambian cada veinte segundos y publicar en el marcado una cifra
 * que no coincide con la de la página es exactamente lo que penaliza Google.
 */

export const NOMBRE_ORGANIZACION = "Memecoin Plaza";

const LOGO = `${SITE_URL}/icons/icon-512.png`;

/** Referencia corta a la organización, para incrustar en otros esquemas. */
export const organizacionRef = {
  "@type": "Organization",
  name: NOMBRE_ORGANIZACION,
  url: SITE_URL,
} as const;

export function organizacion(descripcion: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organizacion`,
    name: NOMBRE_ORGANIZACION,
    url: SITE_URL,
    description: descripcion,
    logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 },
  };
}

export function sitioWeb(descripcion: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#sitio`,
    name: NOMBRE_ORGANIZACION,
    url: SITE_URL,
    description: descripcion,
    inLanguage: "es-ES",
    publisher: { "@id": `${SITE_URL}/#organizacion` },
  };
}

/**
 * Migas de pan.
 *
 * Se pasa la ruta sin el inicio: se añade solo, porque siempre es el mismo y
 * olvidarlo es el error más habitual al escribir este esquema a mano.
 */
export function migas(pasos: { nombre: string; ruta: string }[]): Record<string, unknown> {
  const todos = [{ nombre: "Inicio", ruta: "/" }, ...pasos];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: todos.map((paso, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: paso.nombre,
      item: paso.ruta === "/" ? SITE_URL : `${SITE_URL}${paso.ruta}`,
    })),
  };
}

export function preguntasFrecuentes(faq: FaqItem[]): Record<string, unknown> | null {
  if (faq.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.pregunta,
      acceptedAnswer: { "@type": "Answer", text: item.respuesta },
    })),
  };
}

/** Lista ordenada de páginas. Le da al buscador el catálogo de una tacada. */
export function listaDeElementos(
  nombre: string,
  elementos: { nombre: string; ruta: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: nombre,
    numberOfItems: elementos.length,
    itemListElement: elementos.map((el, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: el.nombre,
      url: `${SITE_URL}${el.ruta}`,
    })),
  };
}
