import assert from "node:assert/strict";
import { test } from "node:test";

import { formatAmount, formatCompact, formatExact, formatPrice } from "./format";

test("un importe por debajo de mil se muestra entero, con céntimos", () => {
  assert.equal(formatAmount(20.31), "20,31 $");
  assert.equal(formatAmount(38.4), "38,40 $");
  assert.equal(formatAmount(999.99), "999,99 $");
});

test("a partir de mil se muestra entero y sin céntimos, no abreviado", () => {
  // Este es el caso que se prestaba a confusión: "2,43 mil $" se leía mal en una
  // columna donde la fila de al lado pone "20,31 $".
  assert.equal(formatAmount(2430.55), "2.431 $");
  assert.equal(formatAmount(1580), "1.580 $");
  assert.equal(formatAmount(999_999), "999.999 $");
});

test("solo por encima del millón se abrevia", () => {
  assert.equal(formatAmount(4_020_000), "4,02 M $");
  assert.equal(formatAmount(2_500_000_000), "2,50 mil M $");
});

test("formatExact nunca abrevia: es lo que se ve al pasar el ratón", () => {
  assert.equal(formatExact(4_020_000), "4.020.000,00 $");
  assert.equal(formatExact(20.31), "20,31 $");
});

test("los importes agregados sí se abrevian", () => {
  assert.equal(formatCompact(4020), "4,02 mil $");
  assert.equal(formatCompact(23_450_000_000), "23,45 mil M $");
});

test("el precio ajusta decimales a la magnitud", () => {
  // Sin esto, PEPE se mostraría como "0,00 $".
  assert.equal(formatPrice(0.15), "0,15 $");
  assert.equal(formatPrice(1.2345), "1,2345 $");
  assert.equal(formatPrice(0.0000046262), "0,0000046262 $");
});

test("nada de esto revienta con valores ausentes", () => {
  for (const fn of [formatAmount, formatExact, formatCompact, formatPrice]) {
    assert.equal(fn(null), "—");
    assert.equal(fn(undefined), "—");
    assert.equal(fn(Number.NaN), "—");
    assert.equal(fn(Number.POSITIVE_INFINITY), "—");
  }
});
