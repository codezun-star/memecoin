/**
 * Formateo de cifras de mercado.
 *
 * Dos reglas que vienen de problemas reales:
 *
 * 1. Las meme coins viven en rangos absurdos (PEPE ~0,0000012 $, DOGE ~0,15 $),
 *    así que el número de decimales se elige según la magnitud en lugar de
 *    fijarlo. Si no, PEPE se muestra como "0,00 $".
 *
 * 2. Solo se usa Intl para la parte numérica; el símbolo y el sufijo de escala
 *    se ponen a mano. `Intl` con `style:"currency"` + `notation:"compact"` da
 *    resultados distintos en Node y en Chrome ("23,45 mil M US$" contra
 *    "23,45 mil MUS$"), y esa diferencia rompe la hidratación de React además
 *    de leerse fatal.
 */

const LOCALE = "es-ES";

function decimals(value: number, maximumFractionDigits: number, minimumFractionDigits = 2): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatPrice(value: number | null | undefined): string {
  if (!isNumber(value)) return "—";

  let maxFraction: number;
  if (Math.abs(value) >= 1000) maxFraction = 2;
  else if (Math.abs(value) >= 1) maxFraction = 4;
  else if (Math.abs(value) >= 0.01) maxFraction = 5;
  else if (Math.abs(value) >= 0.0001) maxFraction = 7;
  else maxFraction = 10;

  return `${decimals(value, maxFraction)} $`;
}

/** Escala en español: mil, M (millón), mil M, B (billón). */
const SCALES = [
  { limit: 1e12, divisor: 1e12, suffix: "B" },
  { limit: 1e9, divisor: 1e9, suffix: "mil M" },
  { limit: 1e6, divisor: 1e6, suffix: "M" },
  { limit: 1e3, divisor: 1e3, suffix: "mil" },
] as const;

function compact(value: number): string {
  const abs = Math.abs(value);
  for (const scale of SCALES) {
    if (abs >= scale.limit) {
      return `${decimals(value / scale.divisor, 2)} ${scale.suffix}`;
    }
  }
  return decimals(value, 2);
}

/** Importe grande abreviado: "23,45 mil M $". */
export function formatCompact(value: number | null | undefined): string {
  if (!isNumber(value)) return "—";
  return `${compact(value)} $`;
}

/** Cantidad grande abreviada sin moneda: "420,69 B" tokens. */
export function formatNumber(value: number | null | undefined): string {
  if (!isNumber(value)) return "—";
  return compact(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (!isNumber(value)) return "—";

  // Signo menos tipográfico (U+2212), que se alinea con las cifras.
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${decimals(Math.abs(value), 2)} %`;
}

export type PriceDirection = "up" | "down" | "flat";

export function directionOf(value: number | null | undefined): PriceDirection {
  if (!isNumber(value) || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}
