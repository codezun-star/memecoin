import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_OPERACIONES, fusionar, normalizarLote, parsearMensaje } from "./trades";

const POR_PAR = new Map([
  ["dogeusdt", "dogecoin"],
  ["shibusdt", "shiba-inu"],
]);

function mensaje(extra: Record<string, unknown> = {}) {
  return {
    stream: "dogeusdt@aggTrade",
    data: { e: "aggTrade", s: "DOGEUSDT", a: 1, p: "0.15", q: "100", T: 1_700_000_000_000, m: false, ...extra },
  };
}

test("parsearMensaje desenvuelve los flujos combinados", () => {
  const trade = parsearMensaje(mensaje(), POR_PAR);
  assert.ok(trade);
  assert.equal(trade.coinId, "dogecoin");
  assert.equal(trade.price, 0.15);
  assert.equal(trade.quantity, 100);
  assert.equal(trade.value, 15);
  assert.equal(trade.timestamp, 1_700_000_000_000);
});

test("parsearMensaje acepta también el flujo sin envolver", () => {
  const trade = parsearMensaje(mensaje().data, POR_PAR);
  assert.ok(trade);
  assert.equal(trade.coinId, "dogecoin");
});

test("m=true es una venta agresiva, m=false una compra", () => {
  assert.equal(parsearMensaje(mensaje({ m: true }), POR_PAR)?.side, "sell");
  assert.equal(parsearMensaje(mensaje({ m: false }), POR_PAR)?.side, "buy");
});

test("parsearMensaje descarta lo que no es una operación", () => {
  assert.equal(parsearMensaje(null, POR_PAR), null);
  assert.equal(parsearMensaje("texto", POR_PAR), null);
  assert.equal(parsearMensaje(mensaje({ e: "kline" }), POR_PAR), null);
  // Un par que no seguimos: llegaría por una suscripción vieja tras reconectar.
  assert.equal(parsearMensaje(mensaje({ s: "BTCUSDT" }), POR_PAR), null);
});

test("parsearMensaje descarta números imposibles", () => {
  assert.equal(parsearMensaje(mensaje({ p: "no-es-un-numero" }), POR_PAR), null);
  assert.equal(parsearMensaje(mensaje({ q: "0" }), POR_PAR), null);
  assert.equal(parsearMensaje(mensaje({ p: "-1" }), POR_PAR), null);
});

test("normalizarLote convierte el formato por lotes, que no trae símbolo", () => {
  const lote = normalizarLote(
    [
      { a: 10, p: "0.20", q: "50", T: 1_700_000_000_000, m: true },
      { a: 11, p: "0.21", q: "10", T: 1_700_000_001_000, m: false },
    ],
    "dogecoin",
    "dogeusdt",
  );

  assert.equal(lote.length, 2);
  assert.equal(lote[0].id, "dogeusdt-10");
  assert.equal(lote[0].side, "sell");
  assert.equal(lote[1].side, "buy");
  assert.equal(lote[1].value, 2.1);
});

test("normalizarLote nunca lanza con basura", () => {
  assert.deepEqual(normalizarLote(null, "dogecoin", "dogeusdt"), []);
  assert.deepEqual(normalizarLote({ error: "algo" }, "dogecoin", "dogeusdt"), []);
  assert.deepEqual(normalizarLote([null, 7, "x"], "dogecoin", "dogeusdt"), []);
});

test("fusionar no repite operaciones ya vistas", () => {
  const previas = normalizarLote([{ a: 1, p: "1", q: "1", T: 100 }], "dogecoin", "dogeusdt");
  const iguales = normalizarLote([{ a: 1, p: "1", q: "1", T: 100 }], "dogecoin", "dogeusdt");

  // Identidad, no solo longitud: si no hay nada nuevo React no debe re-renderizar.
  assert.equal(fusionar(previas, iguales), previas);
  assert.equal(fusionar(previas, []), previas);
});

test("fusionar deja lo más reciente arriba", () => {
  const previas = normalizarLote([{ a: 1, p: "1", q: "1", T: 100 }], "dogecoin", "dogeusdt");
  const nuevas = normalizarLote(
    [
      { a: 2, p: "1", q: "1", T: 50 },
      { a: 3, p: "1", q: "1", T: 300 },
    ],
    "dogecoin",
    "dogeusdt",
  );

  const salida = fusionar(previas, nuevas);
  assert.deepEqual(
    salida.map((t) => t.timestamp),
    [300, 100, 50],
  );
});

test("fusionar corta la lista para que no crezca sin límite", () => {
  const muchas = normalizarLote(
    Array.from({ length: MAX_OPERACIONES * 3 }, (_, i) => ({
      a: i,
      p: "1",
      q: "1",
      T: 1000 + i,
    })),
    "dogecoin",
    "dogeusdt",
  );

  assert.equal(fusionar([], muchas).length, MAX_OPERACIONES);
});
