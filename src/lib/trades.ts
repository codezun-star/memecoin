/**
 * Tipos y normalización de la cinta de operaciones.
 *
 * Vive aparte del hook a propósito: estas funciones son puras y las usan tanto
 * el navegador (flujo en directo) como el servidor (sondeo de respaldo), así que
 * no pueden colgar de un módulo marcado como cliente.
 */

/**
 * Cuántas operaciones se guardan en memoria.
 *
 * No es lo mismo que cuántas se enseñan. Este número alimenta la barra de
 * presión compradora, y ahí más muestras es mejor: con veinte operaciones el
 * porcentaje da saltos de veinte puntos cada pocos segundos y no dice nada.
 */
export const MAX_OPERACIONES = 120;

/**
 * Cuántas se enseñan en la tabla.
 *
 * Con cuatro monedas activas la cinta se renueva entera en menos de un minuto,
 * así que una lista larga no se llega a leer: solo alarga la página. Veinticinco
 * filas llenan aproximadamente una pantalla de escritorio, que es lo que de
 * verdad se mira. El pulso del mercado lo da la barra de presión de arriba, que
 * sí usa las 120.
 */
export const VISIBLES = 25;

export type Trade = {
  id: string;
  coinId: string;
  /** Precio de la operación. */
  price: number;
  /** Cantidad en unidades de la moneda. */
  quantity: number;
  /** Valor de la operación en la moneda de cotización. */
  value: number;
  timestamp: number;
  /**
   * Quién cruzó el mercado. `buy` = alguien compró contra las ventas
   * disponibles; `sell` = alguien vendió contra las compras.
   */
  side: "buy" | "sell";
};

export type EstadoConexion =
  /** Abriendo la conexión por primera vez. */
  | "conectando"
  /** Flujo directo abierto: cada operación llega en cuanto se ejecuta. */
  | "en-vivo"
  /** El flujo directo no está disponible y se sondea a través del servidor. */
  | "diferido"
  /** Se cayó la conexión y se está reintentando. */
  | "reconectando"
  /** No hay forma de traer operaciones ahora mismo. */
  | "error";

/**
 * Una operación agregada tal y como llega por el flujo en directo.
 *
 * Los nombres de campo de una sola letra no son cosa nuestra: es el formato del
 * mercado, pensado para ocupar lo mínimo en un flujo de miles de mensajes.
 */
type AggTradeWs = {
  e?: string;
  s?: string;
  a?: number;
  p?: string;
  q?: string;
  T?: number;
  /** true = el comprador era el creador de la orden, o sea que el agresor vendía. */
  m?: boolean;
};

/** La misma operación pedida por lotes: no trae ni evento ni símbolo. */
type AggTradeRest = {
  a?: number;
  p?: string;
  q?: string;
  T?: number;
  m?: boolean;
};

function construir(
  coinId: string,
  pair: string,
  fila: AggTradeRest,
): Trade | null {
  const price = Number(fila.p);
  const quantity = Number(fila.q);
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return null;
  if (price <= 0 || quantity <= 0) return null;

  return {
    // El identificador del agregado es estable, así que sirve para no repetir
    // una operación que llegue dos veces por caminos distintos.
    id: `${pair}-${fila.a ?? fila.T ?? 0}`,
    coinId,
    price,
    quantity,
    value: price * quantity,
    timestamp: typeof fila.T === "number" && Number.isFinite(fila.T) ? fila.T : Date.now(),
    // El mercado marca si el comprador era el creador de la orden. Si lo era,
    // quien cruzó fue el vendedor: la operación es una venta agresiva.
    side: fila.m === true ? "sell" : "buy",
  };
}

/** Convierte un mensaje del flujo en directo. Devuelve `null` si no encaja. */
export function parsearMensaje(raw: unknown, porPar: Map<string, string>): Trade | null {
  if (!raw || typeof raw !== "object") return null;

  // Los flujos combinados envuelven el dato en { stream, data }.
  const envuelto = raw as { data?: unknown };
  const dato = (envuelto.data ?? raw) as AggTradeWs;

  if (dato.e !== "aggTrade" || typeof dato.s !== "string") return null;

  const pair = dato.s.toLowerCase();
  const coinId = porPar.get(pair);
  if (!coinId) return null;

  return construir(coinId, pair, dato);
}

/** Convierte un lote pedido al servidor. Nunca lanza: lo que no encaja se cae. */
export function normalizarLote(raw: unknown, coinId: string, pair: string): Trade[] {
  if (!Array.isArray(raw)) return [];

  const salida: Trade[] = [];
  for (const fila of raw) {
    if (!fila || typeof fila !== "object") continue;
    const trade = construir(coinId, pair, fila as AggTradeRest);
    if (trade) salida.push(trade);
  }
  return salida;
}

/**
 * Mete operaciones nuevas en la lista visible.
 *
 * Tres cosas a la vez, y las tres importan: quitar las que ya estaban (el
 * respaldo por sondeo repite las últimas en cada vuelta), dejar lo más reciente
 * arriba, y cortar la lista para que no crezca sin límite en una pestaña que
 * lleve horas abierta.
 */
export function fusionar(previas: Trade[], nuevas: Trade[]): Trade[] {
  if (nuevas.length === 0) return previas;

  const vistas = new Set(previas.map((t) => t.id));
  const frescas = nuevas.filter((t) => !vistas.has(t.id));
  if (frescas.length === 0) return previas;

  return [...frescas, ...previas]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_OPERACIONES);
}
