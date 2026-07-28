"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { CoinCard } from "@/components/coin-card";
import { ChangeBadge } from "@/components/change-badge";
import { LiveIndicator } from "@/components/live-indicator";
import { Input } from "@/components/ui/input";
import { useLiveMarketsContext } from "@/components/live-markets-provider";
import { TRACKED_COINS } from "@/lib/coins";
import { formatCompact } from "@/lib/format";

/**
 * Rejilla de monedas de la home, con los precios refrescándose solos.
 *
 * Recibe del servidor los datos ya renderizados (buen primer pintado y SEO) y a
 * partir de ahí los mantiene al día por su cuenta.
 */
export function LiveCoinGrid({ commentCounts }: { commentCounts: Record<string, number> }) {
  const { markets, byId, updatedAt, status, refresh } = useLiveMarketsContext();
  const [query, setQuery] = useState("");

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Orden por capitalización, como en cualquier tabla de mercado. Las monedas
    // sin dato caen al final en vez de colarse arriba con un 0.
    const ordenadas = [...TRACKED_COINS].sort((a, b) => {
      const capA = byId.get(a.id)?.market_cap;
      const capB = byId.get(b.id)?.market_cap;
      if (capA == null && capB == null) return 0;
      if (capA == null) return 1;
      if (capB == null) return -1;
      return capB - capA;
    });

    if (!q) return ordenadas;
    return ordenadas.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
    );
  }, [byId, query]);

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
          Los precios no están disponibles en este momento. Seguimos reintentando solos; el resto
          de la web funciona con normalidad.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <LiveIndicator updatedAt={updatedAt} status={status} onRefresh={refresh} />

        {markets && markets.length > 0 && (
          <>
            <span className="text-sm text-ink-faint">
              Capitalización combinada{" "}
              <span className="tabular text-ink">{formatCompact(totalCap)}</span>
            </span>
            {bestCoin && best && (
              <span className="inline-flex items-center gap-2 text-sm text-ink-faint">
                Mejor 24 h
                <span className="text-ink">{bestCoin.name}</span>
                <ChangeBadge value={best.change} size="sm" />
              </span>
            )}
          </>
        )}

        {/* Con veinte tarjetas, encontrar una concreta a ojo deja de ser cómodo. */}
        <div className="relative ml-auto w-full sm:w-56">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar moneda…"
            aria-label="Buscar moneda por nombre o símbolo"
            className="h-10 pl-9"
          />
        </div>
      </div>

      {visibles.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {visibles.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              market={byId.get(coin.id) ?? null}
              commentCount={commentCounts[coin.id]}
            />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-ink-faint">
          Ninguna moneda coincide con “{query}”.
        </p>
      )}
    </div>
  );
}
