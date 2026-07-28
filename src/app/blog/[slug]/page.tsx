import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, List } from "lucide-react";

import { PostCard } from "@/components/blog/post-card";
import { Reveal } from "@/components/reveal";
import { CommentThread } from "@/components/comments/comment-thread";
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

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.keywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      images: [{ url: post.image, alt: post.imageAlt, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  };
}

export default async function ArticuloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const todos = await getAllPosts();
  const relacionados = todos.filter((p) => p.slug !== post.slug).slice(0, 3);

  const url = `${SITE_URL}/blog/${post.slug}`;
  const imagenAbsoluta = new URL(post.image, SITE_URL).toString();

  /**
   * Tres esquemas por artículo, cada uno con un trabajo distinto:
   *
   * - `BlogPosting` da fecha, autor e imagen en el resultado de búsqueda.
   * - `BreadcrumbList` pinta la ruta "Inicio › Blog › Artículo" bajo el titular.
   * - `FAQPage` es el que puede desplegar las preguntas directamente en Google.
   */
  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      inLanguage: "es-ES",
      keywords: post.keywords.join(", "),
      wordCount: post.readingMinutes * 200,
      timeRequired: `PT${post.readingMinutes}M`,
      image: [imagenAbsoluta],
      author: { "@type": "Organization", name: post.author, url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "Memecoin Plaza",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];

  if (post.faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map((item) => ({
        "@type": "Question",
        name: item.pregunta,
        acceptedAnswer: { "@type": "Answer", text: item.respuesta },
      })),
    });
  }

  const indice = post.headings.filter((h) => h.level === 2);

  return (
    <>
      {jsonLd.map((esquema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Construido por nosotros a partir de ficheros del repositorio.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(esquema) }}
        />
      ))}

      <div className="shell py-10 md:py-14">
        {/* Migas visibles, además del esquema: ayudan al lector y al rastreo. */}
        <nav aria-label="Ruta" className="mb-6 flex items-center gap-2 text-sm text-ink-faint">
          <Link href="/" className="transition-colors hover:text-ink">
            Inicio
          </Link>
          <span aria-hidden>›</span>
          <Link href="/blog" className="transition-colors hover:text-ink">
            Blog
          </Link>
        </nav>

        <article className="mx-auto max-w-3xl">
          <header className="mb-8">
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
              {post.updated && <span>(actualizado el {formatPostDate(post.updated)})</span>}
            </div>
          </header>

          <Image
            src={post.image}
            alt={post.imageAlt}
            width={1200}
            height={630}
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="mb-10 w-full rounded-card border border-line object-cover shadow-soft"
          />

          {indice.length >= 3 && (
            <nav
              aria-label="Contenido del artículo"
              className="surface-sunken mb-10 p-5"
            >
              <p className="mb-3 inline-flex items-center gap-2 font-display font-bold text-ink">
                <List className="size-4" aria-hidden />
                En este artículo
              </p>
              <ol className="space-y-1.5 text-sm">
                {indice.map((h, i) => (
                  <li key={h.id} className="flex gap-2">
                    <span className="tabular text-ink-faint">{i + 1}.</span>
                    <a href={`#${h.id}`} className="text-ink-soft hover:text-brand-strong hover:underline">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* El HTML sale de markdown de este mismo repositorio (ver src/lib/blog.ts). */}
          <div className="prose prose-plaza" dangerouslySetInnerHTML={{ __html: post.html }} />

          {post.faq.length > 0 && (
            <Reveal as="section" className="mt-14 border-t border-line pt-10">
              <h2 className="font-display text-display-md">Preguntas frecuentes</h2>
              <div className="mt-6 space-y-3">
                {post.faq.map((item) => (
                  <details key={item.pregunta} className="surface-card group p-5">
                    <summary className="cursor-pointer list-none font-display font-bold text-ink marker:content-none">
                      <span className="inline-flex w-full items-center justify-between gap-4">
                        {item.pregunta}
                        <span
                          aria-hidden
                          className="shrink-0 text-brand-strong transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="mt-3 leading-relaxed text-ink-soft">{item.respuesta}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          )}
        </article>

        {relacionados.length > 0 && (
          <section className="mt-16 border-t border-line pt-10">
            <h2 className="mb-6 font-display text-display-md">Sigue leyendo</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relacionados.map((otro, i) => (
                <Reveal key={otro.slug} delay={i * 80}>
                  <PostCard post={otro} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <div className="mx-auto mt-16 max-w-3xl">
          <Suspense fallback={<div className="skeleton h-40 w-full" />}>
            <CommentThread
              target={{ kind: "post", id: post.slug }}
              titulo="Comentarios"
              vacio="Todavía no hay comentarios en este artículo. Abre tú el debate."
            />
          </Suspense>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-ink-faint transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Volver al blog
          </Link>
        </div>
      </div>
    </>
  );
}
