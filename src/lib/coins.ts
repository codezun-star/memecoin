/**
 * Registro de las monedas trackeadas en el MVP.
 *
 * `id` es el identificador de CoinGecko y también la PK de la tabla `coins` en
 * Supabase, para que ambos lados hablen el mismo idioma sin tabla de mapeo.
 * Añadir una moneda = añadir una entrada aquí + una fila en la migración SQL.
 */

export type CoinKey = "shiba-inu" | "dogecoin" | "pepe" | "bonk";

export type TrackedCoin = {
  id: CoinKey;
  slug: string;
  symbol: string;
  name: string;
  /** Color vivo de marca: logos, rellenos, glows y degradados. */
  accent: string;
  /** Variante con contraste AA sobre fondo claro: texto, trazos y estados activos. */
  accentInk: string;
  accentSoft: string;
  tagline: string;
  blurb: string;
};

export const TRACKED_COINS: TrackedCoin[] = [
  {
    id: "dogecoin",
    slug: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    accent: "#F5C542",
    accentInk: "#8A6B00",
    accentSoft: "rgba(245,197,66,0.14)",
    tagline: "El abuelo del meme",
    blurb:
      "Nacida en 2013 como una parodia de Bitcoin, Dogecoin acabó siendo la meme coin más longeva y reconocible del mercado.",
  },
  {
    id: "shiba-inu",
    slug: "shiba-inu",
    symbol: "SHIB",
    name: "Shiba Inu",
    accent: "#FF7A18",
    accentInk: "#C4500A",
    accentSoft: "rgba(255,122,24,0.10)",
    tagline: "El asesino de Doge",
    blurb:
      "Token ERC-20 lanzado en 2020 con un ecosistema propio (ShibaSwap, Shibarium) construido por una comunidad enorme.",
  },
  {
    id: "pepe",
    slug: "pepe",
    symbol: "PEPE",
    name: "Pepe",
    accent: "#4ADE80",
    accentInk: "#14803F",
    accentSoft: "rgba(74,222,128,0.14)",
    tagline: "Meme puro, sin utilidad",
    blurb:
      "Lanzada en 2023 sin impuestos ni roadmap y presumiendo de ello: la tesis es el meme y nada más.",
  },
  {
    id: "bonk",
    slug: "bonk",
    symbol: "BONK",
    name: "Bonk",
    accent: "#FFB627",
    accentInk: "#9A6300",
    accentSoft: "rgba(255,182,39,0.13)",
    tagline: "El perro de Solana",
    blurb:
      "La meme coin que reactivó Solana tras el colapso de FTX, repartida por airdrop a la comunidad del ecosistema.",
  },
];

export const COIN_IDS = TRACKED_COINS.map((c) => c.id);

export function getCoinBySlug(slug: string): TrackedCoin | undefined {
  return TRACKED_COINS.find((c) => c.slug === slug);
}

export function getCoinById(id: string): TrackedCoin | undefined {
  return TRACKED_COINS.find((c) => c.id === id);
}
