"use client";

import { useActionState, useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/relative-time";
import { CommentForm } from "@/components/comments/comment-form";
import { LikeButton } from "@/components/comments/like-button";
import { deleteComment, type CommentState } from "@/app/actions/comments";
import { targetPath, type CommentTarget } from "@/lib/comment-target";
import type { ThreadComment } from "@/types/database";
import { cn } from "@/lib/utils";

type Viewer = { id: string; username: string; avatarUrl: string | null } | null;

export function CommentItem({
  comment,
  target,
  viewer,
  isReply = false,
}: {
  comment: ThreadComment;
  target: CommentTarget;
  viewer: Viewer;
  isReply?: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [deleteState, deleteAction] = useActionState<CommentState, FormData>(deleteComment, {});

  if (comment.isDeleted) {
    return (
      <li className={cn("py-4", isReply && "pl-4")}>
        <p className="text-sm italic text-ink-faint">Este comentario fue eliminado por su autor.</p>
        {comment.replies.length > 0 && (
          <ul className="mt-2 divide-y divide-line border-l border-line pl-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} target={target} viewer={viewer} isReply />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li className="animate-fade-up py-4">
      <article className="flex gap-3">
        <Avatar
          username={comment.author?.username ?? "?"}
          avatarUrl={comment.author?.avatarUrl}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-medium text-ink">{comment.author?.username ?? "anónimo"}</span>
            {comment.isMine && (
              <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-strong">
                tú
              </span>
            )}
            <RelativeTime date={comment.createdAt} className="text-xs text-ink-faint" />
          </header>

          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink-soft">
            {comment.body}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1">
            <LikeButton
              commentId={comment.id}
              target={target}
              initialLiked={comment.likedByMe}
              initialCount={comment.likeCount}
              canLike={viewer !== null}
            />

            {!isReply && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                aria-expanded={replying}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-ink-faint transition-colors hover:bg-sunken hover:text-ink-soft"
              >
                <MessageSquare className="size-3.5" aria-hidden />
                Responder
              </button>
            )}

            {comment.isMine && (
              <form action={deleteAction} className="contents">
                <input type="hidden" name="targetKind" value={target.kind} />
                <input type="hidden" name="targetId" value={target.id} />
                <input type="hidden" name="id" value={comment.id} />
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!confirm("¿Borrar este comentario?")) e.preventDefault();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-ink-faint transition-colors hover:bg-down-soft hover:text-down"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Borrar
                </button>
              </form>
            )}
          </div>

          {deleteState.error ? (
            <p role="alert" className="mt-2 text-sm text-down">
              {deleteState.error}
            </p>
          ) : null}

          {replying && viewer && (
            <div className="mt-4">
              <CommentForm
                target={target}
                parentId={comment.id}
                username={viewer.username}
                avatarUrl={viewer.avatarUrl}
                autoFocus
                placeholder={`Responder a ${comment.author?.username ?? "este comentario"}…`}
                submitLabel="Responder"
                onDone={() => setReplying(false)}
              />
            </div>
          )}

          {replying && !viewer && (
            <p className="mt-3 text-sm text-ink-faint">
              <a href={`/login?next=${encodeURIComponent(targetPath(target))}`} className="text-brand-strong hover:underline">
                Inicia sesión
              </a>{" "}
              para responder.
            </p>
          )}

          {comment.replies.length > 0 && (
            <ul className="mt-3 divide-y divide-line border-l border-line pl-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} target={target} viewer={viewer} isReply />
              ))}
            </ul>
          )}
        </div>
      </article>
    </li>
  );
}
