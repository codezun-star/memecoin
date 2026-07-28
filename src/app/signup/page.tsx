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
  title: "Crear cuenta",
  robots: { index: false, follow: true },
};

export default async function SignupPage() {
  const session = await getSessionUser();
  if (session) redirect("/");

  return (
    <div className="shell flex justify-center py-16">
      <AuthForm mode="signup" />
    </div>
  );
}
