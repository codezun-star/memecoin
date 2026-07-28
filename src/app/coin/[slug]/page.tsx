import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
import { getMarkets, getMarketChart } from "@/lib/coingecko";
import { TRACKED_COINS, getCoinBySlug } from "@/lib/coins";
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

  return {
    title: `${coin.name} (${coin.symbol})`,
    description: `Precio en tiempo real, capitalización y debate de la comunidad sobre ${coin.name}.`,
    alternates: { canonical: `/coin/${coin.slug}` },
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
  const [markets, chart] = await Promise.all([getMarkets(), getMarketChart(coin.id, days)]);

  const points: ChartPoint[] = (chart?.prices ?? []).map(([t, p]) => ({ t, p }));

  return (
    <LiveMarketsProvider initialMarkets={markets}>
      <div
        // Todo lo de dentro se tiñe con el color de la moneda leyendo estas variables.
        style={{
          ["--coin-accent" as string]: coin.accent,
          ["--coin-accent-ink" as string]: coin.accentInk,
        }}
        className="shell space-y-6 py-8 md:py-12"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al mercado
        </Link>

        <LiveCoinHeader coin={coin} />

        <section className="surface-card relative overflow-hidden p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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

        <Reveal as="section" className="surface-card p-5 md:p-6">
          <h2 className="font-display text-display-md">Sobre {coin.name}</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">{coin.blurb}</p>
        </Reveal>

        <Suspense fallback={<ThreadSkeleton />}>
          <CommentThread
            target={{ kind: "coin", id: coin.id }}
            vacio={`Nadie ha dicho nada todavía sobre ${coin.name}. Sé el primero.`}
          />
        </Suspense>
      </div>
    </LiveMarketsProvider>
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
