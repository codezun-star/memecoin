import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** La página 1 vive en /blog; el resto en /blog/pagina/N. */
export function rutaDePagina(n: number): string {
  return n <= 1 ? "/blog" : `/blog/pagina/${n}`;
}

/**
 * Paginación del listado.
 *
 * Se pintan enlaces reales, no botones con JavaScript: cada página tiene su URL
 * y su canónica, entra en el sitemap y un buscador puede rastrearla. Una
 * paginación que solo funciona con clic deja el contenido invisible.
 */
export function Paginacion({ pagina, totalPaginas }: { pagina: number; totalPaginas: number }) {
  if (totalPaginas <= 1) return null;

  const numeros = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  return (
    <nav aria-label="Paginación" className="mt-12 flex items-center justify-center gap-2">
      {pagina > 1 && (
        <Link
          href={rutaDePagina(pagina - 1)}
          rel="prev"
          aria-label="Página anterior"
          className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      )}

      {numeros.map((n) => (
        <Link
          key={n}
          href={rutaDePagina(n)}
          aria-current={n === pagina ? "page" : undefined}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-full border text-sm font-medium transition-colors",
            n === pagina
              ? "border-brand bg-brand-soft text-brand-strong"
              : "border-line bg-surface text-ink-soft hover:border-brand hover:text-brand-strong",
          )}
        >
          {n}
        </Link>
      ))}

      {pagina < totalPaginas && (
        <Link
          href={rutaDePagina(pagina + 1)}
          rel="next"
          aria-label="Página siguiente"
          className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
