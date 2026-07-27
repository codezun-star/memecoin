/**
 * Formateo de cifras de mercado.
 *
 * Las meme coins viven en rangos absurdos (PEPE ~0.0000012 $, DOGE ~0.15 $), así
 * que el número de decimales se elige según la magnitud en lugar de fijarlo.
 */

const LOCALE = "es-ES";

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";

  let maximumFractionDigits: number;
  if (value >= 1000) maximumFractionDigits = 2;
  else if (value >= 1) maximumFractionDigits = 4;
  else if (value >= 0.01) maximumFractionDigits = 5;
  else if (value >= 0.0001) maximumFractionDigits = 7;
  else maximumFractionDigits = 10;

  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 2 }).format(
    value,
  );
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";

  // Mismo separador decimal que los precios: se leen juntos en la misma tarjeta.
  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  // Signo menos tipográfico (U+2212), que se alinea con las cifras.
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatted} %`;
}

export type PriceDirection = "up" | "down" | "flat";

export function directionOf(value: number | null | undefined): PriceDirection {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}
