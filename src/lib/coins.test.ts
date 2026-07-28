import assert from "node:assert/strict";
import { test, describe } from "node:test";

import { TRACKED_COINS, FEATURED_COINS, COIN_IDS, getCoinById, getCoinBySlug } from "@/lib/coins";
import { AA, CANVAS, SURFACE, contrastRatio } from "@/lib/contrast";

const HEX = /^#[0-9A-F]{6}$/;

describe("registro de monedas", () => {
  test("hay al menos 15 monedas", () => {
    assert.ok(TRACKED_COINS.length >= 15, `solo hay ${TRACKED_COINS.length}`);
  });

  test("ids, slugs y símbolos son únicos", () => {
    for (const campo of ["id", "slug", "symbol"] as const) {
      const valores = TRACKED_COINS.map((c) => c[campo]);
      const duplicados = valores.filter((v, i) => valores.indexOf(v) !== i);
      assert.deepEqual(duplicados, [], `${campo} duplicado: ${duplicados.join(", ")}`);
    }
  });

  test("el id de CoinGecko tiene la forma que usa su API", () => {
    for (const coin of TRACKED_COINS) {
      // Minúsculas, números y guiones. Un id con mayúsculas o espacios devuelve
      // vacío en CoinGecko sin dar error, y la moneda quedaría muerta.
      assert.match(coin.id, /^[a-z0-9-]+$/, `id sospechoso: ${coin.id}`);
    }
  });

  test("las búsquedas por id y por slug encuentran todas", () => {
    for (const coin of TRACKED_COINS) {
      assert.equal(getCoinById(coin.id)?.symbol, coin.symbol);
      assert.equal(getCoinBySlug(coin.slug)?.symbol, coin.symbol);
    }
    assert.equal(getCoinById("bitcoin"), undefined);
    assert.equal(COIN_IDS.length, TRACKED_COINS.length);
  });

  test("cada moneda tiene textos propios", () => {
    for (const coin of TRACKED_COINS) {
      assert.ok(coin.name.length > 0, `${coin.id} sin nombre`);
      assert.ok(coin.tagline.length > 0, `${coin.id} sin tagline`);
      assert.ok(coin.blurb.length > 40, `${coin.id} con descripción demasiado corta`);
    }
  });

  test("hay monedas destacadas para la navegación, pero pocas", () => {
    assert.ok(FEATURED_COINS.length >= 1);
    // La cabecera no puede con veinte símbolos: si esto crece, se desborda.
    assert.ok(FEATURED_COINS.length <= 6, `${FEATURED_COINS.length} destacadas es demasiado`);
  });
});

describe("colores de marca", () => {
  test("todos los hex están bien formados", () => {
    for (const coin of TRACKED_COINS) {
      assert.match(coin.accent, HEX, `${coin.id}.accent`);
      assert.match(coin.accentInk, HEX, `${coin.id}.accentInk`);
    }
  });

  test("accentInk pasa WCAG AA sobre crema y sobre blanco", () => {
    // Esta es la prueba que evita que añadir una moneda cuele un amarillo
    // ilegible como color de texto. Ver DESIGN.md §2.2.
    for (const coin of TRACKED_COINS) {
      const sobreCrema = contrastRatio(coin.accentInk, CANVAS);
      const sobreBlanco = contrastRatio(coin.accentInk, SURFACE);

      assert.ok(
        sobreCrema >= AA,
        `${coin.id}: accentInk ${coin.accentInk} da ${sobreCrema.toFixed(2)}:1 sobre crema`,
      );
      assert.ok(
        sobreBlanco >= AA,
        `${coin.id}: accentInk ${coin.accentInk} da ${sobreBlanco.toFixed(2)}:1 sobre blanco`,
      );
    }
  });

  test("accent es más claro que accentInk", () => {
    // Si se invierten, los rellenos salen oscuros y los textos ilegibles.
    for (const coin of TRACKED_COINS) {
      assert.ok(
        contrastRatio(coin.accent, CANVAS) < contrastRatio(coin.accentInk, CANVAS),
        `${coin.id}: accent y accentInk parecen intercambiados`,
      );
    }
  });

  test("ningún accentInk se confunde con los tokens de dirección de precio", () => {
    // Verde y rojo están reservados a subida y bajada (DESIGN.md §2.5). Un color
    // de moneda demasiado parecido haría dudar de qué significa un trazo.
    const UP = "#0B7F45";
    const DOWN = "#CE1F45";
    const distancia = (a: string, b: string) => {
      const c = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      const [r1, g1, b1] = c(a);
      const [r2, g2, b2] = c(b);
      return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
    };

    for (const coin of TRACKED_COINS) {
      for (const [nombre, token] of [
        ["up", UP],
        ["down", DOWN],
      ] as const) {
        // Pepe es verde por definición y es la excepción asumida.
        if (coin.id === "pepe" && nombre === "up") continue;
        assert.ok(
          distancia(coin.accentInk, token) > 35,
          `${coin.id}: accentInk ${coin.accentInk} se parece demasiado al token ${nombre}`,
        );
      }
    }
  });
});
