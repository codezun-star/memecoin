import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Flame, MessagesSquare, TrendingUp } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { LiveCoinGrid } from "@/components/live-coin-grid";
import { Reveal } from "@/components/reveal";
import { LiveMarketsProvider } from "@/components/live-markets-provider";
import { Button } from "@/components/ui/button";
import { getMarkets } from "@/lib/coingecko";
import { getCommentCounts } from "@/lib/comments";
import { TRACKED_COINS } from "@/lib/coins";
import { getAllPosts } from "@/lib/blog";
import { FAQ_INICIO } from "@/lib/faq-inicio";
import {
  listaDeElementos,
  organizacion,
  OG_SITIO,
  preguntasFrecuentes,
  sitioWeb,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site-config";

// El primer pintado se sirve cacheado hasta un minuto; a partir de ahí el
// cliente mantiene los precios frescos por su cuenta.
export const revalidate = 60;

const DESCRIPCION =
  `Precios en tiempo real de las ${TRACKED_COINS.length} meme coins más importantes y un foro en español ` +
  "para debatir cada una: Dogecoin, Shiba Inu, Pepe, Bonk y muchas más.";

export const metadata: Metadata = {
  title: "Precios de meme coins en tiempo real y foro en español",
  description: DESCRIPCION,
  alternates: { canonical: "/" },
  keywords: [
    "meme coins",
    "precio meme coins en tiempo real",
    "dogecoin precio hoy",
    "shiba inu precio",
    "mejores meme coins",
    "foro criptomonedas en español",
    "qué es una meme coin",
  ],
  openGraph: {
    ...OG_SITIO,
    title: "Memecoin Plaza: precios de meme coins en tiempo real y foro",
    description: DESCRIPCION,
    url: `${SITE_URL}/`,
    type: "website",
  },
};

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <>
      <JsonLd
        esquemas={[
          organizacion(DESCRIPCION),
          sitioWeb(DESCRIPCION),
          listaDeElementos(
            "Meme coins que seguimos",
            TRACKED_COINS.map((coin) => ({
              nombre: `${coin.name} (${coin.symbol})`,
              ruta: `/coin/${coin.slug}`,
            })),
          ),
          preguntasFrecuentes(FAQ_INICIO),
        ]}
      />

      <Hero />

      <section id="mercado" className="shell pb-4 pt-12 md:pt-16">
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">El parqué</p>
            <h2 className="font-display text-display-md">
              Las {TRACKED_COINS.length} que importan
            </h2>
          </div>
          <p className="text-sm text-ink-faint">Los precios se actualizan solos cada 20 segundos</p>
        </Reveal>

        <Suspense fallback={<CoinGridSkeleton />}>
          <CoinGrid />
        </Suspense>
      </section>

      <ValueProps />
      <QueSonLasMemeCoins />
      <Faq />
      <UltimosArticulos posts={posts.slice(0, 3)} />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* Manchas de color de las cuatro monedas, muy difusas: dan la identidad
          cromática del producto sin competir con el texto. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-0 size-72 rounded-full bg-shiba/25 blur-[100px]" />
        <div className="absolute left-1/3 -top-16 size-72 rounded-full bg-doge/20 blur-[100px]" />
        <div className="absolute right-1/4 top-10 size-64 rounded-full bg-pepe/20 blur-[100px]" />
        <div className="absolute -right-16 -top-8 size-72 rounded-full bg-bonk/20 blur-[100px]" />
      </div>

      <div className="shell relative py-16 md:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/70 px-3 py-1 text-xs text-ink-soft backdrop-blur">
          <Flame className="size-3.5 text-brand-strong" aria-hidden />
          Precios en vivo + foro de la comunidad
        </span>

        {/* `text-balance` + el nowrap del gradiente evitan que "meme coins" se
            parta en dos líneas al crecer el titular. */}
        <h1 className="mt-5 max-w-4xl text-balance font-display text-[2.5rem] font-extrabold leading-[1.02] tracking-tight md:text-display-xl">
          Los precios de las <span className="whitespace-nowrap text-hype">meme coins</span>
          <br className="hidden sm:block" /> y la gente que las defiende.
        </h1>

        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Las {TRACKED_COINS.length} meme coins que mueven el mercado, en una sola pantalla. Mira el
          gráfico, lee lo que dice la comunidad y suelta tu tesis.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#mercado">
            <Button size="lg">Ver el mercado</Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Únete al debate
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

async function CoinGrid() {
  // Precios y contadores de comentarios en paralelo: son fuentes independientes.
  const [markets, commentCounts] = await Promise.all([getMarkets(), getCommentCounts()]);

  // A partir de aquí manda el cliente: sondea y mantiene los precios al día sin
  // recargar la página.
  return (
    <LiveMarketsProvider initialMarkets={markets}>
      <LiveCoinGrid commentCounts={commentCounts} />
    </LiveMarketsProvider>
  );
}

function CoinGridSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {TRACKED_COINS.map((coin) => (
        <div key={coin.id} className="surface-card space-y-4 p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="skeleton size-11 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-3 w-12" />
            </div>
          </div>
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

function ValueProps() {
  const items = [
    {
      icon: TrendingUp,
      title: "Datos, no humo",
      body: "Precio, capitalización, volumen y gráfico de cada moneda, al día y sin recargar.",
    },
    {
      icon: MessagesSquare,
      title: "Un hilo por moneda",
      body: "Comenta, responde y da like. Sin algoritmo raro: lo más nuevo arriba y punto.",
    },
    {
      icon: Flame,
      title: "Comunidad, no gurús",
      body: "Aquí nadie te vende una señal. Es un foro de gente discutiendo sobre perros y ranas.",
    },
  ];

  return (
    <section className="shell pt-16">
      <div className="grid gap-5 md:grid-cols-3">
        {items.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 90} className="surface-card p-6">
            <span className="mb-4 grid size-10 place-items-center rounded-full bg-hype-soft text-brand-strong">
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="font-display text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/**
 * El texto que explica de qué va todo esto.
 *
 * Está aquí abajo y no arriba a propósito: quien entra buscando un precio
 * quiere el precio, no una lección. Pero quien llega desde una búsqueda del
 * tipo «qué es una meme coin» necesita encontrar una respuesta de verdad en
 * esta página, no una rejilla de tarjetas y nada más.
 */
function QueSonLasMemeCoins() {
  return (
    <Reveal as="section" className="shell pt-16">
      <div className="surface-card p-6 md:p-10">
        <div className="max-w-3xl">
          <p className="eyebrow mb-2">Para empezar</p>
          <h2 className="font-display text-display-md">Qué es una meme coin</h2>

          <div className="mt-5 space-y-4 text-ink-soft">
            <p>
              Una meme coin es una criptomoneda cuyo valor no viene de un producto, unos ingresos ni
              una tecnología propia, sino de <strong className="text-ink">la comunidad y la
              cultura</strong> que se forma a su alrededor. La primera fue{" "}
              <Link href="/coin/dogecoin" className="text-brand-strong hover:underline">
                Dogecoin
              </Link>
              , en 2013, y nació literalmente como una parodia del entusiasmo que rodeaba a Bitcoin.
            </p>
            <p>
              Técnicamente, la mayoría no tienen nada especial: son tokens estándar sobre redes ya
              existentes como Ethereum, Solana o Base, y crear uno cuesta unos céntimos y unos
              minutos. Lo que las diferencia entre sí no es el código, sino cuánta gente decide que
              esa concreta les importa.
            </p>
            <p>
              Eso hace que se comporten de una forma muy distinta al resto del mercado. Suben más
              rápido y caen más rápido; responden a menciones en redes sociales más que a noticias
              del sector; y su recorrido depende de una comunidad que puede disolverse tan rápido
              como se formó.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 border-t border-line pt-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-lg font-bold">Cómo leer una capitalización</h3>
            <p className="mt-2 text-sm text-ink-soft">
              El precio unitario no dice nada por sí solo, porque depende de cuántas unidades
              existan. Una moneda a 0,00002 $ con billones de unidades puede valer más en total que
              otra a 5 $. Lo comparable siempre es la capitalización: precio por suministro
              circulante.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Por qué importa el volumen</h3>
            <p className="mt-2 text-sm text-ink-soft">
              El volumen de 24 horas mide cuánto se ha movido de verdad. Un precio que aguanta con
              el volumen desplomado se sostiene sobre muy pocas operaciones, y eso significa que
              entrar o salir de una posición grande moverá el precio más de lo que esperas.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Compras y ventas en directo</h3>
            <p className="mt-2 text-sm text-ink-soft">
              En{" "}
              <Link href="/operaciones" className="text-brand-strong hover:underline">
                operaciones en vivo
              </Link>{" "}
              puedes ver cada compra y cada venta según se cruzan en el mercado, con la presión
              compradora y vendedora del momento. Es la forma más directa de comprobar si hay
              actividad real detrás de un precio.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-8">
          <Link href="/blog">
            <Button variant="secondary">Leer las guías del blog</Button>
          </Link>
          <Link href="/operaciones">
            <Button variant="secondary">
              <Activity className="size-4" aria-hidden />
              Ver operaciones en vivo
            </Button>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

function Faq() {
  return (
    <Reveal as="section" className="shell pt-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-display-md">Preguntas frecuentes</h2>
        <div className="mt-6 space-y-3">
          {FAQ_INICIO.map((item) => (
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
      </div>
    </Reveal>
  );
}

function UltimosArticulos({
  posts,
}: {
  posts: { slug: string; title: string; description: string }[];
}) {
  if (posts.length === 0) return null;

  return (
    <Reveal as="section" className="shell py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-display-md">Últimas guías</h2>
        <Link href="/blog" className="text-sm text-ink-faint transition-colors hover:text-ink">
          Ver todas →
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="surface-card p-5 transition-colors hover:border-line-strong"
          >
            <h3 className="font-display text-lg font-bold leading-snug text-ink">{post.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{post.description}</p>
          </Link>
        ))}
      </div>
    </Reveal>
  );
}
