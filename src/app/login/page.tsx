import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const session = await getSessionUser();
  if (session) redirect("/");

  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="shell flex justify-center py-16">
      <div className="w-full max-w-md space-y-4">
        {error ? (
          <p
            role="alert"
            className="rounded-input border border-down/30 bg-down-soft px-4 py-3 text-sm text-down"
          >
            {error === "supabase"
              ? "Supabase no está configurado en este entorno."
              : error === "oauth_disabled"
                ? "Ese método de acceso no está activado. Entra con tu email y contraseña."
                : "No hemos podido completar el acceso. Inténtalo otra vez."}
          </p>
        ) : null}
        <AuthForm mode="login" next={safeNext} />
      </div>
    </div>
  );
}
