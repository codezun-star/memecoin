/**
 * Registro de las monedas trackeadas.
 *
 * `id` es el identificador de CoinGecko y también la PK de la tabla `coins` en
 * Supabase, para que ambos lados hablen el mismo idioma sin tabla de mapeo.
 *
 * Añadir una moneda = una entrada aquí + una fila en una migración SQL.
 * Después ejecuta `npm run coins:verify` para confirmar contra CoinGecko que el
 * `id` existe: si te equivocas, la moneda no da error, simplemente aparece con
 * los datos vacíos para siempre.
 *
 * Los colores: `accent` es el vivo (logos, franjas, rellenos) y `accentInk` la
 * variante con contraste AA para texto y trazos. Las variantes `accentInk` están
 * generadas oscureciendo el tono hasta pasar 4,6:1 sobre crema y sobre blanco,
 * no elegidas a ojo; `src/lib/coins.test.ts` lo vuelve a comprobar en cada test.
 */

const COINS = [
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    accent: "#F5C542",
    accentInk: "#926C04",
    featured: true,
    tradePair: "dogeusdt",
    tagline: "El abuelo del meme",
    blurb:
      "Nacida en 2013 como una parodia de Bitcoin, Dogecoin acabó siendo la meme coin más longeva y reconocible del mercado.",
  },
  {
    id: "shiba-inu",
    symbol: "SHIB",
    name: "Shiba Inu",
    accent: "#FF7A18",
    accentInk: "#BE5000",
    featured: true,
    tradePair: "shibusdt",
    tagline: "El asesino de Doge",
    blurb:
      "Token ERC-20 lanzado en 2020 con un ecosistema propio (ShibaSwap, Shibarium) construido por una comunidad enorme.",
  },
  {
    id: "pepe",
    symbol: "PEPE",
    name: "Pepe",
    accent: "#4ADE80",
    accentInk: "#15843E",
    featured: true,
    tradePair: "pepeusdt",
    tagline: "Meme puro, sin utilidad",
    blurb:
      "Lanzada en 2023 sin impuestos ni roadmap y presumiendo de ello: la tesis es el meme y nada más.",
  },
  {
    id: "bonk",
    symbol: "BONK",
    name: "Bonk",
    accent: "#FFB627",
    accentInk: "#9C6700",
    featured: true,
    tradePair: "bonkusdt",
    tagline: "El perro de Solana",
    blurb:
      "La meme coin que reactivó Solana tras el colapso de FTX, repartida por airdrop a la comunidad del ecosistema.",
  },
  {
    id: "dogwifcoin",
    symbol: "WIF",
    name: "dogwifhat",
    accent: "#F77FD0",
    accentInk: "#D70894",
    featured: false,
    tradePair: "wifusdt",
    tagline: "Un perro con gorro",
    blurb:
      "Un shiba con un gorro de lana rosa. Nació en Solana a finales de 2023 y demostró que no hace falta nada más que una buena imagen.",
  },
  {
    id: "floki",
    symbol: "FLOKI",
    name: "Floki",
    accent: "#F2601C",
    accentInk: "#CA4507",
    featured: false,
    tradePair: "flokiusdt",
    tagline: "El vikingo",
    blurb:
      "Bautizada por el perro de Elon Musk, es de las pocas meme coins que ha construido producto propio alrededor del token.",
  },
  {
    id: "based-brett",
    symbol: "BRETT",
    name: "Brett",
    accent: "#3B6BF5",
    accentInk: "#3165FA",
    featured: false,
    tagline: "El colega de Pepe",
    blurb:
      "Personaje del mismo cómic que Pepe, convertido en la meme coin insignia de la red Base en 2024.",
  },
  {
    id: "popcat",
    symbol: "POPCAT",
    name: "Popcat",
    accent: "#A77BF3",
    accentInk: "#884BF3",
    featured: false,
    tradePair: "popcatusdt",
    tagline: "Pop, pop, pop",
    blurb:
      "El gato que abre la boca, uno de los memes más clicados de internet, convertido en token de Solana.",
  },
  {
    id: "mog-coin",
    symbol: "MOG",
    name: "Mog Coin",
    accent: "#E94BD6",
    accentInk: "#CE14B8",
    featured: false,
    tagline: "Estética vaporwave",
    blurb:
      "Meme coin de Ethereum construida alrededor de la cultura del 'mogging' y una estética retro muy reconocible.",
  },
  {
    id: "book-of-meme",
    symbol: "BOME",
    name: "Book of Meme",
    accent: "#9E4B3C",
    accentInk: "#A0493A",
    featured: false,
    tradePair: "bomeusdt",
    tagline: "El archivo del meme",
    blurb:
      "Lanzada en Solana en marzo de 2024, fue de las más rápidas de la historia en alcanzar los mil millones de capitalización.",
  },
  {
    id: "baby-doge-coin",
    symbol: "BABYDOGE",
    name: "Baby Doge Coin",
    accent: "#58B7F0",
    accentInk: "#0C77B7",
    featured: false,
    tagline: "El cachorro",
    blurb:
      "Derivada de la comunidad de Dogecoin en 2021, destaca por tener una de las bases de holders más grandes del sector.",
  },
  {
    id: "spx6900",
    symbol: "SPX",
    name: "SPX6900",
    accent: "#9DC42B",
    accentInk: "#627B18",
    featured: false,
    tagline: "Deja de operar, cree",
    blurb:
      "Parodia del índice S&P 500 cuya única propuesta es superarlo. El chiste es la tesis de inversión.",
  },
  {
    id: "fartcoin",
    symbol: "FARTCOIN",
    name: "Fartcoin",
    accent: "#E8C93A",
    accentInk: "#87710C",
    featured: false,
    tagline: "Sin comentarios",
    blurb:
      "Surgida a finales de 2024 del ecosistema de agentes de IA en Solana. El nombre lo dice todo.",
  },
  {
    id: "peanut-the-squirrel",
    symbol: "PNUT",
    name: "Peanut the Squirrel",
    accent: "#C97B3C",
    accentInk: "#A5612A",
    featured: false,
    tradePair: "pnutusdt",
    tagline: "En memoria de Peanut",
    blurb:
      "Nacida en noviembre de 2024 como homenaje a Peanut, la ardilla mascota sacrificada por las autoridades de Nueva York.",
  },
  {
    id: "goatseus-maximus",
    symbol: "GOAT",
    name: "Goatseus Maximus",
    accent: "#24C4A0",
    accentInk: "#147F67",
    featured: false,
    tagline: "La moneda del bot",
    blurb:
      "La primera meme coin impulsada por un agente de inteligencia artificial, Truth Terminal, en octubre de 2024.",
  },
  {
    id: "cat-in-a-dogs-world",
    symbol: "MEW",
    name: "cat in a dogs world",
    accent: "#C36BF5",
    accentInk: "#AC2AF6",
    featured: false,
    tradePair: "mewusdt",
    tagline: "Un gato entre perros",
    blurb:
      "Su tesis está en el nombre: casi todas las meme coins grandes son perros, así que aquí va un gato.",
  },
  {
    id: "pudgy-penguins",
    symbol: "PENGU",
    name: "Pudgy Penguins",
    accent: "#3FC5E0",
    accentInk: "#147C91",
    featured: false,
    tradePair: "penguusdt",
    tagline: "Los pingüinos",
    blurb:
      "Token de la colección de NFTs Pudgy Penguins, una de las pocas marcas cripto que ha llegado al mundo físico.",
  },
  {
    id: "notcoin",
    symbol: "NOT",
    name: "Notcoin",
    accent: "#2E9BE6",
    accentInk: "#1277BD",
    featured: false,
    tradePair: "notusdt",
    tagline: "De tocar la pantalla",
    blurb:
      "Nació como un juego de clics dentro de Telegram y arrastró a millones de personas a la red TON en 2024.",
  },
  {
    id: "turbo",
    symbol: "TURBO",
    name: "Turbo",
    accent: "#7C6BF5",
    accentInk: "#6C59F8",
    featured: false,
    tradePair: "turbousdt",
    tagline: "Diseñada por una IA",
    blurb:
      "El experimento de crear una meme coin siguiendo las instrucciones de un modelo de lenguaje. Funcionó.",
  },
  {
    id: "apu-apustaja",
    symbol: "APU",
    name: "Apu Apustaja",
    accent: "#7CB342",
    accentInk: "#557D2B",
    featured: false,
    tagline: "El amigo de Pepe",
    blurb:
      "Otra rana del mismo universo de cómics que Pepe, con su propia comunidad en Ethereum.",
  },
] as const;

