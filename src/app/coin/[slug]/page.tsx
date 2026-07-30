import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, List } from "lucide-react";

import { CoinLogo } from "@/components/coin-logo";
import { CommentThread } from "@/components/comments/comment-thread";
import { Reveal } from "@/components/reveal";
import { LiveMarketsProvider } from "@/components/live-markets-provider";
import {
  LiveCoinHeader,
  LivePriceChart,
  LiveStatGrid,
  RangeChangeBadge,
} from "@/components/coin-live";
import type { ChartPoint } from "@/components/price-chart";
import { getCoinContent, monedasRelacionadas } from "@/lib/coin-content";
import { getMarkets, getMarketChart } from "@/lib/coingecko";
import { TRACKED_COINS, getCoinBySlug } from "@/lib/coins";
import { OG_SITIO } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const revalidate = 60;

const RANGES = [
  { days: 1, label: "24 h" },
  { days: 7, label: "7 d" },
  { days: 30, label: "30 d" },
  { days: 90, label: "90 d" },
  { days: 365, label: "1 a" },
] as const;

const DEFAULT_DAYS = 7;

export function generateStaticParams() {
  return TRACKED_COINS.map((coin) => ({ slug: coin.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const coin = getCoinBySlug(slug);
  if (!coin) return { title: "Moneda no encontrada" };

  const ficha = await getCoinContent(coin.id);

  /**
   * El título de la ficha manda sobre el genérico.
   *
   * «Shiba Inu (SHIB)» no compite por nada: nadie busca eso. El de la ficha
   * lleva la pregunta con la que la gente llega —qué es, cuántas hay, cómo
   * funciona— que es donde está el tráfico de verdad.
   */
  const title = ficha?.seoTitle ?? `${coin.name} (${coin.symbol}): precio en tiempo real y debate`;
  const description =
    ficha?.seoDescription ??
    `Precio de ${coin.name} (${coin.symbol}) en tiempo real, capitalización, volumen y debate de la comunidad en español.`;

  return {
    /**
     * `absolute` para saltarse el sufijo « · Memecoin Plaza» de la plantilla.
     *
     * Son diecisiete caracteres, y un buscador corta el título alrededor de los
     * sesenta. En un sitio que todavía no tiene marca reconocible, ese espacio
     * rinde mucho más lleno de las palabras por las que la gente busca que
     * repitiendo un nombre que nadie conoce.
     */
    title: { absolute: title },
    description,
    alternates: { canonical: `/coin/${coin.slug}` },
    keywords:
      ficha?.keywords.length
        ? ficha.keywords
        : [
            `${coin.name.toLowerCase()} precio`,
            `qué es ${coin.name.toLowerCase()}`,
            `${coin.symbol.toLowerCase()} en tiempo real`,
          ],
    openGraph: {
      ...OG_SITIO,
      title,
      description,
      url: `${SITE_URL}/coin/${coin.slug}`,
      type: "article",
      ...(ficha?.actualizado ? { modifiedTime: ficha.actualizado } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const [{ slug }, { range }] = await Promise.all([params, searchParams]);

  const coin = getCoinBySlug(slug);
  if (!coin) notFound();

  const parsedDays = Number(range);
  const days = RANGES.some((r) => r.days === parsedDays) ? parsedDays : DEFAULT_DAYS;
  const etiquetaRango = RANGES.find((r) => r.days === days)?.label ?? "el periodo";

  // Se piden los mercados de todas las monedas, no solo esta: es la misma
  // llamada que sirve /api/markets, así que comparten cache y el sondeo en vivo
  // arranca ya con datos.
  const [markets, chart, ficha] = await Promise.all([
    getMarkets(),
    getMarketChart(coin.id, days),
    getCoinContent(coin.id),
  ]);

  const points: ChartPoint[] = (chart?.prices ?? []).map(([t, p]) => ({ t, p }));
  const url = `${SITE_URL}/coin/${coin.slug}`;
  const relacionadas = monedasRelacionadas(coin);

  // Logos de las relacionadas. Se sacan de los mercados que ya se han pedido
  // arriba, así que no cuesta ninguna llamada extra. Si el proveedor no responde,
  // cada tarjeta cae sola a su monograma de color.
  const logos: Record<string, string> = {};
  for (const market of markets ?? []) {
    if (market.image) logos[market.id] = market.image;
  }
  const indice = ficha?.headings.filter((h) => h.level === 2) ?? [];

  /**
   * Dos esquemas, cada uno con un trabajo distinto.
   *
   * `BreadcrumbList` pinta la ruta «Inicio › Monedas › Dogecoin» bajo el
   * resultado en el buscador. `FAQPage` describe las preguntas de forma que un
   * buscador —o un asistente— pueda extraer la respuesta directamente.
   *
   * No se marca la moneda como producto ni se declara su precio en el esquema:
   * el dato cambia cada veinte segundos y publicar un precio en el marcado que
   * no coincide con el de la página es justo lo que penaliza un buscador.
   */
  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: `${coin.name} (${coin.symbol})`, item: url },
      ],
    },
  ];

  if (ficha) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: ficha.seoTitle,
      description: ficha.seoDescription,
      url,
      inLanguage: "es-ES",
      ...(ficha.actualizado ? { dateModified: ficha.actualizado } : {}),
      isPartOf: { "@type": "WebSite", name: "Memecoin Plaza", url: SITE_URL },
      about: { "@type": "Thing", name: coin.name, alternateName: coin.symbol },
      publisher: {
        "@type": "Organization",
        name: "Memecoin Plaza",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png` },
      },
    });

    if (ficha.faq.length > 0) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: ficha.faq.map((item) => ({
          "@type": "Question",
          name: item.pregunta,
          acceptedAnswer: { "@type": "Answer", text: item.respuesta },
        })),
      });
    }
  }

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

      <LiveMarketsProvider initialMarkets={markets}>
        <div
          // Todo lo de dentro se tiñe con el color de la moneda leyendo estas variables.
          style={{
            ["--coin-accent" as string]: coin.accent,
            ["--coin-accent-ink" as string]: coin.accentInk,
          }}
          className="shell space-y-6 py-8 md:py-12"
        >
          {/* Migas visibles, además del esquema: ayudan al lector y al rastreo. */}
          <nav aria-label="Ruta" className="flex items-center gap-2 text-sm text-ink-faint">
            <Link href="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-ink">
              <ArrowLeft className="size-4" aria-hidden />
              Mercado
            </Link>
            <span aria-hidden>›</span>
            <span className="text-ink-soft">{coin.name}</span>
          </nav>

          <LiveCoinHeader coin={coin} />

          <section className="surface-card relative overflow-hidden p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-display-md">Precio</h2>
                <RangeChangeBadge
                  points={points}
                  coin={coin}
                  days={days}
                  etiqueta={etiquetaRango}
                />
              </div>

              <nav aria-label="Rango temporal" className="flex flex-wrap gap-1 rounded-full bg-sunken p-1">
                {RANGES.map((r) => (
                  <Link
                    key={r.days}
                    href={`/coin/${coin.slug}?range=${r.days}`}
                    scroll={false}
                    aria-current={r.days === days ? "true" : undefined}
                    className={cn(
                      "rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
                      r.days === days
                        ? "bg-surface font-semibold text-ink shadow-soft"
                        : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {r.label}
                  </Link>
                ))}
              </nav>
            </div>

            <LivePriceChart coin={coin} points={points} days={days} />
          </section>

          <Reveal>
            <LiveStatGrid coin={coin} />
          </Reveal>

          {ficha ? (
            <Reveal as="section" className="surface-card p-5 md:p-8">
              <h2 className="font-display text-display-md">
                {coin.name}: qué es y cómo funciona
              </h2>
              {ficha.resumen && (
                <p className="mt-3 max-w-2xl text-lg text-ink-soft">{ficha.resumen}</p>
              )}

              {indice.length >= 3 && (
                <nav
                  aria-label={`Contenido sobre ${coin.name}`}
                  className="surface-sunken my-7 max-w-md p-5"
                >
                  <p className="mb-3 inline-flex items-center gap-2 font-display font-bold text-ink">
                    <List className="size-4" aria-hidden />
                    En esta página
                  </p>
                  <ol className="space-y-1.5 text-sm">
                    {indice.map((h, i) => (
                      <li key={h.id} className="flex gap-2">
                        <span className="tabular text-ink-faint">{i + 1}.</span>
                        <a
                          href={`#${h.id}`}
                          className="text-ink-soft hover:text-brand-strong hover:underline"
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              {/* El HTML sale de markdown de este mismo repositorio (ver src/lib/coin-content.ts). */}
              <div
                className="prose prose-plaza mt-6"
                dangerouslySetInnerHTML={{ __html: ficha.html }}
              />
            </Reveal>
          ) : (
            <Reveal as="section" className="surface-card p-5 md:p-6">
              <h2 className="font-display text-display-md">Sobre {coin.name}</h2>
              <p className="mt-2 max-w-2xl text-ink-soft">{coin.blurb}</p>
            </Reveal>
          )}

          {ficha && ficha.faq.length > 0 && (
            <Reveal as="section" className="surface-card p-5 md:p-8">
              <h2 className="font-display text-display-md">
                Preguntas frecuentes sobre {coin.name}
              </h2>
              <div className="mt-6 space-y-3">
                {ficha.faq.map((item) => (
                  <details key={item.pregunta} className="surface-sunken group p-5">
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

          {/*
            Enlaces a otras fichas.

            No es relleno: reparte autoridad interna y le da al rastreador un
            camino hacia las monedas que nadie visita, que de otro modo solo
            cuelgan del listado de la portada.
          */}
          <Reveal as="section" className="surface-card p-5 md:p-6">
            <h2 className="font-display text-lg font-bold">Otras meme coins</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relacionadas.map((otra) => (
                <li key={otra.id}>
                  <Link
                    href={`/coin/${otra.slug}`}
                    className="flex items-center gap-3 rounded-card border border-line p-3 transition-colors hover:border-line-strong hover:bg-sunken"
                  >
                    <CoinLogo coin={otra} src={logos[otra.id]} size="md" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {otra.name}
                      </span>
                      <span className="block font-mono text-xs uppercase text-ink-faint">
                        {otra.symbol}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Suspense fallback={<ThreadSkeleton />}>
            <CommentThread
              target={{ kind: "coin", id: coin.id }}
              titulo={`Debate sobre ${coin.name}`}
              vacio={`Nadie ha dicho nada todavía sobre ${coin.name}. Sé el primero.`}
            />
          </Suspense>
        </div>
      </LiveMarketsProvider>
    </>
  );
}

function ThreadSkeleton() {
  return (
    <div className="surface-card space-y-4 p-5 md:p-6">
      <div className="skeleton h-7 w-40" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-16 w-full" />
    </div>
  );
}
