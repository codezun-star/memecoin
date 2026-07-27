import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { COIN_IDS } from "@/lib/coins";
import type { ThreadComment } from "@/types/database";

type RawComment = {
  id: string;
  body: string;
  created_at: string;
  like_count: number;
  is_deleted: boolean;
  parent_id: string | null;
  user_id: string;
  author: { id: string; username: string; avatar_url: string | null } | null;
};

const SELECT =
  "id, body, created_at, like_count, is_deleted, parent_id, user_id, " +
  "author:profiles!comments_user_id_fkey(id, username, avatar_url)";

/**
 * Hilo completo de una moneda, ya montado en árbol de un nivel y anotado con el
 * punto de vista del usuario que mira (`likedByMe`, `isMine`).
 */
export async function getThread(
  coinId: string,
  viewerId: string | null,
): Promise<ThreadComment[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(SELECT)
    .eq("coin_id", coinId)
    .order("created_at", { ascending: true })
    .limit(300)
    .returns<RawComment[]>();

  if (error) {
    console.error("[comments] no se pudo cargar el hilo:", error.message);
    return [];
  }
  if (!data?.length) return [];

  // Un único viaje extra para saber qué ha likeado el usuario, en vez de
  // arrastrar todas las filas de likes de todo el hilo.
  let likedIds = new Set<string>();
  if (viewerId) {
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", viewerId)
      .in(
        "comment_id",
        data.map((c) => c.id),
      );
    likedIds = new Set((likes ?? []).map((l) => l.comment_id));
  }

  const toThreadComment = (raw: RawComment): ThreadComment => ({
    id: raw.id,
    // Un comentario borrado con respuestas se conserva como tumba: el hilo
    // seguiría teniendo sentido, pero su texto no debe salir del servidor.
    body: raw.is_deleted ? "" : raw.body,
    createdAt: raw.created_at,
    likeCount: raw.like_count,
    isDeleted: raw.is_deleted,
    parentId: raw.parent_id,
    author:
      raw.is_deleted || !raw.author
        ? null
        : {
            id: raw.author.id,
            username: raw.author.username,
            avatarUrl: raw.author.avatar_url,
          },
    likedByMe: likedIds.has(raw.id),
    isMine: viewerId !== null && raw.user_id === viewerId,
    replies: [],
  });

  const roots: ThreadComment[] = [];
  const byId = new Map<string, ThreadComment>();

  for (const raw of data) {
    const comment = toThreadComment(raw);
    byId.set(comment.id, comment);
    if (!raw.parent_id) roots.push(comment);
  }

  for (const raw of data) {
    if (!raw.parent_id) continue;
    const parent = byId.get(raw.parent_id);
    const child = byId.get(raw.id);
    if (parent && child) parent.replies.push(child);
  }

  // Raíces: lo más nuevo arriba. Respuestas: orden cronológico, que es como se lee una conversación.
  roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Un comentario borrado sin respuestas no aporta nada; se oculta.
  return roots.filter((c) => !c.isDeleted || c.replies.length > 0);
}

/** Número de comentarios vivos por moneda, para las tarjetas de la home. */
export async function getCommentCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};

  const supabase = await createClient();

  const results = await Promise.all(
    COIN_IDS.map(async (id) => {
      const { count, error } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("coin_id", id)
        .eq("is_deleted", false);
      return [id, error ? 0 : (count ?? 0)] as const;
    }),
  );

  return Object.fromEntries(results);
}
