"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { CoinLogo } from "@/components/coin-logo";
import { Button } from "@/components/ui/button";
import { TRADABLE_COINS } from "@/lib/coins";
import { formatCompact, formatPrice } from "@/lib/format";
import { useLiveTrades, type EstadoConexion } from "@/lib/use-live-trades";
import { cn } from "@/lib/utils";

const ESTADO: Record<EstadoConexion, { texto: string; clase: string; late: boolean }> = {
  conectando: { texto: "Conectando", clase: "text-ink-faint", late: true },
  "en-vivo": { texto: "En vivo", clase: "text-up", late: true },
  reconectando: { texto: "Reconectando", clase: "text-doge-ink", late: true },
  error: { texto: "Sin conexión", clase: "text-down", late: false },
};

/** Hora con segundos: en una cinta de operaciones el minuto no basta. */
function hora(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TradeTape() {
  const [seleccion, setSeleccion] = useState<string[]>(
    // Por defecto, las cuatro clásicas: abrir con veinte flujos a la vez llena
    // la pantalla tan rápido que no se lee nada.
    TRADABLE_COINS.filter((c) => c.featured).map((c) => c.id),
  );

  const pares = useMemo(
    () =>
      TRADABLE_COINS.filter((c) => seleccion.includes(c.id)).map((c) => ({
        coinId: c.id,
        pair: c.tradePair,
      })),
    [seleccion],
  );

  const { trades, estado } = useLiveTrades(pares);

  const porId = useMemo(
    () => new Map<string, (typeof TRADABLE_COINS)[number]>(TRADABLE_COINS.map((c) => [c.id, c])),
    [],
  );

  const resumen = useMemo(() => {
    let compras = 0;
    let ventas = 0;
    let volumen = 0;
    for (const t of trades) {
      volumen += t.value;
      if (t.side === "buy") compras += t.value;
      else ventas += t.value;
    }
    const total = compras + ventas;
    return { compras, ventas, volumen, porcentajeCompra: total > 0 ? (compras / total) * 100 : 50 };
  }, [trades]);

  const alternar = (id: string) =>
    setSeleccion((actual) =>
      actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id],
    );

  const info = ESTADO[estado];

  return (
    <div className="space-y-5">
      {/* Selector de monedas */}
      <div className="flex flex-wrap items-center gap-2">
        {TRADABLE_COINS.map((coin) => {
          const activa = seleccion.includes(coin.id);
          return (
            <button
              key={coin.id}
              type="button"
              onClick={() => alternar(coin.id)}
              aria-pressed={activa}
              style={{ ["--coin-accent" as string]: coin.accent }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activa
                  ? "border-[color:var(--coin-accent)] bg-[color:var(--coin-accent)]/10 text-ink"
                  : "border-line bg-surface text-ink-faint hover:border-line-strong hover:text-ink-soft",
              )}
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: activa ? coin.accent : "transparent", boxShadow: activa ? undefined : "inset 0 0 0 1px currentColor" }}
              />
              {coin.symbol}
            </button>
          );
        })}
      </div>

      {/* Estado y resumen */}
      <div className="surface-card flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
        <span className={cn("inline-flex items-center gap-2 text-sm font-medium", info.clase)}>
          <span
            aria-hidden
            className={cn("size-2 rounded-full bg-current", info.late && "animate-pulse-dot")}
          />
          {info.texto}
        </span>

        <span className="tabular text-sm text-ink-faint">
          {trades.length} operaciones · <span className="text-ink">{formatCompact(resumen.volumen)}</span>
        </span>

        {/* Barra de presión compradora frente a vendedora */}
        <div className="flex min-w-48 flex-1 items-center gap-3">
          <span className="tabular text-xs font-semibold text-up">
            {resumen.porcentajeCompra.toFixed(0)}%
          </span>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-down/20"
            role="img"
            aria-label={`Presión compradora del ${resumen.porcentajeCompra.toFixed(0)} por ciento`}
          >
            <div
              className="h-full rounded-full bg-up transition-[width] duration-500"
              style={{ width: `${resumen.porcentajeCompra}%` }}
            />
          </div>
          <span className="tabular text-xs font-semibold text-down">
            {(100 - resumen.porcentajeCompra).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* La cinta */}
      {seleccion.length === 0 ? (
        <p className="surface-card p-12 text-center text-sm text-ink-faint">
          Elige al menos una moneda para ver sus operaciones.
        </p>
      ) : trades.length === 0 ? (
        <div className="surface-card p-12 text-center">
          {estado === "error" ? (
            <>
              <p className="text-sm text-ink-soft">
                No se ha podido abrir la conexión de operaciones en vivo.
              </p>
              <p className="mt-2 text-sm text-ink-faint">
                Puede que tu red o tu navegador estén bloqueando la conexión. Los precios de{" "}
                <Link href="/#mercado" className="text-brand-strong hover:underline">
                  el mercado
                </Link>{" "}
                siguen funcionando con normalidad.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-2 w-32 animate-pulse-dot rounded-full bg-line-strong" />
              <p className="text-sm text-ink-faint">
                Esperando la primera operación. En monedas poco activas puede tardar unos segundos.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          {/* En móvil se ocultan las columnas menos útiles en lugar de encoger todo */}
          <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-line px-4 py-2.5 text-eyebrow uppercase text-ink-faint sm:grid">
            <span>Moneda</span>
            <span className="text-right">Tipo</span>
            <span className="text-right">Precio</span>
            <span className="text-right">Importe</span>
            <span className="text-right">Hora</span>
          </div>

          <ul className="divide-y divide-line">
            {trades.map((trade) => {
              const coin = porId.get(trade.coinId);
              const esCompra = trade.side === "buy";

              return (
                <li
                  key={trade.id}
                  className={cn(
                    "grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:gap-4",
                    esCompra ? "animate-flash-up" : "animate-flash-down",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {coin && <CoinLogo coin={coin} size="sm" className="size-6" />}
                    <span className="truncate font-mono text-xs font-medium uppercase text-ink">
                      {coin?.symbol ?? trade.coinId}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center justify-end gap-1 text-xs font-semibold",
                      esCompra ? "text-up" : "text-down",
                    )}
                  >
                    {esCompra ? (
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    ) : (
                      <ArrowDownRight className="size-3.5" aria-hidden />
                    )}
                    {esCompra ? "Compra" : "Venta"}
                  </span>

                  <span className="tabular hidden text-right text-xs text-ink-soft sm:block">
                    {formatPrice(trade.price)}
                  </span>
                  <span className="tabular hidden text-right text-xs font-medium text-ink sm:block">
                    {formatCompact(trade.value)}
                  </span>
                  <span className="tabular hidden text-right text-xs text-ink-faint sm:block">
                    {hora(trade.timestamp)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          Operaciones de un único mercado, no del total del sector. &ldquo;Compra&rdquo; y
          &ldquo;venta&rdquo; indican quién cruzó el mercado en cada operación.
        </p>
        <Link href="/#mercado">
          <Button variant="secondary" size="sm">
            Ver precios
          </Button>
        </Link>
      </div>
    </div>
  );
}
