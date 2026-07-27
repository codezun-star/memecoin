import Image from "next/image";

import type { TrackedCoin } from "@/lib/coins";
import { cn } from "@/lib/utils";

const SIZES = { sm: 32, md: 44, lg: 64 } as const;

/**
 * Logo de la moneda. Si CoinGecko no ha respondido no hay URL de imagen, así que
 * cae a un monograma con el color de marca: la tarjeta nunca se queda sin identidad.
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

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10",
        className,
      )}
      style={{
        width: px,
        height: px,
        background: src ? undefined : `linear-gradient(135deg, ${coin.accent}, ${coin.accentDeep})`,
        boxShadow: `0 6px 20px -8px ${coin.accent}`,
      }}
    >
      {src ? (
        <Image src={src} alt={`Logo de ${coin.name}`} width={px} height={px} className="size-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="font-display font-extrabold text-ink-950"
          style={{ fontSize: px * 0.36 }}
        >
          {coin.symbol.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
