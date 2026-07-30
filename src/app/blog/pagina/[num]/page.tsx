import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/blog/post-card";
import { Paginacion, rutaDePagina } from "@/components/blog/paginacion";
import { Reveal } from "@/components/reveal";
import { getAllPosts, getPostsPaginados, POSTS_POR_PAGINA } from "@/lib/blog";
import { OG_SITIO } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-config";

export async function generateStaticParams() {
  const { totalPaginas } = await getPostsPaginados(1);
  // La página 1 vive en /blog, así que aquí solo de la 2 en adelante.
  return Array.from({ length: Math.max(0, totalPaginas - 1) }, (_, i) => ({
    num: String(i + 2),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ num: string }>;
}): Promise<Metadata> {
  const { num } = await params;
  const pagina = Number(num);

  return {
    title: `Blog sobre meme coins — página ${pagina}`,
    description: `Guías y análisis sobre meme coins. Página ${pagina} del archivo del blog.`,
    // Canónica propia por página: si todas apuntaran a /blog, las de la 2 en
    // adelante quedarían fuera del índice.
    alternates: { canonical: rutaDePagina(pagina) },
    openGraph: {
      ...OG_SITIO,
      title: `Blog sobre meme coins — página ${pagina}`,
      description: "Guías y análisis sobre meme coins.",
      url: `${SITE_URL}${rutaDePagina(pagina)}`,
      type: "website",
    },
  };
}

export default async function BlogPaginaPage({ params }: { params: Promise<{ num: string }> }) {
  const { num } = await params;
  const pagina = Number(num);

  // Sin la primera comprobación, /blog/pagina/1.5 o /blog/pagina/abc llegarían
  // hasta el cálculo de índices.
  if (!Number.isInteger(pagina) || pagina < 2) notFound();

  const { posts, totalPaginas, total } = await getPostsPaginados(pagina);
  if (posts.length === 0) notFound();

  const todos = await getAllPosts();

  return (
    <div className="shell py-10 md:py-14">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow mb-2">El blog · página {pagina}</p>
        <h1 className="font-display text-display-lg">Archivo</h1>
        <p className="mt-3 text-ink-soft">
          {total} artículos publicados, de {POSTS_POR_PAGINA} en {POSTS_POR_PAGINA}. El más
          reciente es{" "}
          <a href={`/blog/${todos[0].slug}`} className="text-brand-strong hover:underline">
            {todos[0].title}
          </a>
          .
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post, i) => (
          <Reveal key={post.slug} delay={Math.min(i, 5) * 70}>
            <PostCard post={post} />
          </Reveal>
        ))}
      </div>

      <Paginacion pagina={pagina} totalPaginas={totalPaginas} />
    </div>
  );
}
