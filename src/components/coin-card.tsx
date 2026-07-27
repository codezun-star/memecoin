import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { ChangeBadge } from "@/components/change-badge";
import { CoinLogo } from "@/components/coin-logo";
import { Sparkline } from "@/components/sparkline";
import type { CoinMarket } from "@/lib/coingecko";
import type { TrackedCoin } from "@/lib/coins";
import { LivePrice } from "@/components/live-price";
import { directionOf, formatCompact } from "@/lib/format";

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
      style={{
        ["--coin-accent" as string]: coin.accent,
        ["--coin-accent-ink" as string]: coin.accentInk,
      }}
      className="group surface-card relative flex flex-col gap-4 overflow-hidden p-5 transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-[color:var(--coin-accent)] hover:shadow-glow md:p-6"
    >
      {/* Franja superior con el color de la moneda: identifica la tarjeta de un
          vistazo, que sobre fondo claro el borde teñido solo no basta. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: coin.accent }}
      />
      {/* Halo que aparece al pasar el ratón */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ background: coin.accent }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CoinLogo coin={coin} src={market?.image} />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-tight text-ink">
              {coin.name}
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">{coin.symbol}</p>
          </div>
        </div>
        {market?.market_cap_rank ? (
          <span className="rounded-full bg-sunken px-2 py-0.5 font-mono text-xs text-ink-soft">
            #{market.market_cap_rank}
          </span>
        ) : null}
      </div>

      <div className="relative">
        <p className="tabular text-2xl font-bold tracking-tight text-ink">
          <LivePrice value={market?.current_price} />
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <ChangeBadge value={change24h} size="sm" />
          <span className="text-xs text-ink-faint">24 h</span>
        </div>
      </div>

      <div className="relative -mx-1">
        <Sparkline data={spark} direction={trend} height={56} />
      </div>

      <div className="relative flex items-center justify-between border-t border-line pt-3 text-xs text-ink-faint">
        <span>
          Cap. <span className="tabular text-ink-soft">{formatCompact(market?.market_cap)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 transition-colors group-hover:text-[color:var(--coin-accent-ink)]">
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
