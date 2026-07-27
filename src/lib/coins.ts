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
  /** Clase Tailwind del color de marca, para clases estáticas que Tailwind pueda purgar. */
  accent: string;
  accentSoft: string;
  accentDeep: string;
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
    accentSoft: "rgba(245,197,66,0.12)",
    accentDeep: "#A8830F",
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
    accentSoft: "rgba(255,122,24,0.12)",
    accentDeep: "#B44A00",
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
    accentSoft: "rgba(74,222,128,0.12)",
    accentDeep: "#1C8F4B",
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
    accentSoft: "rgba(255,182,39,0.12)",
    accentDeep: "#B87700",
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
