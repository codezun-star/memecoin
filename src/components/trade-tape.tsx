"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { CoinLogo } from "@/components/coin-logo";
import { Button } from "@/components/ui/button";
import { TRADABLE_COINS, mercadoDe } from "@/lib/coins";
import { formatAmount, formatCompact, formatExact, formatPrice } from "@/lib/format";
import { VISIBLES } from "@/lib/trades";
import { useLiveTrades, type EstadoConexion } from "@/lib/use-live-trades";
import { cn } from "@/lib/utils";

const ESTADO: Record<
  EstadoConexion,
  { texto: string; clase: string; late: boolean; detalle?: string }
> = {
  conectando: { texto: "Conectando", clase: "text-ink-faint", late: true },
  "en-vivo": { texto: "En vivo", clase: "text-up", late: true },
  diferido: {
    texto: "En diferido",
    clase: "text-doge-ink",
    late: true,
    detalle:
      "Alguna de estas monedas llega a través de nuestro servidor, en tandas de unos segundos, " +
      "porque su mercado no admite la conexión directa desde tu navegador. Los datos son los mismos.",
  },
  reconectando: { texto: "Reconectando", clase: "text-doge-ink", late: true },
  error: { texto: "Sin conexión", clase: "text-down", late: false },
};

/**
 * Cuánto hace de la última operación, en palabras.
 *
 * Existe por una confusión real: en una moneda poco líquida pueden pasar horas
 * entre operaciones, así que la cinta se queda quieta y **parece rota** aunque
 * los datos sean correctos. Decirlo con todas las letras cuesta una línea.
 */
function haceCuanto(ms: number): string {
  const minutos = Math.floor(ms / 60_000);
  if (minutos < 1) return "menos de un minuto";
  if (minutos < 60) return `${minutos} min`;

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas < 24) return resto > 0 ? `${horas} h ${resto} min` : `${horas} h`;

  const dias = Math.floor(horas / 24);
  return dias === 1 ? "1 día" : `${dias} días`;
}

/** A partir de aquí se avisa de que la cinta está parada porque no hay actividad. */
const CINTA_PARADA_MS = 3 * 60_000;

