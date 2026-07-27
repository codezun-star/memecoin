"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { createComment, type CommentState } from "@/app/actions/comments";

const MAX_BODY = 2000;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      {label}
    </Button>
  );
}

export function CommentForm({
  slug,
  parentId,
  username,
  avatarUrl,
  autoFocus,
  placeholder = "¿Qué opinas? Suelta tu tesis…",
  submitLabel = "Publicar",
  onDone,
}: {
  slug: string;
  parentId?: string;
  username: string;
  avatarUrl: string | null;
  autoFocus?: boolean;
  placeholder?: string;
  submitLabel?: string;
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState<CommentState, FormData>(createComment, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [length, setLength] = useState(0);
  // Cada envío devuelve un objeto de estado nuevo; guardamos el último ya
  // procesado para no vaciar el formulario dos veces por el mismo resultado.
  const handledRef = useRef<CommentState | null>(null);

  useEffect(() => {
    if (!state.ok || handledRef.current === state) return;
    handledRef.current = state;
    formRef.current?.reset();
    setLength(0);
    onDone?.();
  }, [state, onDone]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-3">
      <Avatar username={username} avatarUrl={avatarUrl} size="sm" className="mt-1" />

      <div className="min-w-0 flex-1 space-y-2">
        <input type="hidden" name="slug" value={slug} />
        {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}

        <Textarea
          name="body"
          required
          maxLength={MAX_BODY}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label="Tu comentario"
          onChange={(e) => setLength(e.target.value.length)}
          className={parentId ? "min-h-20" : undefined}
        />

        {state.error ? (
          <p role="alert" className="text-sm text-down-500">
            {state.error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <span
            className={`tabular text-xs ${length > MAX_BODY * 0.9 ? "text-doge" : "text-dust"}`}
          >
            {length}/{MAX_BODY}
          </span>
          <div className="flex items-center gap-2">
            {onDone ? (
              <Button type="button" variant="ghost" size="sm" onClick={onDone}>
                Cancelar
              </Button>
            ) : null}
            <SubmitButton label={submitLabel} />
          </div>
        </div>
      </div>
    </form>
  );
}
