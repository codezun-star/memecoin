import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { ChangeBadge } from "@/components/change-badge";
import { CoinLogo } from "@/components/coin-logo";
import { Sparkline } from "@/components/sparkline";
import type { CoinMarket } from "@/lib/coingecko";
import type { TrackedCoin } from "@/lib/coins";
import { directionOf, formatCompact, formatPrice } from "@/lib/format";

export function CoinCard({
  coin,
  market,
  commentCount,
}: {
  coin: TrackedCoin;
  market: CoinMarket | null;
  commentCount?: number;
}) {
  const change24h = market?.price_change_percentage_24h ?? null;
  const spark = market?.sparkline_in_7d?.price ?? [];
  const trend = directionOf(
    market?.price_change_percentage_7d_in_currency ??
      (spark.length > 1 ? spark[spark.length - 1] - spark[0] : null),
  );

  return (
    <Link
      href={`/coin/${coin.slug}`}
      // El acento de la moneda viaja como variable CSS: el hover y el glow se
      // tiñen solos sin generar una clase Tailwind por moneda.
      style={{ ["--coin-accent" as string]: coin.accent }}
      className="group surface relative flex flex-col gap-4 overflow-hidden p-5 transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-[color:var(--coin-accent)]/40 hover:shadow-glow md:p-6"
    >
      {/* Halo de color que aparece al pasar el ratón */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: coin.accent }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CoinLogo coin={coin} src={market?.image} />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-tight text-cream">
              {coin.name}
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-dust">{coin.symbol}</p>
          </div>
        </div>
        {market?.market_cap_rank ? (
          <span className="rounded-full bg-ink-700 px-2 py-0.5 font-mono text-xs text-sand">
            #{market.market_cap_rank}
          </span>
        ) : null}
      </div>

      <div className="relative">
        <p className="tabular text-2xl font-bold tracking-tight text-cream">
          {formatPrice(market?.current_price)}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <ChangeBadge value={change24h} size="sm" />
          <span className="text-xs text-dust">24 h</span>
        </div>
      </div>

      <div className="relative -mx-1">
        <Sparkline data={spark} direction={trend} height={56} />
      </div>

      <div className="relative flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-dust">
        <span>
          Cap. <span className="tabular text-sand">{formatCompact(market?.market_cap)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 transition-colors group-hover:text-[color:var(--coin-accent)]">
          <MessageCircle className="size-3.5" aria-hidden />
          {commentCount !== undefined ? (
            <span className="tabular">{commentCount}</span>
          ) : (
            <span>Ver debate</span>
          )}
        </span>
      </div>
    </Link>
  );
}