/** Hora con segundos: en una cinta de operaciones el minuto no basta. */
function hora(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * @param logos URL del logo de cada moneda, resuelta en el servidor. Se pasa por
 *   props en lugar de sondear los mercados otra vez desde aquí: un logo no
 *   cambia, y esta página no necesita precios en vivo para nada más.
 */
export function TradeTape({ logos = {} }: { logos?: Record<string, string> }) {
  const [seleccion, setSeleccion] = useState<string[]>(
    // Por defecto, las cuatro clásicas: abrir con veinte flujos a la vez llena
    // la pantalla tan rápido que no se lee nada.
    TRADABLE_COINS.filter((c) => c.featured).map((c) => c.id),
  );

  const pares = useMemo(
    () =>
      TRADABLE_COINS.filter((c) => seleccion.includes(c.id)).flatMap((c) => {
        const mercado = mercadoDe(c);
        return mercado ? [{ coinId: c.id, par: mercado.par, fuente: mercado.fuente }] : [];
      }),
    [seleccion],
  );

  const { trades, estado } = useLiveTrades(pares);

  // Se guardan más de las que se enseñan: la barra de presión de arriba usa
  // todas, la tabla solo las más recientes (ver src/lib/trades.ts).
  const visibles = useMemo(() => trades.slice(0, VISIBLES), [trades]);

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

  /**
   * Reloj propio, que arranca en `null`.
   *
   * Leer `Date.now()` durante el render daría un valor distinto en el servidor y
   * en el navegador, y eso rompe la hidratación —ya pasó una vez con el gráfico—.
   * Empezando en `null`, el primer marcado no depende de la hora.
   */
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const antiguedad = ahora !== null && trades.length > 0 ? ahora - trades[0].timestamp : null;
  const cintaParada = antiguedad !== null && antiguedad > CINTA_PARADA_MS;

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
              <CoinLogo
                coin={coin}
                src={logos[coin.id]}
                size="xs"
                // Las no elegidas se apagan en lugar de desaparecer: así el
                // selector se lee igual de rápido con o sin logos cargados.
                className={cn("transition-opacity", !activa && "opacity-45")}
              />
              {coin.symbol}
            </button>
          );
        })}
      </div>

      {/* Estado y resumen */}
      <div className="surface-card flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
        <span
          className={cn("inline-flex items-center gap-2 text-sm font-medium", info.clase)}
          title={info.detalle}
        >
          <span
            aria-hidden
            className={cn("size-2 rounded-full bg-current", info.late && "animate-pulse-dot")}
          />
          {info.texto}
        </span>

        <span
          className="tabular text-sm text-ink-faint"
          title={`Volumen exacto de estas operaciones: ${formatExact(resumen.volumen)}`}
        >
          {trades.length} operaciones ·{" "}
          <span className="text-ink">{formatCompact(resumen.volumen)}</span>
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

      {(info.detalle || cintaParada) && (
        <div className="-mt-2 space-y-1.5">
          {info.detalle && <p className="text-xs text-ink-faint">{info.detalle}</p>}
          {cintaParada && antiguedad !== null && (
            <p className="text-xs text-ink-faint">
              La operación más reciente es de hace{" "}
              <strong className="font-semibold text-ink-soft">{haceCuanto(antiguedad)}</strong>. En
              monedas poco líquidas es normal que pasen minutos u horas entre operaciones: la cinta
              no está parada, es que no se ha cruzado nada nuevo.
            </p>
          )}
        </div>
      )}

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
                No hay operaciones disponibles en este momento.
              </p>
              <p className="mt-2 text-sm text-ink-faint">
                Puede ser tu red o el propio mercado. Vuelve a intentarlo en un minuto; los precios
                de{" "}
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
          {/*
            Tabla de verdad, no una rejilla por fila.

            Antes cada fila era su propia rejilla con columnas `auto`, así que
            cada una se dimensionaba por su cuenta y ninguna coincidía con la
            cabecera. Una tabla comparte el ancho de columna entre cabecera y
            cuerpo por definición, y además `table-fixed` los deja quietos: sin
            eso, una cinta que se renueva cada segundo recalcularía los anchos
            en cada operación nueva y las columnas irían dando saltos.
          */}
          <table className="w-full table-fixed">
            <caption className="sr-only">
              Últimas {VISIBLES} operaciones de las monedas seleccionadas
            </caption>

            <thead>
              <tr className="border-b border-line text-eyebrow uppercase text-ink-faint">
                <th scope="col" className="px-3 py-2.5 text-left font-medium sm:px-4">
                  Moneda
                </th>
                <th scope="col" className="w-28 px-3 py-2.5 text-right font-medium sm:w-32 sm:px-4">
                  Tipo
                </th>
                {/* En móvil se ocultan las columnas menos útiles en vez de encogerlo todo. */}
                <th
                  scope="col"
                  className="hidden px-4 py-2.5 text-right font-medium sm:table-cell sm:w-36"
                >
                  Precio
                </th>
                <th scope="col" className="w-28 px-3 py-2.5 text-right font-medium sm:w-32 sm:px-4">
                  Importe
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-2.5 text-right font-medium sm:table-cell sm:w-28"
                >
                  Hora
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {visibles.map((trade) => {
                const coin = porId.get(trade.coinId);
                const esCompra = trade.side === "buy";

                return (
                  <tr
                    key={trade.id}
                    className={esCompra ? "animate-flash-up" : "animate-flash-down"}
                  >
                    <td className="px-3 py-2.5 sm:px-4">
                      <span className="flex min-w-0 items-center gap-2">
                        {coin && <CoinLogo coin={coin} src={logos[trade.coinId]} size="sm" />}
                        <span className="font-mono text-xs font-medium uppercase text-ink">
                          {coin?.symbol ?? trade.coinId}
                        </span>
                        {/* El nombre llena una columna que si no queda vacía, y
                            de paso evita tener que saber de memoria qué es BOME. */}
                        {coin && (
                          <span className="hidden truncate text-xs text-ink-faint sm:inline">
                            {coin.name}
                          </span>
                        )}
                      </span>
                    </td>

                    <td
                      className={cn(
                        "px-3 py-2.5 text-right text-xs font-semibold sm:px-4",
                        esCompra ? "text-up" : "text-down",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {esCompra ? (
                          <ArrowUpRight className="size-3.5" aria-hidden />
                        ) : (
                          <ArrowDownRight className="size-3.5" aria-hidden />
                        )}
                        {esCompra ? "Compra" : "Venta"}
                      </span>
                    </td>

                    <td className="tabular hidden px-4 py-2.5 text-right text-xs text-ink-soft sm:table-cell">
                      {formatPrice(trade.price)}
                    </td>
                    <td
                      className="tabular px-3 py-2.5 text-right text-xs font-medium text-ink sm:px-4"
                      // La cifra exacta al pasar el ratón, por si el importe sale
                      // abreviado en las operaciones muy grandes.
                      title={formatExact(trade.value)}
                    >
                      {formatAmount(trade.value)}
                    </td>
                    <td className="tabular hidden px-4 py-2.5 text-right text-xs text-ink-faint sm:table-cell">
                      {hora(trade.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs text-ink-faint">
          {trades.length > VISIBLES && (
            <>
              La tabla muestra las {VISIBLES} operaciones más recientes; la barra de presión usa las{" "}
              {trades.length} últimas.{" "}
            </>
          )}
          Operaciones de un único mercado por moneda, no del total del sector. &ldquo;Compra&rdquo; y
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
