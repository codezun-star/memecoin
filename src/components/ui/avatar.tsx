import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
} as const;

/** Colores de fondo del avatar por defecto, elegidos de forma estable a partir del nombre. */
const FALLBACK_TINTS = [
  "from-shiba to-shiba-deep",
  "from-doge to-doge-deep",
  "from-pepe to-pepe-deep",
  "from-bonk to-bonk-deep",
];

function tintFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return FALLBACK_TINTS[Math.abs(hash) % FALLBACK_TINTS.length];
}

export function Avatar({
  username,
  avatarUrl,
  size = "md",
  className,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const base = cn(
    "shrink-0 overflow-hidden rounded-full border border-white/10 object-cover",
    SIZES[size],
    className,
  );

  if (avatarUrl) {
    // <img> en vez de next/image: los avatares vienen de dominios arbitrarios
    // (Google, Gravatar, Storage) y no vale la pena optimizarlos.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" aria-hidden className={base} />;
  }

  return (
    <span
      aria-hidden
      className={cn(
        base,
        "grid place-items-center bg-gradient-to-br font-display font-bold text-ink-950",
        tintFor(username),
      )}
    >
      {username.slice(0, 2).toUpperCase()}
    </span>
  );
}
