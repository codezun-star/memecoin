"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { updateProfile, type ProfileState } from "@/app/profile/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Guardar cambios
    </Button>
  );
}

export function ProfileForm({
  username: initialUsername,
  bio,
  avatarUrl: initialAvatarUrl,
}: {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
}) {
  const [state, formAction] = useActionState<ProfileState, FormData>(updateProfile, {});
  // Vista previa en vivo: al pegar una URL o cambiar el nombre, el avatar de
  // arriba se actualiza sin esperar a guardar.
  const [username, setUsername] = useState(initialUsername);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar username={username || "??"} avatarUrl={avatarUrl || null} size="lg" />
        <div>
          <p className="font-display text-lg font-bold">{username || "sin nombre"}</p>
          <p className="text-sm text-ink-faint">Así te verá el resto de la comunidad.</p>
        </div>
      </div>

      {state.message ? (
        <p
          role="status"
          className="rounded-input border border-up/30 bg-up-soft px-4 py-3 text-sm text-up"
        >
          {state.message}
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-input border border-down/30 bg-down-soft px-4 py-3 text-sm text-down"
        >
          {state.error}
        </p>
      ) : null}

      <Field label="Nombre de usuario" htmlFor="username" hint="Letras, números y guion bajo.">
        <Input
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9_]+"
        />
      </Field>

      <Field
        label="URL del avatar"
        htmlFor="avatar_url"
        hint="Opcional. Pega el enlace de una imagen."
      >
        <Input
          id="avatar_url"
          name="avatar_url"
          type="url"
          placeholder="https://…"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </Field>

      <Field label="Bio" htmlFor="bio" hint="Máximo 280 caracteres.">
        <Textarea
          id="bio"
          name="bio"
          defaultValue={bio ?? ""}
          maxLength={280}
          placeholder="Degen desde 2021. Solo compro monedas con animales."
        />
      </Field>

      <SaveButton />
    </form>
  );
}
