"use client";

import { CoinCard } from "@/components/coin-card";
import { ChangeBadge } from "@/components/change-badge";
import { LiveIndicator } from "@/components/live-indicator";
import { useLiveMarkets } from "@/lib/use-live-markets";
import { TRACKED_COINS } from "@/lib/coins";
import { formatCompact } from "@/lib/format";
import type { CoinMarket } from "@/lib/coingecko";

/**
 * Rejilla de monedas de la home, con los precios refrescándose solos.
 *
 * Recibe del servidor los datos ya renderizados (buen primer pintado y SEO) y a
 * partir de ahí los mantiene al día por su cuenta.
 */
export function LiveCoinGrid({
  initialMarkets,
  commentCounts,
}: {
  initialMarkets: CoinMarket[] | null;
  commentCounts: Record<string, number>;
}) {
  const { markets, byId, updatedAt, status, refresh } = useLiveMarkets(initialMarkets);

  const totalCap = (markets ?? []).reduce((sum, m) => sum + (m.market_cap ?? 0), 0);

  let best: { id: string; change: number } | null = null;
  for (const market of markets ?? []) {
    const change = market.price_change_percentage_24h;
    if (change === null) continue;
    if (!best || change > best.change) best = { id: market.id, change };
  }
  const bestCoin = best ? TRACKED_COINS.find((c) => c.id === best.id) : null;

  return (
    <div className="space-y-5">
      {!markets && (
        <p
          role="status"
          className="rounded-input border border-doge/40 bg-doge-soft px-4 py-3 text-sm text-doge-ink"
        >
          No hemos podido cargar los precios de CoinGecko (probablemente un límite de peticiones).
          El resto de la web funciona con normalidad; seguimos reintentando solos.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-faint">
        <LiveIndicator updatedAt={updatedAt} status={status} onRefresh={refresh} />

        {markets && markets.length > 0 && (
          <>
            <span>
              Capitalización combinada{" "}
              <span className="tabular text-ink">{formatCompact(totalCap)}</span>
            </span>
            {bestCoin && best && (
              <span className="inline-flex items-center gap-2">
                Mejor 24 h
                <span className="text-ink">{bestCoin.name}</span>
                <ChangeBadge value={best.change} size="sm" />
              </span>
            )}
          </>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {TRACKED_COINS.map((coin) => (
          <CoinCard
            key={coin.id}
            coin={coin}
            market={byId.get(coin.id) ?? null}
            commentCount={commentCounts[coin.id]}
          />
        ))}
      </div>
    </div>
  );
}
