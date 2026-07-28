import Link from "next/link";

import { tagToSlug } from "@/lib/blog";
import { cn } from "@/lib/utils";

/**
 * Etiqueta de categoría.
 *
 * Va por encima de la tarjeta (`relative z-10`) porque el enlace del título la
 * cubre entera con un pseudo-elemento; sin esto, pulsar un tag abriría el
 * artículo en vez de la categoría.
 */
export function TagPill({
  tag,
  activo = false,
  count,
}: {
  tag: string;
  activo?: boolean;
  count?: number;
}) {
  return (
    <Link
      href={`/blog/categoria/${tagToSlug(tag)}`}
      className={cn(
        "relative z-10 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        activo
          ? "border-brand bg-brand-soft text-brand-strong"
          : "border-line-strong bg-sunken text-ink-soft hover:border-brand hover:text-brand-strong",
      )}
    >
      {tag}
      {count !== undefined && <span className="tabular text-ink-faint">{count}</span>}
    </Link>
  );
}
