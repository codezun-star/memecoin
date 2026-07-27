"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CoinMarket } from "@/lib/coingecko";
import type { MarketsPayload } from "@/app/api/markets/route";

/** Cada cuánto pregunta el cliente. El servidor agrupa a 15 s, así que sondear más rápido no aporta. */
const POLL_MS = 20_000;

export type LiveMarketsState = {
  markets: CoinMarket[] | null;
  byId: Map<string, CoinMarket>;
  /** Momento del último dato bueno. null si nunca se ha conseguido ninguno. */
  updatedAt: number | null;
  status: "live" | "stale" | "error";
  refresh: () => void;
};

/**
 * Mantiene los precios frescos sondeando /api/markets.
 *
 * - Arranca con los datos que ya renderizó el servidor, así que no hay salto
 *   visual ni un primer frame vacío.
 * - Se detiene cuando la pestaña no está visible y refresca al volver: no tiene
 *   sentido gastar peticiones contra una pestaña en segundo plano.
 * - Si una ronda falla, conserva el último dato bueno y lo marca como "stale"
 *   en vez de vaciar la pantalla.
 */
export function useLiveMarkets(initial: CoinMarket[] | null): LiveMarketsState {
  const [markets, setMarkets] = useState<CoinMarket[] | null>(initial);
  /**
   * Arranca en null a propósito. Si aquí se pusiera Date.now(), el servidor y el
   * cliente calcularían instantes distintos y el "hace X s" rompería la
   * hidratación (React #418). Lo rellena el primer sondeo, que sale nada más
   * montar, así que el hueco dura milisegundos.
   */
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<"live" | "stale" | "error">(initial ? "live" : "error");

  // Evita que una respuesta lenta pise a otra más reciente.
  const requestSeq = useRef(0);

  const fetchNow = useCallback(async () => {
    const seq = ++requestSeq.current;
    try {
      const res = await fetch("/api/markets", { cache: "no-store" });
      const payload = (await res.json()) as MarketsPayload;
      if (seq !== requestSeq.current) return;

      if (payload.markets?.length) {
        setMarkets(payload.markets);
        setUpdatedAt(payload.fetchedAt);
        setStatus(payload.error ? "stale" : "live");
      } else {
        setStatus((prev) => (prev === "error" ? "error" : "stale"));
      }
    } catch {
      if (seq !== requestSeq.current) return;
      setStatus((prev) => (prev === "error" ? "error" : "stale"));
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(fetchNow, POLL_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchNow();
        start();
      } else {
        stop();
      }
    };

    // Un sondeo inmediato al montar: la página puede venir del cache del ISR y
    // llevar hasta un minuto de retraso.
    if (document.visibilityState === "visible") {
      void fetchNow();
      start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchNow]);

  const byId = new Map((markets ?? []).map((m) => [m.id, m]));

  return { markets, byId, updatedAt, status, refresh: () => void fetchNow() };
}

/** Segundos transcurridos desde `timestamp`, refrescado cada segundo. */
export function useSecondsSince(timestamp: number | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (timestamp === null) return null;
  return Math.max(0, Math.floor((now - timestamp) / 1000));
}
