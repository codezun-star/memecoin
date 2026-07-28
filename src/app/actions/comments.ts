"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  isCommentTargetKind,
  targetColumns,
  targetPath,
  type CommentTarget,
} from "@/lib/comment-target";

export type CommentState = {
  error?: string;
  ok?: boolean;
};

const MAX_BODY = 2000;

async function requireUser() {
  if (!isSupabaseConfigured) {
    return { error: "El debate no está disponible en este momento." as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tienes que iniciar sesión." as const };
  return { supabase, user };
}

/** Lee el destino del formulario. Devuelve null si no es válido. */
function leerTarget(formData: FormData): CommentTarget | null {
  const kind = String(formData.get("targetKind") ?? "");
  const id = String(formData.get("targetId") ?? "").trim();
  if (!isCommentTargetKind(kind) || !id) return null;
  return { kind, id };
}

export async function createComment(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const body = String(formData.get("body") ?? "").trim();
  const rawParent = String(formData.get("parentId") ?? "");
  const parentId = rawParent.length > 0 ? rawParent : null;

  const target = leerTarget(formData);
  if (!target) return { error: "Petición inválida." };
  if (!body) return { error: "Escribe algo antes de publicar." };
  if (body.length > MAX_BODY) return { error: `Máximo ${MAX_BODY} caracteres.` };

  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase.from("comments").insert({
    ...targetColumns(target),
    user_id: auth.user.id,
    parent_id: parentId,
    body,
  });

  if (error) {
    console.error("[comments] insert:", error.message);
    return { error: "No hemos podido publicar tu comentario. Inténtalo otra vez." };
  }

  revalidatePath(targetPath(target));
  return { ok: true };
}

export async function deleteComment(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const id = String(formData.get("id") ?? "");
  const target = leerTarget(formData);
  if (!target || !id) return { error: "Petición inválida." };

  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  // Si el comentario tiene respuestas se marca como borrado en vez de eliminarlo:
  // borrarlo de verdad se llevaría por delante las respuestas de otros (cascade).
  const { count } = await auth.supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  const hasReplies = (count ?? 0) > 0;

  // En ambos casos manda la RLS: solo el autor puede tocar su comentario.
  const { error } = hasReplies
    ? await auth.supabase
        .from("comments")
        .update({ is_deleted: true, body: "[comentario eliminado]" })
        .eq("id", id)
    : await auth.supabase.from("comments").delete().eq("id", id);

  if (error) {
    console.error("[comments] delete:", error.message);
    return { error: "No hemos podido borrar el comentario." };
  }

  revalidatePath(targetPath(target));
  return { ok: true };
}

/** Alterna el like del usuario actual. Devuelve el estado real tras la operación. */
export async function toggleLike(
  commentId: string,
  target: CommentTarget,
): Promise<{ liked: boolean; error?: string }> {
  const auth = await requireUser();
  if ("error" in auth) return { liked: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await auth.supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", auth.user.id);
    if (error) return { liked: true, error: "No se ha podido quitar el like." };
  } else {
    const { error } = await auth.supabase
      .from("comment_likes")
      .insert({ comment_id: commentId, user_id: auth.user.id });
    if (error) return { liked: false, error: "No se ha podido dar el like." };
  }

  revalidatePath(targetPath(target));

  return { liked: !existing };
}
