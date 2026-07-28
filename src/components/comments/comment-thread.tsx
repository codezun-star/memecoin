import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { CommentForm } from "@/components/comments/comment-form";
import { CommentItem } from "@/components/comments/comment-item";
import { Button } from "@/components/ui/button";
import { getThread } from "@/lib/comments";
import { targetPath } from "@/lib/comment-target";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { CommentTarget } from "@/lib/comment-target";

export async function CommentThread({
  target,
  titulo = "Debate",
  vacio,
}: {
  target: CommentTarget;
  titulo?: string;
  /** Texto cuando no hay ni un comentario. */
  vacio: string;
}) {
  const session = await getSessionUser();
  const viewer = session
    ? {
        id: session.user.id,
        username: session.profile?.username ?? "degen",
        avatarUrl: session.profile?.avatar_url ?? null,
      }
    : null;

  const volverA = targetPath(target);
  const comments = await getThread(target, viewer?.id ?? null);
  const total = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  return (
    <section id="debate" className="surface-card p-5 md:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-display-md">
          <MessagesSquare className="size-6 text-[color:var(--coin-accent-ink)]" aria-hidden />
          {titulo}
        </h2>
        <span className="tabular text-sm text-ink-faint">
          {total} {total === 1 ? "comentario" : "comentarios"}
        </span>
      </header>

      {!isSupabaseConfigured ? (
        <div className="rounded-input border border-doge/40 bg-doge-soft px-4 py-3 text-sm text-doge-ink">
          El debate no está disponible en este momento. Vuelve a intentarlo en un rato.
        </div>
      ) : viewer ? (
        <div className="surface-sunken p-4">
          <CommentForm target={target} username={viewer.username} avatarUrl={viewer.avatarUrl} />
        </div>
      ) : (
        <div className="surface-sunken flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-ink-soft">Inicia sesión para comentar y dar likes.</p>
          <div className="flex gap-2">
            <Link href={`/login?next=${encodeURIComponent(volverA)}`}>
              <Button variant="secondary" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Crear cuenta</Button>
            </Link>
          </div>
        </div>
      )}

      {comments.length > 0 ? (
        <ul className="mt-2 divide-y divide-line">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} target={target} viewer={viewer} />
          ))}
        </ul>
      ) : isSupabaseConfigured ? (
        <p className="py-10 text-center text-sm text-ink-faint">
          {vacio}
        </p>
      ) : null}
    </section>
  );
}
