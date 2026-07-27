import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 * Crea uno nuevo por request: no lo guardes en una variable de módulo.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Los Server Components no pueden escribir cookies. El middleware ya
          // refresca la sesión, así que aquí se puede ignorar sin consecuencias.
        }
      },
    },
  });
}

/**
 * Usuario autenticado y su perfil, o `null`. Nunca lanza.
 *
 * Envuelto en `cache()`: la cabecera y el hilo de comentarios lo piden por
 * separado en el mismo render y así solo se va una vez a Supabase.
 */
export const getSessionUser = cache(async () => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
});
