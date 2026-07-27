import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { CommentForm } from "@/components/comments/comment-form";
import { CommentItem } from "@/components/comments/comment-item";
import { Button } from "@/components/ui/button";
import { getThread } from "@/lib/comments";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { TrackedCoin } from "@/lib/coins";

export async function CommentThread({ coin }: { coin: TrackedCoin }) {
  const session = await getSessionUser();
  const viewer = session
    ? {
        id: session.user.id,
        username: session.profile?.username ?? "degen",
        avatarUrl: session.profile?.avatar_url ?? null,
      }
    : null;

  const comments = await getThread(coin.id, viewer?.id ?? null);
  const total = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  return (
    <section id="debate" className="surface p-5 md:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-display-md">
          <MessagesSquare className="size-6 text-[color:var(--coin-accent)]" aria-hidden />
          Debate
        </h2>
        <span className="tabular text-sm text-dust">
          {total} {total === 1 ? "comentario" : "comentarios"}
        </span>
      </header>

      {!isSupabaseConfigured ? (
        <div className="rounded-input border border-doge/30 bg-doge-soft px-4 py-3 text-sm text-doge">
          El foro necesita Supabase. Copia <code className="font-mono">.env.example</code> a{" "}
          <code className="font-mono">.env.local</code>, añade tus claves y ejecuta la migración de{" "}
          <code className="font-mono">supabase/migrations</code>.
        </div>
      ) : viewer ? (
        <div className="surface-raised p-4">
          <CommentForm slug={coin.slug} username={viewer.username} avatarUrl={viewer.avatarUrl} />
        </div>
      ) : (
        <div className="surface-raised flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-sand">Inicia sesión para comentar y dar likes.</p>
          <div className="flex gap-2">
            <Link href={`/login?next=/coin/${coin.slug}`}>
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
        <ul className="mt-2 divide-y divide-white/[0.06]">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} slug={coin.slug} viewer={viewer} />
          ))}
        </ul>
      ) : isSupabaseConfigured ? (
        <p className="py-10 text-center text-sm text-dust">
          Nadie ha dicho nada todavía sobre {coin.name}. Sé el primero.
        </p>
      ) : null}
    </section>
  );
}
