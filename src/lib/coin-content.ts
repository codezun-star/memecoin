import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

import matter from "gray-matter";

import {
  extraerHeadings,
  listaDeTextos,
  markdownToHtml,
  normalizarFaq,
  type FaqItem,
  type Heading,
} from "@/lib/markdown";
import { TRACKED_COINS, type TrackedCoin } from "@/lib/coins";

/**
 * Ficha larga de cada moneda, en markdown.
 *
 * Vive en `content/monedas/<id>.md`, con el mismo id que usa CoinGecko y que es
 * también el slug de la URL. Fuera de la base de datos, igual que el blog: es
 * contenido editorial, se revisa al hacer merge y se resuelve en el build.
 *
 * Por qué en ficheros y no dentro de `coins.ts`: son novecientas palabras por
 * moneda. Metidas en el registro de monedas lo convertirían en un fichero de
 * veinte mil líneas donde ya no se vería lo que importa —el id, el par, los
 * colores—, y editar un párrafo obligaría a tocar código.
 *
 * **Una moneda sin fichero sigue funcionando.** La página se renderiza con sus
 * datos de mercado y sin la parte editorial. Es deliberado: añadir una moneda
 * nueva no debe bloquearse esperando a que alguien escriba la ficha.
 */

export const MONEDAS_DIR = path.join(process.cwd(), "content", "monedas");

export type CoinContent = {
  coinId: string;
  /** Título para el buscador. Más largo y descriptivo que el `<h1>`. */
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  /** Entradilla en texto plano: se usa tal cual bajo el titular. */
  resumen: string;
  /** HTML ya renderizado desde el markdown. */
  html: string;
  headings: Heading[];
  faq: FaqItem[];
  /** Fecha de última revisión editorial, ISO. Alimenta el sitemap. */
  actualizado: string | null;
};

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function rutaDe(coinId: string): string {
  // `coinId` nunca viene de la URL sin filtrar: quien llama resuelve antes la
  // moneda contra TRACKED_COINS, así que aquí no puede entrar una ruta relativa.
  return path.join(MONEDAS_DIR, `${coinId}.md`);
}

/**
 * Ficha de una moneda. `null` si todavía no está escrita.
 *
 * Un frontmatter incompleto no tumba el build: se avisa por consola y la página
 * se queda sin ficha. Perder una ficha mal escrita es mejor que tirar el
 * despliegue entero, y el aviso queda en el log.
 */
export const getCoinContent = cache(async (coinId: string): Promise<CoinContent | null> => {
  const ruta = rutaDe(coinId);
  if (!fs.existsSync(ruta)) return null;

  const { data, content } = matter(fs.readFileSync(ruta, "utf8"));

  const seoTitle = texto(data.seoTitle);
  const seoDescription = texto(data.seoDescription);

  if (!seoTitle || !seoDescription) {
    console.warn(`[monedas] ${coinId}.md ignorado: faltan "seoTitle" o "seoDescription".`);
    return null;
  }

  const actualizado = texto(data.actualizado);

  return {
    coinId,
    seoTitle,
    seoDescription,
    keywords: listaDeTextos(data.keywords),
    resumen: texto(data.resumen),
    html: await markdownToHtml(content),
    headings: extraerHeadings(content),
    faq: normalizarFaq(data.faq),
    actualizado:
      actualizado && !Number.isNaN(Date.parse(actualizado))
        ? new Date(actualizado).toISOString()
        : null,
  };
});

/** Qué monedas tienen ficha. Lo usa el sitemap para dar una fecha real. */
export const getCoinsConFicha = cache(async (): Promise<Map<string, string | null>> => {
  const salida = new Map<string, string | null>();
  for (const coin of TRACKED_COINS) {
    const ficha = await getCoinContent(coin.id);
    if (ficha) salida.set(coin.id, ficha.actualizado);
  }
  return salida;
});

/**
 * Enlaces a otras monedas para el bloque de «sigue explorando».
 *
 * Enlazar entre fichas reparte autoridad interna y le da al rastreador un
 * camino hacia las monedas menos visitadas, que de otro modo solo cuelgan del
 * listado de la portada.
 */
export function monedasRelacionadas(coin: TrackedCoin, cuantas = 4): TrackedCoin[] {
  const resto = TRACKED_COINS.filter((c) => c.id !== coin.id);

  // Se empieza por el índice de la moneda actual en vez de por el principio:
  // así cada ficha enlaza a un grupo distinto y no todas apuntan a las cuatro
  // primeras, que es como se acaba con veinte enlaces al mismo sitio.
  const desde = TRACKED_COINS.findIndex((c) => c.id === coin.id);
  return Array.from({ length: Math.min(cuantas, resto.length) }, (_, i) => {
    return resto[(desde + i) % resto.length];
  });
}
