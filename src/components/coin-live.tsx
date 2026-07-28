"use client";

import { ChangeBadge } from "@/components/change-badge";
import { CoinLogo } from "@/components/coin-logo";
import { LiveIndicator } from "@/components/live-indicator";
import { LivePrice } from "@/components/live-price";
import { PriceChart, type ChartPoint } from "@/components/price-chart";
import { useLiveMarketsContext } from "@/components/live-markets-provider";
import type { TrackedCoin } from "@/lib/coins";
import { formatCompact, formatNumber, formatPrice } from "@/lib/format";

/** Cabecera de la moneda: logo, nombre, precio en vivo y variación 24 h. */
export function LiveCoinHeader({ coin }: { coin: TrackedCoin }) {
  const { byId, updatedAt, status, refresh } = useLiveMarketsContext();
  const market = byId.get(coin.id) ?? null;

  return (
    <header className="surface-card relative overflow-hidden p-5 md:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
        style={{ background: coin.accent }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full opacity-20 blur-[90px]"
        style={{ background: coin.accent }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <CoinLogo coin={coin} src={market?.image} size="lg" />
          <div>
            {/* accentInk, no accent: el color vivo no tiene contraste como texto */}
            <p className="eyebrow" style={{ color: coin.accentInk }}>
              {coin.tagline}
            </p>
            <h1 className="font-display text-display-lg leading-none">{coin.name}</h1>
            <p className="mt-1 font-mono text-sm uppercase tracking-widest text-ink-faint">
              {coin.symbol}
              {market?.market_cap_rank ? ` · #${market.market_cap_rank} por capitalización` : ""}
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="tabular text-[2rem] font-bold leading-none tracking-tight text-ink">
            <LivePrice value={market?.current_price} />
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:justify-end">
            <ChangeBadge value={market?.price_change_percentage_24h} />
            <span className="text-xs text-ink-faint">últimas 24 h</span>
          </div>
          <div className="mt-2 sm:flex sm:justify-end">
            <LiveIndicator updatedAt={updatedAt} status={status} onRefresh={refresh} />
          </div>
        </div>
      </div>

      {!market && (
        <p role="status" className="relative mt-4 text-sm text-doge-ink">
          Los datos de mercado no están disponibles en este momento. El debate sigue disponible
          más abajo.
        </p>
      )}
    </header>
  );
}

/**
 * Gráfico de precio. La serie histórica viene del servidor; el último punto se
 * engancha al precio en vivo para que la línea no se quede congelada.
 */
export function LivePriceChart({
  coin,
  points,
  days,
}: {
  coin: TrackedCoin;
  points: ChartPoint[];
  days: number;
}) {
  const { byId } = useLiveMarketsContext();
  const livePrice = byId.get(coin.id)?.current_price ?? null;

  return <PriceChart data={points} coin={coin} days={days} livePrice={livePrice} />;
}

/**
 * Variación en el rango elegido.
 *
 * En 24 h se usa **la cifra oficial del mercado**, exactamente la misma que
 * muestra la cabecera. Calcularla por nuestra cuenta sobre la serie del gráfico
 * daba un número parecido pero distinto, y dos porcentajes que dicen «24 h» y no
 * coinciden solo hacen dudar de los dos.
 *
 * La diferencia no era un fallo de cálculo: la serie del gráfico viene agrupada
 * en tramos de unos minutos y su primer punto no cae en el mismo instante que la
 * referencia que usa el mercado para su porcentaje de 24 h. Con precios que se
 * mueven varios puntos en un día, ese desfase de arranque se nota.
 *
 * Para el resto de rangos no existe cifra oficial, así que sí se calcula sobre
 * la serie —de primer punto a precio actual— y se etiqueta con el rango para que
 * quede claro que mide otra cosa.
 */
export function RangeChangeBadge({
  points,
  coin,
  days,
  etiqueta,
}: {
  points: ChartPoint[];
  coin: TrackedCoin;
  days: number;
  etiqueta: string;
}) {
  const { byId } = useLiveMarketsContext();
  const market = byId.get(coin.id) ?? null;

  if (days === 1) {
    const oficial = market?.price_change_percentage_24h;
    if (oficial == null) return null;
    return <Variacion valor={oficial} etiqueta={etiqueta} />;
  }

  if (points.length < 2) return null;

  const first = points[0].p;
  const last = market?.current_price ?? points[points.length - 1].p;
  if (first === 0) return null;

  return <Variacion valor={((last - first) / first) * 100} etiqueta={etiqueta} />;
}

function Variacion({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <ChangeBadge value={valor} size="sm" />
      <span className="text-xs text-ink-faint">en {etiqueta}</span>
    </span>
  );
}

export function LiveStatGrid({ coin }: { coin: TrackedCoin }) {
  const { byId } = useLiveMarketsContext();
  const market = byId.get(coin.id) ?? null;

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
        <div key={stat.label} className="surface-card p-4">
          <p className="eyebrow">{stat.label}</p>
          <p className="tabular mt-1.5 text-xl font-semibold text-ink">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
