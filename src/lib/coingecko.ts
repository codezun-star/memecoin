import { COIN_IDS, getCoinById, type CoinKey } from "@/lib/coins";

/**
 * Cliente de la API pública de CoinGecko.
 *
 * Funciona sin API key (tier público), pero si defines COINGECKO_API_KEY se
 * envía como Demo key y el rate limit sube bastante.
 *
 * Dos principios:
 *  1. Nunca lanza. Si CoinGecko contesta 429 la web tiene que seguir
 *     renderizando, solo que sin precios.
 *  2. Nunca devuelve datos sin validar. Un campo que llegue como string, null o
 *     NaN se normaliza a null en vez de acabar pintando "NaN $" en pantalla.
 */

const API_BASE = process.env.COINGECKO_API_BASE ?? "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY;

/** Cache del ISR para el render del servidor. Con el tier público, bajar de 60 s es pedir un 429. */
export const REVALIDATE_MARKETS = 60;
export const REVALIDATE_CHART = 300;

export type CoinMarket = {
  id: CoinKey;
  symbol: string;
  name: string;
  image: string | null;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string | null;
  last_updated: string | null;
  sparkline_in_7d: { price: number[] } | null;
};

export type MarketChart = {
  /** [timestamp ms, precio] */
  prices: [number, number][];
};

/** Número finito o null. Acepta strings numéricos: CoinGecko los devuelve en algunos campos. */
function num(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Convierte una fila cruda de /coins/markets en un CoinMarket de confianza.
 * Devuelve null si la fila no corresponde a una moneda que trackeamos.
 */
export function normalizeMarket(raw: unknown): CoinMarket | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === "string" ? r.id : null;
  const coin = id ? getCoinById(id) : undefined;
  if (!coin) return null;

  const sparkPrices = (r.sparkline_in_7d as { price?: unknown } | undefined)?.price;
  const sparkline = Array.isArray(sparkPrices)
    ? { price: sparkPrices.map(num).filter((n): n is number => n !== null) }
    : null;

  return {
    id: coin.id,
    symbol: str(r.symbol)?.toUpperCase() ?? coin.symbol,
    name: str(r.name) ?? coin.name,
    image: str(r.image),
    current_price: num(r.current_price),
    market_cap: num(r.market_cap),
    market_cap_rank: num(r.market_cap_rank),
    total_volume: num(r.total_volume),
    high_24h: num(r.high_24h),
    low_24h: num(r.low_24h),
    price_change_percentage_24h: num(r.price_change_percentage_24h),
    price_change_percentage_7d_in_currency: num(r.price_change_percentage_7d_in_currency),
    circulating_supply: num(r.circulating_supply),
    total_supply: num(r.total_supply),
    ath: num(r.ath),
    ath_change_percentage: num(r.ath_change_percentage),
    ath_date: str(r.ath_date),
    last_updated: str(r.last_updated),
    sparkline_in_7d: sparkline && sparkline.price.length > 1 ? sparkline : null,
  };
}

export function normalizeChart(raw: unknown): MarketChart | null {
  if (!raw || typeof raw !== "object") return null;
  const prices = (raw as { prices?: unknown }).prices;
  if (!Array.isArray(prices)) return null;

  const points: [number, number][] = [];
  for (const entry of prices) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const t = num(entry[0]);
    const p = num(entry[1]);
    if (t === null || p === null) continue;
    points.push([t, p]);
  }

  // Llegan ordenados, pero no lo damos por hecho: un punto fuera de sitio
  // dibujaría una línea cruzando el gráfico entero.
  points.sort((a, b) => a[0] - b[0]);
  return points.length > 1 ? { prices: points } : null;
}

type FetchMode = "isr" | "live";

async function cgFetch<T>(path: string, mode: FetchMode, revalidate: number): Promise<T | null> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (API_KEY) headers["x-cg-demo-api-key"] = API_KEY;

  try {
    const res = await fetch(url, {
      headers,
      // "live" se usa desde el route handler de sondeo, que tiene su propio
      // throttle en memoria: ahí el cache de Next solo estorbaría.
      ...(mode === "live"
        ? { cache: "no-store" as const }
        : { next: { revalidate, tags: ["coingecko"] } }),
    });

    if (!res.ok) {
      console.error(`[coingecko] ${res.status} ${res.statusText} en ${path}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`[coingecko] fallo de red en ${path}:`, error);
    return null;
  }
}

function marketsPath(ids: string[]) {
  const params = new URLSearchParams({
    vs_currency: "usd",
    ids: ids.join(","),
    order: "market_cap_desc",
    sparkline: "true",
    price_change_percentage: "24h,7d",
    precision: "full",
  });
  return `/coins/markets?${params}`;
}

/** Datos de mercado de todas las monedas trackeadas, en el orden del registro. */
export async function getMarkets(mode: FetchMode = "isr"): Promise<CoinMarket[] | null> {
  const raw = await cgFetch<unknown[]>(marketsPath(COIN_IDS), mode, REVALIDATE_MARKETS);
  if (!Array.isArray(raw)) return null;

  const normalized = raw
    .map(normalizeMarket)
    .filter((m): m is CoinMarket => m !== null);

  if (normalized.length === 0) return null;

  // CoinGecko ordena por capitalización; nosotros mandamos con el orden del registro.
  const byId = new Map(normalized.map((coin) => [coin.id, coin]));
  return COIN_IDS.map((id) => byId.get(id)).filter((c): c is CoinMarket => Boolean(c));
}

export async function getMarket(id: CoinKey): Promise<CoinMarket | null> {
  const raw = await cgFetch<unknown[]>(marketsPath([id]), "isr", REVALIDATE_MARKETS);
  if (!Array.isArray(raw)) return null;
  return normalizeMarket(raw[0]);
}

/** Serie de precios para el gráfico de detalle. */
export async function getMarketChart(id: CoinKey, days: number): Promise<MarketChart | null> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    days: String(days),
    precision: "full",
  });

  // El tier público solo permite `interval` automático; no lo mandamos a propósito.
  const raw = await cgFetch<unknown>(`/coins/${id}/market_chart?${params}`, "isr", REVALIDATE_CHART);
  return normalizeChart(raw);
}
