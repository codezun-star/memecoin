/**
 * A qué se comenta.
 *
 * Los comentarios cuelgan de una moneda o de un artículo del blog. En vez de
 * duplicar tabla, interfaz y likes para cada caso, todo el sistema trabaja con
 * este destino y la base de datos garantiza que solo se rellene uno de los dos
 * campos (ver 0003_blog_comments.sql).
 */

export type CommentTargetKind = "coin" | "post";

export type CommentTarget = {
  kind: CommentTargetKind;
  /** El id de la moneda o el slug del artículo. */
  id: string;
};

export function isCommentTargetKind(valor: string): valor is CommentTargetKind {
  return valor === "coin" || valor === "post";
}

/** Ruta pública del hilo, para revalidar la caché y para los enlaces de vuelta. */
export function targetPath(target: CommentTarget): string {
  return target.kind === "coin" ? `/coin/${target.id}` : `/blog/${target.id}`;
}

/** Columnas que identifican el destino en la tabla `comments`. */
export function targetColumns(target: CommentTarget): {
  coin_id: string | null;
  post_slug: string | null;
} {
  return target.kind === "coin"
    ? { coin_id: target.id, post_slug: null }
    : { coin_id: null, post_slug: target.id };
}
