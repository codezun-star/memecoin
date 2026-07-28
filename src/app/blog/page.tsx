import type { Metadata } from "next";

import { PostCard } from "@/components/blog/post-card";
import { TagPill } from "@/components/blog/tag-pill";
import { getAllPosts, getAllTags } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Análisis, historia y contexto de las meme coins: de dónde salen, por qué se mueven y qué dice la comunidad.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog · Memecoin Plaza",
    description: "Análisis, historia y contexto de las meme coins.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default async function BlogPage() {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);

  const [destacado, ...resto] = posts;

  return (
    <div className="shell py-10 md:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow mb-2">El blog</p>
        <h1 className="font-display text-display-lg">Para entender el circo</h1>
        <p className="mt-3 text-lg text-ink-soft">
          De dónde sale cada moneda, por qué se mueve y qué está pasando en su comunidad. Sin
          señales de compra ni promesas de retorno.
        </p>
      </header>

      {tags.length > 0 && (
        <nav aria-label="Categorías" className="mb-8 flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <TagPill key={tag} tag={tag} count={count} />
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <p className="surface-card p-10 text-center text-ink-faint">
          Todavía no hay artículos publicados. Vuelve pronto.
        </p>
      ) : (
        <div className="space-y-6">
          {/* El más reciente ocupa el ancho completo: da un punto de entrada claro. */}
          <PostCard post={destacado} destacado />

          {resto.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {resto.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
