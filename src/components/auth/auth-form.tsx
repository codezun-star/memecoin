"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  type AuthState,
} from "@/app/auth/actions";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending} className="w-full">
      {children}
    </Button>
  );
}

function GoogleButton({ next }: { next: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="lg" loading={pending} className="w-full">
      <input type="hidden" name="next" value={next} />
      <GoogleIcon />
      Continuar con Google
    </Button>
  );
}

export function AuthForm({ mode, next = "/" }: { mode: "login" | "signup"; next?: string }) {
  const isSignup = mode === "signup";
  const action = isSignup ? signUpWithPassword : signInWithPassword;
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  return (
    <div className="surface w-full max-w-md p-6 md:p-8">
      <div className="mb-6 space-y-1.5">
        <h1 className="font-display text-display-md">
          {isSignup ? "Únete a la plaza" : "Bienvenido de vuelta"}
        </h1>
        <p className="text-sm text-sand">
          {isSignup
            ? "Crea tu cuenta para comentar y dar likes en los hilos."
            : "Entra para seguir el debate donde lo dejaste."}
        </p>
      </div>

      {state.message ? (
        <p
          role="status"
          className="mb-4 rounded-input border border-up-500/30 bg-up-soft px-4 py-3 text-sm text-up-500"
        >
          {state.message}
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="mb-4 rounded-input border border-down-500/30 bg-down-soft px-4 py-3 text-sm text-down-500"
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

      <div className="my-5 flex items-center gap-3 text-xs text-dust">
        <span className="h-px flex-1 bg-white/[0.08]" />o<span className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form action={signInWithGoogle}>
        <GoogleButton next={next} />
      </form>

      <p className="mt-6 text-center text-sm text-sand">
        {isSignup ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-brand-400 underline-offset-4 hover:underline"
        >
          {isSignup ? "Entra" : "Créala gratis"}
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.64h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.17-2 3.44-4.95 3.44-8.57z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.1 0 5.7-1.03 7.62-2.78l-3.72-2.9c-1.03.7-2.35 1.11-3.9 1.11-3 0-5.54-2.02-6.45-4.74H1.7v2.98A11.5 11.5 0 0 0 12 23.5z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.19a6.9 6.9 0 0 1 0-4.38V6.83H1.7a11.5 11.5 0 0 0 0 10.34l3.85-2.98z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.69 0 3.2.58 4.4 1.72l3.3-3.3C17.7 1.28 15.1.25 12 .25A11.5 11.5 0 0 0 1.7 6.83l3.85 2.98C6.46 7.09 9 4.77 12 4.77z"
      />
    </svg>
  );
}
