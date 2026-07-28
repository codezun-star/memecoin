import "server-only";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings, { type Options as AutolinkOptions } from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";

/**
 * Tratamiento del markdown, compartido por todo el contenido del sitio.
 *
 * Vivía dentro de `blog.ts` hasta que las fichas de las monedas empezaron a
 * necesitar exactamente lo mismo. Está aquí y no allí para que no haya dos
 * pipelines que puedan divergir: si mañana se cambia cómo se tratan los enlaces
 * externos, se cambia una vez.
 */

export type FaqItem = { pregunta: string; respuesta: string };

export type Heading = { id: string; text: string; level: 2 | 3 };

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    // Quita los diacríticos que la descomposición NFD acaba de separar.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Lista de textos a partir de un array o de una cadena separada por comas. */
export function listaDeTextos(valor: unknown): string[] {
  const bruto = Array.isArray(valor) ? valor : typeof valor === "string" ? valor.split(",") : [];
  return [...new Set(bruto.map((t) => String(t).trim()).filter(Boolean))];
}

/** Preguntas frecuentes del frontmatter. Lo que no encaje se descarta. */
export function normalizarFaq(valor: unknown): FaqItem[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const { pregunta, respuesta } = item as Record<string, unknown>;
      if (typeof pregunta !== "string" || typeof respuesta !== "string") return null;
      return { pregunta: pregunta.trim(), respuesta: respuesta.trim() };
    })
    .filter(
      (item): item is FaqItem => item !== null && item.pregunta !== "" && item.respuesta !== "",
    );
}

/**
 * Cada encabezado se convierte en un enlace a sí mismo, para poder compartir un
 * punto concreto. Va extraído a una constante tipada porque, en línea,
 * TypeScript no resuelve bien la sobrecarga de `.use()`.
 */
const ENLACES_EN_ENCABEZADOS: AutolinkOptions = {
  behavior: "wrap",
  properties: { className: ["no-underline", "hover:underline"] },
};

export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm) // tablas, listas de tareas, tachado
    // allowDangerousHtml: el contenido son ficheros del propio repositorio,
    // escritos por quien mantiene el sitio y revisados al hacer merge. No hay
    // entrada de terceros aquí, así que se permite HTML suelto para poder
    // incrustar cosas puntuales.
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug) // id en cada encabezado
    .use(rehypeAutolinkHeadings, ENLACES_EN_ENCABEZADOS)
    /**
     * Todo enlace externo sale con `nofollow` y se abre en otra pestaña.
     *
     * Citar una fuente da contexto al lector, pero no tiene por qué regalarle
     * autoridad de dominio: `nofollow` le dice al buscador que el enlace es una
     * referencia y no un respaldo. `noopener noreferrer` es además lo mínimo
     * exigible al abrir en pestaña nueva.
     */
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: ["nofollow", "noopener", "noreferrer"],
      protocols: ["http", "https"],
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(file);
}

/**
 * Índice a partir de los `##` y `###` del markdown.
 *
 * Se extrae del markdown crudo y no del HTML para no recorrer el árbol otra vez;
 * los ids se calculan igual que los de `rehype-slug`.
 */
export function extraerHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let dentroDeBloqueDeCodigo = false;

  for (const linea of markdown.split("\n")) {
    if (linea.trimStart().startsWith("```")) {
      dentroDeBloqueDeCodigo = !dentroDeBloqueDeCodigo;
      continue;
    }
    if (dentroDeBloqueDeCodigo) continue;

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(linea);
    if (!match) continue;

    // Quita el marcado en línea del título: **negrita**, `código`, [enlaces](url)
    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_`]/g, "")
      .trim();

    headings.push({ id: slugify(text), text, level: match[1].length === 2 ? 2 : 3 });
  }

  return headings;
}
