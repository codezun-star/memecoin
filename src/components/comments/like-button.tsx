"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { toggleLike } from "@/app/actions/comments";

/**
 * Like con actualización optimista: el corazón responde al instante y solo se
 * revierte si el servidor rechaza la operación.
 */
export function LikeButton({
  commentId,
  slug,
  initialLiked,
  initialCount,
  canLike,
}: {
  commentId: string;
  slug: string;
  initialLiked: boolean;
  initialCount: number;
  canLike: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  const [popKey, setPopKey] = useState(0);

  function handleClick() {
    if (!canLike) {
      router.push(`/login?next=/coin/${slug}`);
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    if (nextLiked) setPopKey((k) => k + 1);

    startTransition(async () => {
      const result = await toggleLike(commentId, slug);
      if (result.error) {
        // Revertimos al estado que dice el servidor.
        setLiked(result.liked);
        setCount((c) => Math.max(0, c + (result.liked === nextLiked ? 0 : nextLiked ? -1 : 1)));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={canLike ? liked : undefined}
      aria-label={liked ? "Quitar me gusta" : "Me gusta"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all duration-[180ms]",
        liked
          ? "bg-brand-soft text-brand-strong"
          : "text-ink-faint hover:bg-sunken hover:text-ink-soft",
      )}
    >
      <Heart
        key={popKey}
        aria-hidden
        className={cn("size-3.5", liked && "animate-pop-like fill-current")}
      />
      <span className="tabular">{count}</span>
    </button>
  );
}
