/**
 * Cálculo de contraste WCAG.
 *
 * Existe para que la afirmación "todos los colores de texto pasan AA" de
 * DESIGN.md sea comprobable en cada test, y no una nota de buenas intenciones
 * que se queda obsoleta a la tercera moneda que se añade.
 */

export const CANVAS = "#FFFBF3";
export const SURFACE = "#FFFFFF";

/** Umbral WCAG AA para texto normal. */
export const AA = 4.5;

function channels(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`Color hexadecimal inválido: ${hex}`);
  }
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
