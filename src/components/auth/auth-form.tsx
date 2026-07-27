"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  signInWithOAuth,
  signInWithPassword,
  signUpWithPassword,
  type AuthState,
} from "@/app/auth/actions";
import { AVAILABLE_PROVIDERS, ENABLED_PROVIDERS } from "@/lib/auth-providers";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending} className="w-full">
      {children}
    </Button>
  );
}

function ProviderButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="lg" loading={pending} className="w-full">
      Continuar con {label}
    </Button>
  );
}

export function AuthForm({ mode, next = "/" }: { mode: "login" | "signup"; next?: string }) {
  const isSignup = mode === "signup";
  const action = isSignup ? signUpWithPassword : signInWithPassword;
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  return (
    <div className="surface-card w-full max-w-md p-6 md:p-8">
      <div className="mb-6 space-y-1.5">
        <h1 className="font-display text-display-md">
          {isSignup ? "Únete a la plaza" : "Bienvenido de vuelta"}
        </h1>
        <p className="text-sm text-ink-soft">
          {isSignup
            ? "Crea tu cuenta para comentar y dar likes en los hilos."
            : "Entra para seguir el debate donde lo dejaste."}
        </p>
      </div>

      {state.message ? (
        <p
          role="status"
          className="mb-4 rounded-input border border-up/30 bg-up-soft px-4 py-3 text-sm text-up"
        >
          {state.message}
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="mb-4 rounded-input border border-down/30 bg-down-soft px-4 py-3 text-sm text-down"
        >
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="space-y-4">
        {isSignup && (
          <Field
            label="Nombre de usuario"
            htmlFor="username"
            hint="Entre 3 y 24 caracteres: letras, números o guion bajo."
          >
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="degen_supremo"
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]+"
            />
          </Field>
        )}

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            required
          />
        </Field>

        <Field
          label="Contraseña"
          htmlFor="password"
          hint={isSignup ? "Mínimo 8 caracteres." : undefined}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="••••••••"
            required
            minLength={isSignup ? 8 : 1}
          />
        </Field>

        <SubmitButton>{isSignup ? "Crear cuenta" : "Entrar"}</SubmitButton>
      </form>

      {/* Hoy no se pinta nada: ENABLED_PROVIDERS va vacío a propósito. En cuanto
          se añada un proveedor en src/lib/auth-providers.ts, su botón aparece
          aquí solo. */}
      {ENABLED_PROVIDERS.length > 0 && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
            <span className="h-px flex-1 bg-line" />o
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-2">
            {ENABLED_PROVIDERS.map((id) => (
              <form key={id} action={signInWithOAuth}>
                <input type="hidden" name="provider" value={id} />
                <input type="hidden" name="next" value={next} />
                <ProviderButton label={AVAILABLE_PROVIDERS[id].label} />
              </form>
            ))}
          </div>
        </>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        {isSignup ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-brand-strong underline-offset-4 hover:underline"
        >
          {isSignup ? "Entra" : "Créala gratis"}
        </Link>
      </p>
    </div>
  );
}
