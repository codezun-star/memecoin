"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSiteUrl } from "@/lib/site-url";
import { isProviderEnabled } from "@/lib/auth-providers";

export type AuthState = {
  error?: string;
  message?: string;
};

const USERNAME_RE = /^[A-Za-z0-9_]{3,24}$/;

const NOT_CONFIGURED: AuthState = {
  error: "El acceso no está disponible en este momento. Vuelve a intentarlo en un rato.",
};

/**
 * Traduce los errores del proveedor de identidad a mensajes accionables.
 *
 * Los que no están en el mapa **no se muestran tal cual**: un mensaje del
 * proveedor puede nombrar el servicio, la configuración del proyecto o detalles
 * internos, y eso no tiene por qué salir a la pantalla de un visitante. El
 * original se registra en el servidor, que es donde sirve para depurar.
 */
function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email o contraseña incorrectos.",
    // Solo puede saltar en cuentas creadas cuando la confirmación estaba
    // activada: desactivarla no confirma retroactivamente a nadie.
    "Email not confirmed": "Esta cuenta todavía no está activada. Regístrate de nuevo.",
    "User already registered": "Ya existe una cuenta con ese email.",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
    "Signup requires a valid password": "Escribe una contraseña válida.",
    "Unable to validate email address: invalid format": "Ese email no tiene un formato válido.",
    "Email rate limit exceeded": "Demasiados intentos. Espera unos minutos y vuelve a probar.",
    "For security purposes, you can only request this after 60 seconds.":
      "Espera un minuto antes de volver a intentarlo.",
  };

  const traducido = map[message];
  if (traducido) return traducido;

  console.error("[auth] error sin traducir:", message);
  return "No hemos podido completar la operación. Inténtalo otra vez.";
}

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Rellena el email y la contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: translateAuthError(error.message) };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();

  if (!email || !password || !username) return { error: "Rellena todos los campos." };
  if (!USERNAME_RE.test(username)) {
    return {
      error: "El nombre de usuario debe tener entre 3 y 24 caracteres: letras, números o _.",
    };
  }
  if (password.length < 8) {
    return { error: "Usa una contraseña de al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // El trigger handle_new_user lee este metadato para crear el perfil.
      data: { username },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) return { error: translateAuthError(error.message) };

  // Camino normal con "Confirm email" desactivado en Supabase: signUp ya
  // devuelve sesión, así que el usuario entra directo sin pasar por el correo.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  // Sin sesión hay dos motivos posibles, y conviene no confundirlos.

  // 1) El email ya tiene cuenta. Con la protección contra enumeración de
  //    usuarios activada, Supabase no devuelve error: manda un usuario de pega
  //    con la lista de identidades vacía. Sin este caso, al reintentar con un
  //    email ya registrado saldría un "revisa tu correo" que nunca llega.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { error: "Ya existe una cuenta con ese email. Entra con tu contraseña." };
  }

  // 2) El proyecto todavía exige confirmación. No debería pasar con la
  //    configuración actual, pero se mantiene para que la app siga siendo
  //    correcta si algún día se vuelve a activar el ajuste.
  return {
    message: `Te hemos enviado un email a ${email}. Confirma la dirección para activar la cuenta.`,
  };
}

/**
 * Entrada por OAuth. Preparada pero inactiva: hoy ENABLED_PROVIDERS está vacío,
 * así que esta acción rechaza cualquier proveedor. Ver src/lib/auth-providers.ts
 * para activar Google o Discord sin tocar componentes.
 */
export async function signInWithOAuth(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/login?error=supabase");

  const provider = String(formData.get("provider") ?? "");
  // Se valida contra la lista, no contra lo que llegue del formulario: si no,
  // cualquiera podría forzar un proveedor que no hemos configurado.
  if (!isProviderEnabled(provider)) redirect("/login?error=oauth_disabled");

  const next = String(formData.get("next") ?? "/");
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect("/login?error=oauth");

  redirect(data.url);
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
