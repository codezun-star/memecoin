import type { Metadata } from "next";

import { PostCard } from "@/components/blog/post-card";
import { Paginacion } from "@/components/blog/paginacion";
import { Reveal } from "@/components/reveal";
import { getAllPosts, getPostsPaginados } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Blog sobre meme coins: guías, análisis e historia",
  description:
    "Guías claras sobre meme coins: cómo funcionan, cómo se leen sus métricas, de dónde salen Dogecoin, Shiba Inu, Pepe o Bonk y qué mirar antes de entrar.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog sobre meme coins · Memecoin Plaza",
    description:
      "Guías claras sobre meme coins: cómo funcionan, cómo se leen sus métricas y qué mirar antes de entrar.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default async function BlogPage() {
  // El listado se pagina; el esquema Blog sí lleva todos los artículos, para
  // que un buscador tenga la lista completa desde la primera página.
  const [{ posts: pagina1, totalPaginas }, posts] = await Promise.all([
    getPostsPaginados(1),
    getAllPosts(),
  ]);
  const [destacado, ...resto] = pagina1;

  /**
   * `Blog` + `ItemList` con todos los artículos: le da a Google la lista
   * completa desde una sola página, sin depender de que rastree cada enlace.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog de Memecoin Plaza",
    description:
      "Guías, análisis e historia de las meme coins, en español y sin recomendaciones de compra.",
    url: `${SITE_URL}/blog`,
    inLanguage: "es-ES",
    publisher: { "@type": "Organization", name: "Memecoin Plaza", url: SITE_URL },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      url: `${SITE_URL}/blog/${post.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="shell py-10 md:py-14">
        <header className="mb-10 max-w-2xl">
          <p className="eyebrow mb-2">El blog</p>
          <h1 className="font-display text-display-lg">Para entender el circo</h1>
          <p className="mt-3 text-lg text-ink-soft">
            De dónde sale cada moneda, por qué se mueve y qué mirar antes de entrar. Explicado en
            castellano, sin señales de compra y sin promesas de retorno.
          </p>
        </header>

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
                {resto.map((post, i) => (
                  <Reveal key={post.slug} delay={Math.min(i, 5) * 70}>
                    <PostCard post={post} />
                  </Reveal>
                ))}
              </div>
            )}

            <Paginacion pagina={1} totalPaginas={totalPaginas} />
          </div>
        )}
      </div>
    </>
  );
}
