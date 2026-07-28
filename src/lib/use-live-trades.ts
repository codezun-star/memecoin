"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Operaciones en vivo desde el WebSocket público de Binance.
 *
 * La conexión la abre **el navegador de cada visitante**, no nuestro servidor.
 * Es una decisión deliberada:
 *
 *  - Una cinta de operaciones necesita latencia de milisegundos. Sondear un
 *    endpoint nuestro cada pocos segundos daría una lista de cosas que ya
 *    pasaron, no un directo.
 *  - Retransmitir el flujo desde el servidor obligaría a mantener una conexión
 *    persistente por visitante, que es justo lo que un despliegue sin servidor
 *    dedicado no puede sostener.
 *  - El flujo es público y no lleva credenciales, así que no hay nada que
 *    proteger detrás de un intermediario.
 *
 * A cambio hay que ser honesto sobre qué se está viendo: **las operaciones de
 * un solo mercado**, no de todo el mundo. Se etiqueta como tal en la interfaz.
 */

const WS_BASE =
  process.env.NEXT_PUBLIC_TRADES_WS ?? "wss://stream.binance.com:9443/stream?streams=";

/** Cuántas operaciones se conservan en pantalla. Más allá, la lista solo pesa. */
const MAX_OPERACIONES = 60;

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

export type EstadoConexion = "conectando" | "en-vivo" | "reconectando" | "error";

type AggTrade = {
  e?: string;
  s?: string;
  a?: number;
  p?: string;
  q?: string;
  T?: number;
  /** true = el comprador era el creador de la orden, o sea que el agresor vendía. */
  m?: boolean;
};

function parsear(raw: unknown, porPar: Map<string, string>): Trade | null {
  if (!raw || typeof raw !== "object") return null;

  // Los flujos combinados envuelven el dato en { stream, data }.
  const envuelto = raw as { data?: unknown; stream?: unknown };
  const dato = (envuelto.data ?? raw) as AggTrade;

  if (dato.e !== "aggTrade" || typeof dato.s !== "string") return null;

  const coinId = porPar.get(dato.s.toLowerCase());
  if (!coinId) return null;

  const price = Number(dato.p);
  const quantity = Number(dato.q);
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return null;

  return {
    id: `${dato.s}-${dato.a ?? dato.T ?? Date.now()}`,
    coinId,
    price,
    quantity,
    value: price * quantity,
    timestamp: typeof dato.T === "number" ? dato.T : Date.now(),
    // Binance marca si el comprador era el creador de la orden. Si lo era, quien
    // cruzó el mercado fue el vendedor: la operación es una venta agresiva.
    side: dato.m === true ? "sell" : "buy",
  };
}

export function useLiveTrades(pares: { coinId: string; pair: string }[]) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [estado, setEstado] = useState<EstadoConexion>("conectando");

  const socketRef = useRef<WebSocket | null>(null);
  const reintentoRef = useRef(0);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desmontadoRef = useRef(false);

  // Clave estable: si cambia la lista de pares hay que reconectar, pero un
  // array nuevo con el mismo contenido no debe disparar nada.
  const clave = pares.map((p) => p.pair).sort().join(",");

  const conectar = useCallback(() => {
    if (typeof window === "undefined" || pares.length === 0) return;

    const porPar = new Map(pares.map((p) => [p.pair.toLowerCase(), p.coinId]));
    const streams = pares.map((p) => `${p.pair.toLowerCase()}@aggTrade`).join("/");

    let socket: WebSocket;
    try {
      socket = new WebSocket(`${WS_BASE}${streams}`);
    } catch {
      setEstado("error");
      return;
    }

    socketRef.current = socket;

    socket.onopen = () => {
      reintentoRef.current = 0;
      setEstado("en-vivo");
    };

    socket.onmessage = (event) => {
      let payload: unknown;
      try {
        payload = JSON.parse(event.data as string);
      } catch {
        return;
      }

      const trade = parsear(payload, porPar);
      if (!trade) return;

      setTrades((previas) => {
        // Un mismo agregado puede llegar repetido en una reconexión.
        if (previas.length > 0 && previas[0].id === trade.id) return previas;
        return [trade, ...previas].slice(0, MAX_OPERACIONES);
      });
    };

    socket.onerror = () => {
      // El cierre llega justo después; se gestiona ahí para no duplicar avisos.
    };

    socket.onclose = () => {
      if (desmontadoRef.current) return;

      setEstado("reconectando");

      // Espera creciente hasta 30 s: si el mercado o la red están caídos, no
      // tiene sentido martillear con reintentos cada segundo.
      const espera = Math.min(30_000, 1000 * 2 ** reintentoRef.current);
      reintentoRef.current += 1;
      temporizadorRef.current = setTimeout(conectar, espera);
    };
    // `clave` cubre el contenido de `pares`; incluir el array rompería la memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  useEffect(() => {
    desmontadoRef.current = false;
    setTrades([]);
    conectar();

    return () => {
      desmontadoRef.current = true;
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [conectar]);

  return { trades, estado };
}
