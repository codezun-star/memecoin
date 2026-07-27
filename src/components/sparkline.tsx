import { cn } from "@/lib/utils";

/**
 * Mini gráfico de tendencia en SVG puro.
 *
 * Sin librería a propósito: son ~40 líneas, se renderiza en el servidor (cero JS
 * en el cliente y sin parpadeo de hidratación) y en la home hay uno por tarjeta.
 */
export function Sparkline({
  data,
  direction,
  className,
  width = 240,
  height = 64,
}: {
  data: number[];
  direction: "up" | "down" | "flat";
  className?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) {
    return (
      <div
        className={cn("flex items-center justify-center text-xs text-ink-faint", className)}
        style={{ height }}
      >
        Sin datos de tendencia
      </div>
    );
  }

  // Un punto por hora es suficiente resolución para 7 días; menos puntos = SVG más ligero.
  const step = Math.max(1, Math.floor(data.length / 96));
  const points = data.filter((_, i) => i % step === 0);
  if (points[points.length - 1] !== data[data.length - 1]) points.push(data[data.length - 1]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min;
  const padY = 4;

  const toX = (i: number) => (i / (points.length - 1)) * width;
  // Una serie perfectamente plana daría 0/0: se dibuja centrada en vez de
  // pegada al borde inferior, que es lo que saldría al normalizar.
  const toY = (v: number) =>
    range === 0 ? height / 2 : height - padY - ((v - min) / range) * (height - padY * 2);

  const line = points.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(2)},${toY(v).toFixed(2)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  // Mismos tokens up/down/flat del tema claro (tailwind.config.ts)
  const stroke =
    direction === "up" ? "#0B7F45" : direction === "down" ? "#CE1F45" : "#7C6957";
  const gradientId = `spark-${direction}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      role="img"
      aria-label={`Tendencia de los últimos 7 días: ${
        direction === "up" ? "al alza" : direction === "down" ? "a la baja" : "estable"
      }`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
