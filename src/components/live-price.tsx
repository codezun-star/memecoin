"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

/**
 * Precio que destella en verde o rojo cuando cambia.
 *
 * Es la señal de que el dato está vivo de verdad: sin ella, un número que se
 * actualiza solo es indistinguible de uno congelado.
 */
export function LivePrice({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) {
  const previous = useRef<number | null | undefined>(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const before = previous.current;
    previous.current = value;

    if (before === null || before === undefined || value === null || value === undefined) return;
    if (value === before) return;

    setFlash(value > before ? "up" : "down");
    const id = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <span
      className={cn(
        "-mx-1 rounded px-1",
        flash === "up" && "animate-flash-up",
        flash === "down" && "animate-flash-down",
        className,
      )}
    >
      {formatPrice(value)}
    </span>
  );
}
