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
import rehypeStringify from "rehype-stringify";

/**
 * Blog en ficheros markdown.
 *
 * Vive entero en `content/blog/`. No toca la base de datos ni la autenticación:
 * publicar es añadir un `.md` y desplegar. Todo se resuelve en tiempo de build,
 * así que las páginas salen como HTML estático.
 *
 * El proceso de publicación está documentado en BLOG.md.
 */

export const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO 8601. Se usa tal cual en el JSON-LD y en <time dateTime>. */
  date: string;
  updated?: string;
  image?: string;
  imageAlt?: string;
  tags: string[];
  author: string;
  draft: boolean;
  readingMinutes: number;
};

export type Post = PostMeta & {
  /** HTML ya renderizado a partir del markdown. */
  html: string;
};

const AUTOR_POR_DEFECTO = "Memecoin Plaza";

function esFechaValida(valor: unknown): valor is string | Date {
  if (valor instanceof Date) return !Number.isNaN(valor.getTime());
  return typeof valor === "string" && !Number.isNaN(Date.parse(valor));
}

function normalizarTags(valor: unknown): string[] {
  const bruto = Array.isArray(valor) ? valor : typeof valor === "string" ? valor.split(",") : [];
  const limpios = bruto
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t.length > 0);
  return [...new Set(limpios)];
}

/** Convierte un tag en algo que se pueda poner en una URL: "meme coins" -> "meme-coins". */
export function tagToSlug(tag: string): string {
  return tag
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
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(file);
}

function leerFicheros(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
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

    // El slug se puede fijar en el frontmatter; si no, sale del nombre del fichero.
    const slug =
      typeof data.slug === "string" && data.slug.trim()
        ? tagToSlug(data.slug)
        : tagToSlug(fichero.replace(/\.mdx?$/, ""));

    const draft = data.draft === true;
    if (draft && process.env.NODE_ENV === "production") continue;

    posts.push({
      slug,
      title,
      description,
      date: new Date(data.date as string | Date).toISOString(),
      updated: esFechaValida(data.updated)
        ? new Date(data.updated as string | Date).toISOString()
        : undefined,
      image: typeof data.image === "string" ? data.image : undefined,
      imageAlt: typeof data.imageAlt === "string" ? data.imageAlt : undefined,
      tags: normalizarTags(data.tags),
      author: typeof data.author === "string" ? data.author : AUTOR_POR_DEFECTO,
      draft,
      readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    });
  }

  const duplicados = posts
    .map((p) => p.slug)
    .filter((slug, i, todos) => todos.indexOf(slug) !== i);
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

    const slugFichero =
      typeof data.slug === "string" && data.slug.trim()
        ? tagToSlug(data.slug)
        : tagToSlug(fichero.replace(/\.mdx?$/, ""));

    if (slugFichero !== slug) continue;

    const meta = (await getAllPosts()).find((p) => p.slug === slug);
    if (!meta) return null;

    return { ...meta, html: await markdownToHtml(content) };
  }

  return null;
});

export type TagConCuenta = { tag: string; slug: string; count: number };

/** Todos los tags en uso, del más frecuente al menos. */
export const getAllTags = cache(async (): Promise<TagConCuenta[]> => {
  const posts = await getAllPosts();
  const cuentas = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      cuentas.set(tag, (cuentas.get(tag) ?? 0) + 1);
    }
  }

  return [...cuentas.entries()]
    .map(([tag, count]) => ({ tag, slug: tagToSlug(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
});

export const getPostsByTag = cache(async (tagSlug: string): Promise<PostMeta[]> => {
  const posts = await getAllPosts();
  return posts.filter((post) => post.tags.some((t) => tagToSlug(t) === tagSlug));
});

/** Fecha legible en español: "12 de marzo de 2026". */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
