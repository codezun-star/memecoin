import { cn } from "@/lib/utils";
import { directionOf, formatPercent } from "@/lib/format";

const TONE = {
  up: "bg-up-soft text-up-500",
  down: "bg-down-soft text-down-500",
  flat: "bg-flat-soft text-flat-500",
} as const;

const ARROW = { up: "▲", down: "▼", flat: "•" } as const;

/**
 * Variación porcentual. Codifica la dirección con color + flecha + signo,
 * nunca solo con el color (DESIGN.md §8).
 */
export function ChangeBadge({
  value,
  size = "md",
  className,
}: {
  value: number | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  const direction = directionOf(value);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono font-semibold tabular-nums",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        TONE[direction],
        className,
      )}
    >
      <span aria-hidden className="text-[0.7em] leading-none">
        {ARROW[direction]}
      </span>
      {formatPercent(value)}
    </span>
  );
}
