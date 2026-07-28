import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/supabase/server";

/**
 * Fuera del índice.
 *
 * Un formulario no responde a ninguna búsqueda: no hay consulta para la que
 * esta página sea el mejor resultado. Indexarla solo gasta presupuesto de
 * rastreo y ensucia los resultados de marca. `follow` se mantiene para que el
 * rastreador siga los enlaces de la cabecera y el pie hacia el resto del sitio.
 */
export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: true },
};

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
              ? "El acceso no está disponible en este momento. Vuelve a intentarlo en un rato."
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
