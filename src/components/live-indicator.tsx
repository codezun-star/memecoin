"use client";

import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSecondsSince } from "@/lib/use-live-markets";

const TONE = {
  live: "text-up",
  stale: "text-doge-ink",
  error: "text-down",
} as const;

const LABEL = {
  live: "En vivo",
  stale: "Reintentando",
  error: "Sin conexión",
} as const;

/** Punto pulsante + "hace Xs", para que se vea que el dato está vivo y cuánto de fresco es. */
export function LiveIndicator({
  updatedAt,
  status,
  onRefresh,
  className,
}: {
  updatedAt: number | null;
  status: "live" | "stale" | "error";
  onRefresh?: () => void;
  className?: string;
}) {
  const seconds = useSecondsSince(updatedAt);

  return (
    <span className={cn("inline-flex items-center gap-2 text-xs", className)}>
      <span className={cn("inline-flex items-center gap-1.5 font-medium", TONE[status])}>
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full bg-current",
            status === "live" && "animate-pulse-dot",
          )}
        />
        {LABEL[status]}
      </span>

      {seconds !== null && (
        <span className="tabular text-ink-faint">
          {seconds < 5 ? "ahora mismo" : `hace ${seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min`}`}
        </span>
      )}

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Actualizar precios ahora"
          className="rounded-full p-1 text-ink-faint transition-colors hover:bg-sunken hover:text-ink"
        >
          <RefreshCw className="size-3.5" aria-hidden />
        </button>
      )}
    </span>
  );
}
