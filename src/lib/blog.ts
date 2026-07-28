import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

import matter from "gray-matter";
import readingTime from "reading-time";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings, { type Options as AutolinkOptions } from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";

/**
 * Blog en ficheros markdown.
 *
 * Vive entero en `content/blog/`. No toca la base de datos para el contenido:
 * publicar es añadir un `.md` y desplegar, y todo se resuelve en tiempo de build,
 * así que las páginas salen como HTML estático.
 *
 * (Los comentarios de los artículos sí usan Supabase, pero son un añadido
 * opcional encima: el artículo se renderiza igual sin ellos.)
 *
 * El proceso de publicación está documentado en BLOG.md.
 */

export const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** Portada por defecto: el logo sobre el fondo de marca, en 1200x630. */
export const PORTADA_POR_DEFECTO = "/blog/portada.png";

const AUTOR_POR_DEFECTO = "Memecoin Plaza";

export type FaqItem = { pregunta: string; respuesta: string };

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO 8601. Se usa tal cual en el JSON-LD y en <time dateTime>. */
  date: string;
  updated?: string;
  image: string;
  imageAlt: string;
  /** Palabras clave. No se muestran: alimentan la metadata. */
  keywords: string[];
  author: string;
  draft: boolean;
  readingMinutes: number;
  /** Preguntas frecuentes. Generan el JSON-LD de tipo FAQPage. */
  faq: FaqItem[];
};

export type Heading = { id: string; text: string; level: 2 | 3 };

export type Post = PostMeta & {
  /** HTML ya renderizado a partir del markdown. */
  html: string;
  /** Índice del artículo, extraído de los encabezados. */
  headings: Heading[];
};

function esFechaValida(valor: unknown): valor is string | Date {
  if (valor instanceof Date) return !Number.isNaN(valor.getTime());
  return typeof valor === "string" && !Number.isNaN(Date.parse(valor));
}

function listaDeTextos(valor: unknown): string[] {
  const bruto = Array.isArray(valor) ? valor : typeof valor === "string" ? valor.split(",") : [];
  return [...new Set(bruto.map((t) => String(t).trim()).filter(Boolean))];
}

function normalizarFaq(valor: unknown): FaqItem[] {
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

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Cada encabezado se convierte en un enlace a sí mismo, para poder compartir un
 * punto concreto del artículo. Va extraído a una constante tipada porque, en
 * línea, TypeScript no resuelve bien la sobrecarga de `.use()`.
 */
const ENLACES_EN_ENCABEZADOS: AutolinkOptions = {
  behavior: "wrap",
  properties: { className: ["no-underline", "hover:underline"] },
};

async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm) // tablas, listas de tareas, tachado
    // allowDangerousHtml: los artículos son ficheros del propio repositorio,
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
 * Índice del artículo a partir de los `##` y `###` del markdown.
 *
 * Se extrae del markdown crudo y no del HTML para no recorrer el árbol otra vez;
 * los ids se calculan igual que los de `rehype-slug`.
 */
function extraerHeadings(markdown: string): Heading[] {
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

function leerFicheros(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
}

function slugDeFichero(fichero: string, data: Record<string, unknown>): string {
  return typeof data.slug === "string" && data.slug.trim()
    ? slugify(data.slug)
    : slugify(fichero.replace(/\.mdx?$/, ""));
}

/**
 * Metadatos de todos los artículos publicados, del más reciente al más antiguo.
 *
 * Un fichero con frontmatter incompleto no rompe el build: se avisa por consola
 * y se descarta. Perder un artículo mal escrito es mejor que tirar el despliegue
 * entero, y el aviso queda en el log del build.
 */
export const getAllPosts = cache(async (): Promise<PostMeta[]> => {
  const posts: PostMeta[] = [];

  for (const fichero of leerFicheros()) {
    const ruta = path.join(BLOG_DIR, fichero);
    const { data, content } = matter(fs.readFileSync(ruta, "utf8"));

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const description = typeof data.description === "string" ? data.description.trim() : "";

    if (!title || !description || !esFechaValida(data.date)) {
      console.warn(
        `[blog] ${fichero} ignorado: faltan "title", "description" o "date" en el frontmatter.`,
      );
      continue;
    }

    const draft = data.draft === true;
    if (draft && process.env.NODE_ENV === "production") continue;

    posts.push({
      slug: slugDeFichero(fichero, data),
      title,
      description,
      date: new Date(data.date as string | Date).toISOString(),
      updated: esFechaValida(data.updated)
        ? new Date(data.updated as string | Date).toISOString()
        : undefined,
      image: typeof data.image === "string" && data.image ? data.image : PORTADA_POR_DEFECTO,
      imageAlt: typeof data.imageAlt === "string" ? data.imageAlt : title,
      keywords: listaDeTextos(data.keywords),
      author: typeof data.author === "string" ? data.author : AUTOR_POR_DEFECTO,
      draft,
      readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
      faq: normalizarFaq(data.faq),
    });
  }

  const duplicados = posts.map((p) => p.slug).filter((slug, i, todos) => todos.indexOf(slug) !== i);
  if (duplicados.length > 0) {
    console.warn(`[blog] slugs duplicados: ${[...new Set(duplicados)].join(", ")}`);
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
});

/** Artículo completo con el markdown ya convertido a HTML. */
export const getPost = cache(async (slug: string): Promise<Post | null> => {
  for (const fichero of leerFicheros()) {
    const ruta = path.join(BLOG_DIR, fichero);
    const { data, content } = matter(fs.readFileSync(ruta, "utf8"));

    if (slugDeFichero(fichero, data) !== slug) continue;

    const meta = (await getAllPosts()).find((p) => p.slug === slug);
    if (!meta) return null;

    return {
      ...meta,
      html: await markdownToHtml(content),
      headings: extraerHeadings(content),
    };
  }

  return null;
});

/** Fecha legible en español: "12 de marzo de 2026". */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
