"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import type { TrackedCoin } from "@/lib/coins";
import { cn } from "@/lib/utils";

const SIZES = { sm: 32, md: 44, lg: 64 } as const;

/**
 * Logo de la moneda, con monograma de reserva.
 *
 * Cae al monograma en dos casos: cuando CoinGecko no ha respondido (no hay URL)
 * y cuando la imagen falla al cargar. Lo segundo pasa de verdad: CoinGecko ha
 * cambiado el dominio de sus imágenes más de una vez, y si el host nuevo no
 * está en next.config.ts el optimizador devuelve 400 y la tarjeta se queda sin
 * identidad visual.
 */
export function CoinLogo({
  coin,
  src,
  size = "md",
  className,
}: {
  coin: TrackedCoin;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  const [failed, setFailed] = useState(false);

  // Si llega una URL nueva, se le vuelve a dar una oportunidad.
  useEffect(() => setFailed(false), [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-line-strong",
        className,
      )}
      style={{
        width: px,
        height: px,
        // Color vivo con un brillo encima, no un degradado hacia la variante
        // oscura: mezclar con `accentInk` apagaba el dorado y el ámbar hasta
        // dejarlos color oliva.
        background: showImage
          ? undefined
          : `radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,0.55), transparent 55%), ${coin.accent}`,
        boxShadow: `0 6px 18px -10px ${coin.accentInk}`,
      }}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={`Logo de ${coin.name}`}
          width={px}
          height={px}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden
          className="font-display font-extrabold text-white [text-shadow:0_1px_2px_rgba(31,23,16,0.35)]"
          style={{ fontSize: px * 0.36 }}
        >
          {coin.symbol.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
