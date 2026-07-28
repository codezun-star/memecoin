import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

import matter from "gray-matter";
import readingTime from "reading-time";

import {
  extraerHeadings,
  listaDeTextos,
  markdownToHtml,
  normalizarFaq,
  slugify,
  type FaqItem,
  type Heading,
} from "@/lib/markdown";

export { slugify } from "@/lib/markdown";
export type { FaqItem, Heading } from "@/lib/markdown";

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

/** Artículos por página en el listado. */
export const POSTS_POR_PAGINA = 9;

export type Paginacion = {
  posts: PostMeta[];
  pagina: number;
  totalPaginas: number;
  total: number;
};

/**
 * Trocea el listado. La página 1 lleva uno más porque el primero se pinta
 * destacado a ancho completo y dejaría la rejilla coja si no.
 */
export async function getPostsPaginados(pagina: number): Promise<Paginacion> {
  const todos = await getAllPosts();
  const total = todos.length;

  // En la primera página el destacado va aparte, así que caben POSTS_POR_PAGINA
  // en la rejilla más el destacado.
  const enPrimera = POSTS_POR_PAGINA + 1;
  const totalPaginas = Math.max(1, 1 + Math.ceil(Math.max(0, total - enPrimera) / POSTS_POR_PAGINA));

  const desde = pagina === 1 ? 0 : enPrimera + (pagina - 2) * POSTS_POR_PAGINA;
  const hasta = pagina === 1 ? enPrimera : desde + POSTS_POR_PAGINA;

  return { posts: todos.slice(desde, hasta), pagina, totalPaginas, total };
}

/** Fecha legible en español: "12 de marzo de 2026". */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
