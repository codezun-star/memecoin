"use client";

import { createContext, useContext } from "react";

import { useLiveMarkets, type LiveMarketsState } from "@/lib/use-live-markets";
import type { CoinMarket } from "@/lib/coingecko";

const LiveMarketsContext = createContext<LiveMarketsState | null>(null);

/**
 * Un único sondeo por página.
 *
 * En la página de detalle hay tres sitios que quieren el precio en vivo
 * (cabecera, gráfico y datos de mercado). Sin este contexto, cada uno montaría
 * su propio intervalo y triplicaría las peticiones para el mismo dato.
 */
export function LiveMarketsProvider({
  initialMarkets,
  children,
}: {
  initialMarkets: CoinMarket[] | null;
  children: React.ReactNode;
}) {
  const state = useLiveMarkets(initialMarkets);
  return <LiveMarketsContext.Provider value={state}>{children}</LiveMarketsContext.Provider>;
}

export function useLiveMarketsContext(): LiveMarketsState {
  const context = useContext(LiveMarketsContext);
  if (!context) {
    throw new Error("useLiveMarketsContext debe usarse dentro de <LiveMarketsProvider>");
  }
  return context;
}
