import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MAX_OPERACIONES,
  fusionar,
  normalizarLote,
  normalizarLoteGate,
  parsearMensaje,
} from "./trades";

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

// ---- Mercado secundario -----------------------------------------------------
//
// Este mercado solo se consulta desde el servidor, por lotes: no hay conexión
// directa desde el navegador (ver la nota de `use-live-trades.ts`).

function loteGate(extra: Record<string, unknown> = {}) {
  return [
    {
      id: 309143071,
      create_time: 1606292218,
      create_time_ms: "1606292218213.4578",
      side: "sell",
      amount: "16.47",
      price: "0.47",
      ...extra,
    },
  ];
}

test("el mercado secundario trae el lado ya resuelto, sin deducirlo", () => {
  // En el principal hay que mirar si el comprador era el creador de la orden;
  // aquí viene dicho, y el mapeo tiene que respetarlo tal cual.
  assert.equal(normalizarLoteGate(loteGate({ side: "sell" }), "mog-coin", "MOG_USDT")[0].side, "sell");
  assert.equal(normalizarLoteGate(loteGate({ side: "buy" }), "mog-coin", "MOG_USDT")[0].side, "buy");
});

test("normalizarLoteGate resuelve la moneda y los importes", () => {
  const [trade] = normalizarLoteGate(loteGate(), "mog-coin", "MOG_USDT");
  assert.ok(trade);
  assert.equal(trade.coinId, "mog-coin");
  assert.equal(trade.price, 0.47);
  assert.equal(trade.quantity, 16.47);
  assert.equal(Math.round(trade.value * 100) / 100, 7.74);
});

test("el milisegundo del secundario llega como cadena con decimales", () => {
  assert.equal(normalizarLoteGate(loteGate(), "mog-coin", "MOG_USDT")[0].timestamp, 1606292218213);

  // Sin milisegundos, se cae a los segundos y se escala.
  const soloSegundos = normalizarLoteGate(
    loteGate({ create_time_ms: undefined }),
    "mog-coin",
    "MOG_USDT",
  );
  assert.equal(soloSegundos[0].timestamp, 1606292218000);
});

test("los dos mercados producen la misma forma de operación", () => {
  const delPrincipal = parsearMensaje(mensaje(), POR_PAR);
  const [delSecundario] = normalizarLoteGate(loteGate(), "mog-coin", "MOG_USDT");

  assert.ok(delPrincipal && delSecundario);
  assert.deepEqual(Object.keys(delPrincipal).sort(), Object.keys(delSecundario).sort());
});

test("las operaciones de ambos mercados se fusionan en una sola cinta", () => {
  const a = parsearMensaje(mensaje({ T: 100 }), POR_PAR)!;
  const [b] = normalizarLoteGate(
    loteGate({ id: 7, create_time_ms: "300" }),
    "mog-coin",
    "MOG_USDT",
  );

  const cinta = fusionar([a], [b]);
  assert.equal(cinta.length, 2);
  // Lo más reciente arriba, venga del mercado que venga.
  assert.equal(cinta[0].coinId, "mog-coin");
  assert.equal(cinta[1].coinId, "dogecoin");
});

test("normalizarLoteGate convierte el formato por lotes del secundario", () => {
  const lote = normalizarLoteGate(
    [
      { id: 1, create_time_ms: "1000", side: "buy", amount: "2", price: "3" },
      { id: 2, create_time_ms: "2000", side: "sell", amount: "1", price: "5" },
      { id: 3, create_time_ms: "3000", side: "buy", amount: "no-válido", price: "5" },
    ],
    "mog-coin",
    "MOG_USDT",
  );

  assert.equal(lote.length, 2, "la fila con importe inválido se descarta");
  assert.equal(lote[0].id, "MOG_USDT-1");
  assert.equal(lote[0].value, 6);
  assert.equal(lote[1].side, "sell");
});

test("normalizarLoteGate nunca lanza con basura", () => {
  assert.deepEqual(normalizarLoteGate(null, "mog-coin", "MOG_USDT"), []);
  assert.deepEqual(normalizarLoteGate({ label: "error" }, "mog-coin", "MOG_USDT"), []);
  assert.deepEqual(normalizarLoteGate([null, 7, "x"], "mog-coin", "MOG_USDT"), []);
});