export type CoinKey = (typeof COINS)[number]["id"];

export type TrackedCoin = {
  id: CoinKey;
  slug: string;
  symbol: string;
  name: string;
  /** Color vivo de marca: logos, rellenos, glows y degradados. */
  accent: string;
  /** Variante con contraste AA sobre fondo claro: texto, trazos y estados activos. */
  accentInk: string;
  /** Se muestra en la navegación de la cabecera y en el pie. */
  featured: boolean;
  /**
   * Par de Binance para el flujo de operaciones en vivo, en minúsculas.
   * Ausente = la moneda no aparece en la cinta de operaciones.
   * Verifica los símbolos con `npm run pairs:verify` antes de fiarte de ellos.
   */
  tradePair?: string;
  tagline: string;
  blurb: string;
};

/** El slug de la URL es el propio id de CoinGecko: ya es único y legible. */
export const TRACKED_COINS: TrackedCoin[] = COINS.map((coin) => ({ ...coin, slug: coin.id }));

export const COIN_IDS: CoinKey[] = TRACKED_COINS.map((c) => c.id as CoinKey);

export const FEATURED_COINS = TRACKED_COINS.filter((c) => c.featured);

/** Monedas con par de mercado, las únicas que pueden aparecer en la cinta en vivo. */
export const TRADABLE_COINS = TRACKED_COINS.filter(
  (c): c is TrackedCoin & { tradePair: string } => Boolean(c.tradePair),
);

export function getCoinBySlug(slug: string): TrackedCoin | undefined {
  return TRACKED_COINS.find((c) => c.slug === slug);
}

export function getCoinById(id: string): TrackedCoin | undefined {
  return TRACKED_COINS.find((c) => c.id === id);
}
