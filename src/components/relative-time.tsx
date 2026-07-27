"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

/**
 * "hace 3 min". Servidor y cliente pueden diferir en un segundo, y eso basta
 * para que React se queje: `suppressHydrationWarning` lo silencia sin ocultar
 * ningún problema real, porque el valor exacto es irrelevante.
 */
export function RelativeTime({ date, className }: { date: string; className?: string }) {
  const parsed = new Date(date);

  return (
    <time
      dateTime={date}
      title={parsed.toLocaleString("es-ES")}
      className={className}
      suppressHydrationWarning
    >
      hace {formatDistanceToNowStrict(parsed, { locale: es })}
    </time>
  );
}
