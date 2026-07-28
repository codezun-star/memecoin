import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";

import { PostCard } from "@/components/blog/post-card";
import { TagPill } from "@/components/blog/tag-pill";
import { formatPostDate, getAllPosts, getPost } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-config";

/** Pre-renderiza cada artículo como HTML estático en el build. */
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Artículo no encontrado" };

  const url = `${SITE_URL}/blog/${post.slug}`;
  // Sin imagen propia se hereda la tarjeta general del sitio, que ya existe.
  const imagenes = post.image ? [{ url: post.image, alt: post.imageAlt ?? post.title }] : undefined;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      tags: post.tags,
      images: imagenes,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function ArticuloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const todos = await getAllPosts();
  // Relacionados por tag compartido; si no hay, los más recientes.
  const relacionados = todos
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => {
      const comunes = (p: typeof a) => p.tags.filter((t) => post.tags.includes(t)).length;
      return comunes(b) - comunes(a);
    })
    .slice(0, 3);

  const url = `${SITE_URL}/blog/${post.slug}`;

  /**
   * JSON-LD de tipo BlogPosting: es lo que lee Google para los resultados
   * enriquecidos (fecha, autor, imagen).
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    inLanguage: "es-ES",
    keywords: post.tags.join(", "),
    wordCount: post.readingMinutes * 200,
    author: { "@type": "Organization", name: post.author, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Memecoin Plaza",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(post.image ? { image: [new URL(post.image, SITE_URL).toString()] } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // El objeto lo construimos nosotros a partir de ficheros del repositorio,
        // no de entrada de terceros.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="shell py-10 md:py-14">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al blog
        </Link>

        <article className="mx-auto mt-6 max-w-3xl">
          <header className="mb-8">
            {post.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <TagPill key={tag} tag={tag} />
                ))}
              </div>
            )}

            <h1 className="font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight text-ink md:text-display-lg">
              {post.title}
            </h1>

            <p className="mt-4 text-lg text-ink-soft">{post.description}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 text-sm text-ink-faint">
              <span>{post.author}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden />
                {post.readingMinutes} min de lectura
              </span>
              {post.updated && (
                <span className="text-ink-faint">
                  (actualizado el {formatPostDate(post.updated)})
                </span>
              )}
            </div>
          </header>

          {post.image && (
            <Image
              src={post.image}
              alt={post.imageAlt ?? ""}
              width={1200}
              height={630}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="mb-10 w-full rounded-card border border-line object-cover shadow-soft"
            />
          )}

          {/* El HTML sale de markdown de este mismo repositorio (ver src/lib/blog.ts). */}
          <div
            className="prose prose-plaza"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>

        {relacionados.length > 0 && (
          <section className="mt-16 border-t border-line pt-10">
            <h2 className="mb-6 font-display text-display-md">Sigue leyendo</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relacionados.map((otro) => (
                <PostCard key={otro.slug} post={otro} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
