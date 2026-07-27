import { COIN_IDS, type CoinKey } from "@/lib/coins";

/**
 * Cliente de la API pública de CoinGecko.
 *
 * Funciona sin API key (tier público), pero si defines COINGECKO_API_KEY se
 * envía como Demo key y el rate limit sube bastante. Todas las funciones
 * devuelven `null` en vez de lanzar: si CoinGecko contesta 429 la web tiene que
 * seguir renderizando, solo que sin precios.
 */

const API_BASE = process.env.COINGECKO_API_BASE ?? "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY;

/** Segundos de cache del ISR. Con el tier público, bajar de 60 s es pedir un 429. */
const REVALIDATE_MARKETS = 60;
const REVALIDATE_CHART = 300;

export type CoinMarket = {
  id: CoinKey;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string | null;
  last_updated: string | null;
  sparkline_in_7d?: { price: number[] };
};

export type MarketChart = {
  /** [timestamp ms, precio] */
  prices: [number, number][];
};

async function cgFetch<T>(path: string, revalidate: number): Promise<T | null> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (API_KEY) headers["x-cg-demo-api-key"] = API_KEY;

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate, tags: ["coingecko"] },
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

/** Datos de mercado de todas las monedas trackeadas, en el orden del registro. */
export async function getMarkets(): Promise<CoinMarket[] | null> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    ids: COIN_IDS.join(","),
    order: "market_cap_desc",
    sparkline: "true",
    price_change_percentage: "24h,7d",
    precision: "full",
  });

  const data = await cgFetch<CoinMarket[]>(`/coins/markets?${params}`, REVALIDATE_MARKETS);
  if (!data) return null;

  // CoinGecko ordena por market cap; nosotros mandamos con el orden del registro.
  const byId = new Map(data.map((coin) => [coin.id, coin]));
  return COIN_IDS.map((id) => byId.get(id)).filter((c): c is CoinMarket => Boolean(c));
}

export async function getMarket(id: CoinKey): Promise<CoinMarket | null> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    ids: id,
    sparkline: "true",
    price_change_percentage: "24h,7d",
    precision: "full",
  });

  const data = await cgFetch<CoinMarket[]>(`/coins/markets?${params}`, REVALIDATE_MARKETS);
  return data?.[0] ?? null;
}

/** Serie de precios para el gráfico de detalle. */
export async function getMarketChart(id: CoinKey, days: number): Promise<MarketChart | null> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    days: String(days),
    precision: "full",
  });

  // El tier público solo permite `interval` automático; no lo mandamos a propósito.
  return cgFetch<MarketChart>(`/coins/${id}/market_chart?${params}`, REVALIDATE_CHART);
}
