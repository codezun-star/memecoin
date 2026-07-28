import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";

import { formatPostDate, type PostMeta } from "@/lib/blog";

export function PostCard({ post, destacado = false }: { post: PostMeta; destacado?: boolean }) {
  return (
    <article
      className={`surface-card group relative flex flex-col overflow-hidden transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-lift ${
        destacado ? "md:flex-row" : ""
      }`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-sunken ${destacado ? "md:w-2/5" : ""}`}>
        <Image
          src={post.image}
          alt={post.imageAlt}
          width={destacado ? 800 : 640}
          height={destacado ? 420 : 336}
          className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
            destacado ? "h-48 md:h-full" : "h-40"
          }`}
          sizes={destacado ? "(max-width: 768px) 100vw, 480px" : "(max-width: 768px) 100vw, 380px"}
        />
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <h2
          className={`font-display font-bold leading-tight text-ink ${
            destacado ? "text-2xl md:text-display-md" : "text-lg"
          }`}
        >
          {/* El enlace cubre toda la tarjeta, pero el texto accesible es el título. */}
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h2>

        <p className={`mt-2 text-ink-soft ${destacado ? "text-base" : "text-sm"}`}>
          {post.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs text-ink-faint">
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {post.readingMinutes} min
          </span>
          {post.draft && (
            <span className="rounded-full bg-doge-soft px-2 py-0.5 font-medium text-doge-ink">
              borrador
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
