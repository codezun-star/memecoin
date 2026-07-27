"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatPrice } from "@/lib/format";
import type { TrackedCoin } from "@/lib/coins";

export type ChartPoint = { t: number; p: number };

/** Ticks "redondos" para el eje Y: 1, 2, 2.5, 5 x 10^n. Evita etiquetas como 0,0000173. */
function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [];

  const rawStep = (max - min) / (count - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;

  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001 && ticks.length < count + 1; v += step) {
    ticks.push(Number(v.toFixed(12))); // corta el ruido binario del acumulador
  }
  return ticks;
}

export function PriceChart({
  data,
  coin,
  days,
  livePrice,
}: {
  data: ChartPoint[];
  coin: TrackedCoin;
  days: number;
  /** Último precio conocido: se engancha al final de la serie para que el gráfico no se quede atrás. */
  livePrice?: number | null;
}) {
  /**
   * El punto en vivo solo se engancha después de montar.
   *
   * Lleva `Date.now()`, y usarlo durante el render haría que el servidor y el
   * cliente calcularan instantes distintos: las etiquetas del eje X saldrían
   * diferentes y React abortaría la hidratación.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const points = useMemo(() => {
    if (data.length === 0) return data;
    if (!mounted || livePrice === null || livePrice === undefined) return data;

    const last = data[data.length - 1];
    // Si el punto vivo cae dentro del último intervalo, se sustituye en vez de
    // añadirse: si no, la serie acumularía puntos en el mismo instante.
    const spacing = data.length > 1 ? last.t - data[data.length - 2].t : 0;
    const now = Date.now();

    if (now - last.t < spacing) {
      return [...data.slice(0, -1), { t: now, p: livePrice }];
    }
    return [...data, { t: now, p: livePrice }];
  }, [data, livePrice, mounted]);

  const stats = useMemo(() => {
    if (points.length < 2) return null;
    const values = points.map((d) => d.p);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      first: values[0],
      last: values[values.length - 1],
    };
  }, [points]);

  if (points.length < 2 || !stats) {
    return (
      <div className="grid h-72 place-items-center rounded-input bg-sunken text-sm text-ink-faint">
        No hay datos de precio disponibles ahora mismo.
      </div>
    );
  }

  // Un poco de aire arriba y abajo para que la línea no toque los bordes.
  const pad = (stats.max - stats.min || stats.max * 0.05 || 1) * 0.12;
  const domainMin = stats.min - pad;
  const domainMax = stats.max + pad;
  const ticks = niceTicks(domainMin, domainMax);

  const formatTick = (t: number) => {
    const date = new Date(t);
    if (days <= 1) return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    if (days <= 90) return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
  };

  return (
    <div className="h-72 w-full md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`fill-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={coin.accent} stopOpacity={0.42} />
              <stop offset="100%" stopColor={coin.accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Solo líneas horizontales: las verticales compiten con la serie. */}
          <CartesianGrid stroke="#F0E3CE" strokeDasharray="0" vertical={false} />

          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatTick}
            tick={{ fill: "#7C6957", fontSize: 11 }}
            axisLine={{ stroke: "#F0E3CE" }}
            tickLine={false}
            minTickGap={48}
          />
          <YAxis
            dataKey="p"
            domain={[domainMin, domainMax]}
            ticks={ticks.length > 1 ? ticks : undefined}
            tickFormatter={(v: number) => formatPrice(v)}
            tick={{ fill: "#7C6957", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={96}
            orientation="right"
          />

          {/* Precio al inicio del rango: da la referencia de si se gana o se pierde. */}
          <ReferenceLine
            y={stats.first}
            stroke="#7C6957"
            strokeDasharray="4 4"
            strokeOpacity={0.55}
            label={{
              value: "inicio",
              // Encima de la línea, no sobre ella: en "insideLeft" el texto se
              // superponía con el propio trazo discontinuo.
              position: "insideTopLeft",
              offset: 6,
              fill: "#7C6957",
              fontSize: 10,
            }}
          />

          <Tooltip
            cursor={{ stroke: coin.accentInk, strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as ChartPoint;
              const delta = stats.first === 0 ? 0 : ((point.p - stats.first) / stats.first) * 100;
              const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";

              return (
                <div className="rounded-input border border-line bg-surface px-3 py-2 shadow-lift">
                  <p className="tabular text-sm font-semibold text-ink">{formatPrice(point.p)}</p>
                  <p
                    className={`tabular text-xs ${
                      delta > 0 ? "text-up" : delta < 0 ? "text-down" : "text-ink-faint"
                    }`}
                  >
                    {sign}
                    {Math.abs(delta).toFixed(2)} % desde el inicio
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {new Date(point.t).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="p"
            stroke={coin.accentInk}
            strokeWidth={2}
            fill={`url(#fill-${coin.id})`}
            isAnimationActive={false}
            activeDot={{ r: 4, fill: coin.accentInk, stroke: "#FFFFFF", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
