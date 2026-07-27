import assert from "node:assert/strict";
import { test, describe } from "node:test";

import { normalizeMarket, normalizeChart } from "@/lib/coingecko";
import {
  formatPrice,
  formatCompact,
  formatNumber,
  formatPercent,
  directionOf,
} from "@/lib/format";

/**
 * Fixture con la forma real de una fila de GET /coins/markets.
 * Los valores son de un orden de magnitud realista para cada moneda.
 */
const PEPE_ROW = {
  id: "pepe",
  symbol: "pepe",
  name: "Pepe",
  image: "https://coin-images.coingecko.com/coins/images/29850/large/pepe.png",
  current_price: 0.00000123456,
  market_cap: 5194320000,
  market_cap_rank: 28,
  fully_diluted_valuation: 5194320000,
  total_volume: 812450000,
  high_24h: 0.0000013012,
  low_24h: 0.0000011876,
  price_change_24h: 0.0000000412,
  price_change_percentage_24h: 3.4512,
  market_cap_change_24h: 173000000,
  circulating_supply: 420690000000000,
  total_supply: 420690000000000,
  max_supply: null,
  ath: 0.00002825,
  ath_change_percentage: -95.63,
  ath_date: "2024-12-09T06:35:12.518Z",
  atl: 0.00000005,
  last_updated: "2026-07-27T18:42:01.123Z",
  price_change_percentage_7d_in_currency: -4.221,
  sparkline_in_7d: { price: [0.00000129, 0.00000131, 0.00000125, 0.00000123] },
};

describe("normalizeMarket", () => {
  test("mapea una fila completa sin perder ni deformar campos", () => {
    const m = normalizeMarket(PEPE_ROW);
    assert.ok(m, "debería normalizar una fila válida");

    assert.equal(m.id, "pepe");
    assert.equal(m.symbol, "PEPE", "el símbolo se normaliza a mayúsculas");
    assert.equal(m.current_price, 0.00000123456);
    assert.equal(m.market_cap, 5194320000);
    assert.equal(m.market_cap_rank, 28);
    assert.equal(m.total_volume, 812450000);
    assert.equal(m.price_change_percentage_24h, 3.4512);
    assert.equal(m.price_change_percentage_7d_in_currency, -4.221);
    assert.equal(m.circulating_supply, 420690000000000);
    assert.equal(m.ath, 0.00002825);
    assert.equal(m.image, PEPE_ROW.image);
    assert.deepEqual(m.sparkline_in_7d?.price, PEPE_ROW.sparkline_in_7d.price);
  });

  test("descarta monedas que no trackeamos", () => {
    assert.equal(normalizeMarket({ ...PEPE_ROW, id: "bitcoin" }), null);
  });

  test("acepta números que lleguen como string", () => {
    const m = normalizeMarket({ ...PEPE_ROW, current_price: "0.0000018", market_cap: "123" });
    assert.equal(m?.current_price, 0.0000018);
    assert.equal(m?.market_cap, 123);
  });

  test("convierte a null cualquier campo numérico corrupto en vez de propagar NaN", () => {
    const m = normalizeMarket({
      ...PEPE_ROW,
      current_price: null,
      market_cap: "no-soy-un-numero",
      total_volume: undefined,
      high_24h: NaN,
      low_24h: Infinity,
    });
    assert.ok(m);
    for (const field of ["current_price", "market_cap", "total_volume", "high_24h", "low_24h"] as const) {
      assert.equal(m[field], null, `${field} debería ser null`);
      // Lo que de verdad importa: nunca se pinta "NaN" en pantalla.
      assert.equal(formatPrice(m[field]), "—");
    }
  });

  test("cae al nombre y símbolo del registro si la API los omite", () => {
    const m = normalizeMarket({ id: "bonk" });
    assert.equal(m?.symbol, "BONK");
    assert.equal(m?.name, "Bonk");
    assert.equal(m?.current_price, null);
    assert.equal(m?.image, null);
  });

  test("ignora un sparkline inservible", () => {
    assert.equal(normalizeMarket({ ...PEPE_ROW, sparkline_in_7d: { price: [] } })?.sparkline_in_7d, null);
    assert.equal(normalizeMarket({ ...PEPE_ROW, sparkline_in_7d: null })?.sparkline_in_7d, null);
    // Un solo punto no dibuja una línea.
    assert.equal(
      normalizeMarket({ ...PEPE_ROW, sparkline_in_7d: { price: [1] } })?.sparkline_in_7d,
      null,
    );
  });

  test("no revienta con basura", () => {
    for (const junk of [null, undefined, 42, "hola", [], {}]) {
      assert.equal(normalizeMarket(junk), null);
    }
  });
});

