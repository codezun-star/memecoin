"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatPrice } from "@/lib/format";

export type ChartPoint = { t: number; p: number };

/**
 * Gráfico de precio de la página de detalle.
 *
 * Cliente porque necesita tooltip al pasar el ratón; los datos llegan ya
 * preparados desde el servidor, así que no hace fetch.
 */
export function PriceChart({
  data,
  accent,
  days,
}: {
  data: ChartPoint[];
  accent: string;
  days: number;
}) {
  if (data.length < 2) {
    return (
      <div className="grid h-72 place-items-center text-sm text-dust">
        No hay datos de precio disponibles ahora mismo.
      </div>
    );
  }

  const values = data.map((d) => d.p);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Un poco de aire arriba y abajo: la línea no debe tocar los bordes.
  const pad = (max - min || max * 0.05 || 1) * 0.12;

  const formatTick = (t: number) => {
    const date = new Date(t);
    return days <= 1
      ? date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatTick}
            tick={{ fill: "#8C7C6C", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={48}
          />
          <YAxis
            dataKey="p"
            domain={[min - pad, max + pad]}
            tickFormatter={(v: number) => formatPrice(v)}
            tick={{ fill: "#8C7C6C", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={92}
            orientation="right"
          />
          <Tooltip
            cursor={{ stroke: accent, strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as ChartPoint;
              return (
                <div className="surface-raised px-3 py-2 shadow-soft">
                  <p className="tabular text-sm font-semibold text-cream">{formatPrice(point.p)}</p>
                  <p className="text-xs text-dust">
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
            stroke={accent}
            strokeWidth={2}
            fill="url(#price-fill)"
            isAnimationActive={false}
            activeDot={{ r: 4, fill: accent, stroke: "#12100E", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
