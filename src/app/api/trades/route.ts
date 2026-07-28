import { NextResponse } from "next/server";

import { TRADABLE_COINS, mercadoDe, type FuenteDeMercado } from "@/lib/coins";
import { normalizarLote, normalizarLoteGate, type Trade } from "@/lib/trades";

export const dynamic = "force-dynamic";

/**
 * Respaldo de la cinta de operaciones.
 *
 * Lo normal es que el navegador reciba las operaciones por conexión directa,
 * sin pasar por aquí. Pero hay redes —oficinas, algunos operadores móviles,
 * ciertos antivirus— que bloquean ese tipo de conexión. Para esos visitantes,
 * esta ruta trae las últimas operaciones por una vía que ninguna red corta.
 *
 * No es un directo: llega en tandas, con unos segundos de retraso. Los datos son
 * los mismos y la interfaz lo etiqueta como diferido en lugar de fingir que es
 * tiempo real.
 */

/**
 * Un origen por mercado.
 *
 * Cada uno tiene su ruta, sus parámetros y su formato de respuesta; lo único
 * que comparten es que no piden credenciales. Los hosts de cada lista se
 * prueban en orden y el primero que responda se recuerda para la siguiente.
 */
const ORIGENES: Record<
  FuenteDeMercado,
  { hosts: string[]; ruta(par: string): string; normalizar(crudo: unknown, coinId: string, par: string): Trade[] }
> = {
  binance: {
    hosts: process.env.TRADES_REST_BASE
      ? [process.env.TRADES_REST_BASE]
      : ["https://data-api.binance.vision", "https://api.binance.com"],
    ruta: (par) => `/api/v3/aggTrades?symbol=${par.toUpperCase()}&limit=${LIMITE}`,
    normalizar: normalizarLote,
  },
  gate: {
    hosts: process.env.TRADES_REST_BASE_GATE
      ? [process.env.TRADES_REST_BASE_GATE]
      : ["https://api.gateio.ws"],
    ruta: (par) => `/api/v4/spot/trades?currency_pair=${par.toUpperCase()}&limit=${LIMITE}`,
    normalizar: normalizarLoteGate,
  },
};

const hostPreferidoPorFuente: Record<string, number> = {};

/** Operaciones por moneda y vuelta. Suficiente para llenar la cinta sin inflarla. */
const LIMITE = 20;

/** Techo de monedas por petición: evita convertir una llamada en veinte. */
const MAX_MONEDAS = 8;

/**
 * Ventana de reutilización por moneda.
 *
 * El cliente sondea cada 5 s, pero N pestañas abiertas no deben ser N llamadas
 * de salida. Con esta ventana, cada moneda se pide como mucho una vez cada 4 s
 * mire quien mire.
 */
const THROTTLE_MS = 4000;

/** Si el origen no contesta en este tiempo, se pasa al siguiente host. */
const TIMEOUT_MS = 6000;

type Entrada = { at: number; trades: Trade[] };

const cache = new Map<string, Entrada>();
const enVuelo = new Map<string, Promise<Trade[]>>();

async function pedir(coinId: string, fuente: FuenteDeMercado, par: string): Promise<Trade[]> {
  const origen = ORIGENES[fuente];
  const preferido = hostPreferidoPorFuente[fuente] ?? 0;

  for (let salto = 0; salto < origen.hosts.length; salto += 1) {
    const indice = (preferido + salto) % origen.hosts.length;

    try {
      const respuesta = await fetch(`${origen.hosts[indice]}${origen.ruta(par)}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!respuesta.ok) continue;

      const lote = origen.normalizar(await respuesta.json(), coinId, par);
      if (lote.length === 0) continue;

      // Este host va: las siguientes peticiones empiezan por él.
      hostPreferidoPorFuente[fuente] = indice;
      return lote;
    } catch {
      // Caída, tiempo agotado o respuesta ilegible: se prueba el siguiente.
    }
  }

  return [];
}

function traer(coinId: string, fuente: FuenteDeMercado, par: string): Promise<Trade[]> {
  const ahora = Date.now();

  const guardado = cache.get(coinId);
  if (guardado && ahora - guardado.at < THROTTLE_MS) {
    return Promise.resolve(guardado.trades);
  }

  // Si ya hay una petición en vuelo para esta moneda, las concurrentes se
  // cuelgan de ella en vez de disparar otra.
  const yaEnVuelo = enVuelo.get(coinId);
  if (yaEnVuelo) return yaEnVuelo;

  const promesa = pedir(coinId, fuente, par)
    .then((trades) => {
      // Un fallo puntual no debe borrar lo último bueno.
      if (trades.length === 0 && guardado) return guardado.trades;
      cache.set(coinId, { at: Date.now(), trades });
      return trades;
    })
    .finally(() => {
      enVuelo.delete(coinId);
    });

  enVuelo.set(coinId, promesa);
  return promesa;
}

export async function GET(request: Request) {
  const pedidas = new Set(
    (new URL(request.url).searchParams.get("monedas") ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  );

  // Lista blanca: al origen solo llegan símbolos que están en el repositorio.
  // Nada de lo que escriba quien llame acaba dentro de la URL de salida.
  const monedas = TRADABLE_COINS.filter((c) => pedidas.has(c.id)).slice(0, MAX_MONEDAS);

  if (monedas.length === 0) {
    return responder([]);
  }

  const lotes = await Promise.all(
    monedas.map((c) => {
      const mercado = mercadoDe(c);
      // `TRADABLE_COINS` ya garantiza que hay mercado; esto es solo el estrechado
      // de tipo, y de paso deja la rama explícita si alguien cambia el filtro.
      return mercado ? traer(c.id, mercado.fuente, mercado.par) : Promise.resolve([]);
    }),
  );

  return responder(lotes.flat().sort((a, b) => b.timestamp - a.timestamp));
}

/**
 * Siempre 200, incluso sin operaciones.
 *
 * El endpoint ha respondido correctamente; si no hay datos, eso viaja en el
 * cuerpo. Devolver un error haría que el navegador registrase un fallo en
 * consola en cada sondeo y, de paso, delataría el estado de un servicio ajeno.
 */
function responder(trades: Trade[]) {
  return NextResponse.json(
    { trades, fetchedAt: Date.now() },
    { headers: { "cache-control": "no-store" } },
  );
}