describe("normalizeChart", () => {
  test("convierte los pares [ts, precio] y los deja ordenados en el tiempo", () => {
    const chart = normalizeChart({
      prices: [
        [1750000200000, 0.16],
        [1750000000000, 0.15], // llega desordenado a propósito
        [1750000400000, 0.17],
      ],
    });
    assert.deepEqual(chart?.prices.map(([t]) => t), [
      1750000000000, 1750000200000, 1750000400000,
    ]);
  });

  test("descarta puntos malformados y devuelve null si no queda serie", () => {
    const chart = normalizeChart({
      prices: [[1750000000000, 0.15], [1750000200000, null], ["x"], [1750000400000, 0.17]],
    });
    assert.equal(chart?.prices.length, 2);

    assert.equal(normalizeChart({ prices: [[1, 0.1]] }), null, "un punto no es una serie");
    assert.equal(normalizeChart({ prices: "nope" }), null);
    assert.equal(normalizeChart(null), null);
  });
});

describe("formato de cifras", () => {
  test("mantiene la precisión en los rangos de cada meme coin", () => {
    // El riesgo real: que PEPE se muestre como 0,00 $ por redondeo.
    assert.equal(formatPrice(0.00000123456), "0,0000012346 $");
    assert.equal(formatPrice(0.00002891), "0,00002891 $");
    assert.equal(formatPrice(0.00123), "0,00123 $", "el tramo 0,0001-0,01 usa 7 decimales");
    assert.equal(formatPrice(0.1573), "0,1573 $");
    assert.equal(formatPrice(3421.77), "3421,77 $");
  });

  test("abrevia las cifras grandes con la escala española", () => {
    assert.equal(formatCompact(23_450_000_000), "23,45 mil M $");
    assert.equal(formatCompact(5_194_320_000), "5,19 mil M $");
    assert.equal(formatCompact(812_450_000), "812,45 M $");
    assert.equal(formatCompact(1_234), "1,23 mil $");
    assert.equal(formatNumber(420_690_000_000_000), "420,69 B");
  });

  test("el formato no depende del ICU del motor", () => {
    // Intl con style:"currency" + notation:"compact" difiere entre Node y
    // Chrome, y esa diferencia rompía la hidratación. Aquí se comprueba que la
    // salida se compone a mano: número de Intl + sufijo y símbolo propios.
    for (const out of [formatCompact(23_450_000_000), formatPrice(0.1573), formatNumber(1e12)]) {
      assert.ok(!out.includes("US$"), `no debe usar el símbolo compuesto de Intl: ${out}`);
      assert.ok(!/\u00a0|\u202f/.test(out), `no debe llevar espacios duros de Intl: ${out}`);
    }
  });

  test("los no-números se muestran como raya, nunca como NaN", () => {
    for (const v of [null, undefined, NaN, Infinity]) {
      assert.equal(formatPrice(v), "—");
      assert.equal(formatCompact(v), "—");
      assert.equal(formatPercent(v), "—");
    }
  });

  test("el porcentaje lleva signo explícito y separador decimal español", () => {
    assert.equal(formatPercent(3.4512), "+3,45 %");
    assert.equal(formatPercent(-4.221), "−4,22 %");
    assert.equal(formatPercent(0), "0,00 %");
  });

  test("la dirección distingue subida, bajada y plano", () => {
    assert.equal(directionOf(3.45), "up");
    assert.equal(directionOf(-0.01), "down");
    assert.equal(directionOf(0), "flat");
    assert.equal(directionOf(null), "flat");
  });
});
