import { NextResponse } from "next/server";

import { getMarkets, type CoinMarket } from "@/lib/coingecko";

export const dynamic = "force-dynamic";

export type MarketsPayload = {
  markets: CoinMarket[] | null;
  /** Momento en que se obtuvieron estos datos de CoinGecko (ms epoch). */
  fetchedAt: number;
  /** true si la respuesta sale del throttle en memoria y no de una llamada nueva. */
  cached: boolean;
  error: string | null;
};

/**
 * Throttle compartido por proceso.
 *
 * El cliente sondea cada 20 s, pero N pestañas abiertas no deben significar N
 * llamadas a CoinGecko: el tier público corta a ~30 peticiones por minuto. Con
 * esta ventana, el upstream recibe como mucho una llamada cada 15 s
 * independientemente de cuánta gente esté mirando.
 */
const THROTTLE_MS = 15_000;

let cache: { payload: MarketsPayload; at: number } | null = null;
let inFlight: Promise<CoinMarket[] | null> | null = null;

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.at < THROTTLE_MS) {
    return NextResponse.json(
      { ...cache.payload, cached: true } satisfies MarketsPayload,
      { headers: { "cache-control": "no-store" } },
    );
  }

  // Si ya hay una petición en vuelo, las concurrentes se cuelgan de ella en vez
  // de disparar otra.
  inFlight ??= getMarkets("live").finally(() => {
    inFlight = null;
  });

  const markets = await inFlight;

  const payload: MarketsPayload = {
    markets,
    fetchedAt: Date.now(),
    cached: false,
    error: markets ? null : "Los precios no están disponibles en este momento.",
  };

  // Un fallo puntual no debe tirar el último dato bueno: si CoinGecko falla,
  // se sigue sirviendo lo último conocido marcando el error.
  if (!markets && cache?.payload.markets) {
    const stale: MarketsPayload = {
      ...cache.payload,
      cached: true,
      error: payload.error,
    };
    return NextResponse.json(stale, { headers: { "cache-control": "no-store" } });
  }

  cache = { payload, at: Date.now() };

  // Siempre 200, incluso sin precios. El endpoint ha respondido correctamente;
  // quien falla es la fuente de datos, y eso ya viaja en `error`. Devolver 503
  // hacía que el navegador registrase un error en consola en cada sondeo
  // fallido, ruido que no ayuda a nadie y que además delata el estado de un
  // servicio externo.
  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
}
