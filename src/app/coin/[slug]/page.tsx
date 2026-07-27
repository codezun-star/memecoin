import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ChangeBadge } from "@/components/change-badge";
import { CoinLogo } from "@/components/coin-logo";
import { CommentThread } from "@/components/comments/comment-thread";
import { PriceChart, type ChartPoint } from "@/components/price-chart";
import { getMarket, getMarketChart } from "@/lib/coingecko";
import { TRACKED_COINS, getCoinBySlug, type TrackedCoin } from "@/lib/coins";
import { formatCompact, formatNumber, formatPrice } from "@/lib/format";
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
    description: `Precio, capitalización y debate de la comunidad sobre ${coin.name}.`,
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

  const [market, chart] = await Promise.all([getMarket(coin.id), getMarketChart(coin.id, days)]);

  const points: ChartPoint[] = (chart?.prices ?? []).map(([t, p]) => ({ t, p }));

  return (
    <div
      // Todo lo de dentro se tiñe con el color de la moneda leyendo esta variable.
      style={{
        ["--coin-accent" as string]: coin.accent,
        ["--coin-accent-soft" as string]: coin.accentSoft,
      }}
      className="shell space-y-6 py-8 md:py-12"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-dust transition-colors hover:text-cream"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al mercado
      </Link>

      <CoinHeader coin={coin} market={market} />

      <section className="surface relative overflow-hidden p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-display-md">Precio</h2>
          <nav aria-label="Rango temporal" className="flex flex-wrap gap-1">
            {RANGES.map((r) => (
              <Link
                key={r.days}
                href={`/coin/${coin.slug}?range=${r.days}`}
                scroll={false}
                aria-current={r.days === days ? "true" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
                  r.days === days
                    ? "bg-[color:var(--coin-accent)] font-semibold text-ink-950"
                    : "text-sand hover:bg-white/[0.06] hover:text-cream",
                )}
              >
                {r.label}
              </Link>
            ))}
          </nav>
        </div>

        <PriceChart data={points} accent={coin.accent} days={days} />
      </section>

      <StatGrid market={market} />

      <section className="surface p-5 md:p-6">
        <h2 className="font-display text-display-md">Sobre {coin.name}</h2>
        <p className="mt-2 max-w-2xl text-sand">{coin.blurb}</p>
      </section>

      <Suspense fallback={<ThreadSkeleton />}>
        <CommentThread coin={coin} />
      </Suspense>
    </div>
  );
}

function CoinHeader({
  coin,
  market,
}: {
  coin: TrackedCoin;
  market: Awaited<ReturnType<typeof getMarket>>;
}) {
  return (
    <header className="surface relative overflow-hidden p-5 md:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full opacity-25 blur-[90px]"
        style={{ background: coin.accent }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <CoinLogo coin={coin} src={market?.image} size="lg" />
          <div>
            <p className="eyebrow" style={{ color: coin.accent }}>
              {coin.tagline}
            </p>
            <h1 className="font-display text-display-lg leading-none">{coin.name}</h1>
            <p className="mt-1 font-mono text-sm uppercase tracking-widest text-dust">
              {coin.symbol}
              {market?.market_cap_rank ? ` · #${market.market_cap_rank} por capitalización` : ""}
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="tabular text-[2rem] font-bold leading-none tracking-tight text-cream">
            {formatPrice(market?.current_price)}
          </p>
          <div className="mt-2 flex items-center gap-2 sm:justify-end">
            <ChangeBadge value={market?.price_change_percentage_24h} />
            <span className="text-xs text-dust">últimas 24 h</span>
          </div>
        </div>
      </div>

      {!market && (
        <p role="status" className="relative mt-4 text-sm text-doge">
          CoinGecko no ha devuelto datos ahora mismo (posible límite de peticiones). El debate sigue
          disponible más abajo.
        </p>
      )}
    </header>
  );
}

function StatGrid({ market }: { market: Awaited<ReturnType<typeof getMarket>> }) {
  const stats = [
    { label: "Capitalización", value: formatCompact(market?.market_cap) },
    { label: "Volumen 24 h", value: formatCompact(market?.total_volume) },
    { label: "Máx. 24 h", value: formatPrice(market?.high_24h) },
    { label: "Mín. 24 h", value: formatPrice(market?.low_24h) },
    { label: "Suministro circulante", value: formatNumber(market?.circulating_supply) },
    { label: "Máximo histórico", value: formatPrice(market?.ath) },
  ];

  return (
    <section aria-label="Datos de mercado" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="surface p-4">
          <p className="eyebrow">{stat.label}</p>
          <p className="tabular mt-1.5 text-xl font-semibold text-cream">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}

function ThreadSkeleton() {
  return (
    <div className="surface space-y-4 p-5 md:p-6">
      <div className="skeleton h-7 w-40" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-16 w-full" />
    </div>
  );
}
