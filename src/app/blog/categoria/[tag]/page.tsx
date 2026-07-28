import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PostCard } from "@/components/blog/post-card";
import { TagPill } from "@/components/blog/tag-pill";
import { getAllTags, getPostsByTag } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-config";

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ slug }) => ({ tag: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const encontrado = (await getAllTags()).find((t) => t.slug === tag);
  if (!encontrado) return { title: "Categoría no encontrada" };

  const titulo = `Artículos sobre ${encontrado.tag}`;
  const descripcion = `Todo lo que hemos escrito sobre ${encontrado.tag}: ${encontrado.count} ${
    encontrado.count === 1 ? "artículo" : "artículos"
  }.`;

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/blog/categoria/${encontrado.slug}` },
    openGraph: {
      title: `${titulo} · Memecoin Plaza`,
      description: descripcion,
      url: `${SITE_URL}/blog/categoria/${encontrado.slug}`,
      type: "website",
    },
  };
}

export default async function CategoriaPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;

  const [todos, posts] = await Promise.all([getAllTags(), getPostsByTag(tag)]);
  const actual = todos.find((t) => t.slug === tag);

  if (!actual || posts.length === 0) notFound();

  return (
    <div className="shell py-10 md:py-14">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Todos los artículos
      </Link>

      <header className="mb-8 mt-4 max-w-2xl">
        <p className="eyebrow mb-2">Categoría</p>
        <h1 className="font-display text-display-lg capitalize">{actual.tag}</h1>
        <p className="mt-2 text-ink-soft">
          {posts.length} {posts.length === 1 ? "artículo" : "artículos"}
        </p>
      </header>

      <nav aria-label="Categorías" className="mb-8 flex flex-wrap gap-2">
        {todos.map(({ tag: nombre, slug, count }) => (
          <TagPill key={nombre} tag={nombre} count={count} activo={slug === tag} />
        ))}
      </nav>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
