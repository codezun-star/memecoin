"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type ProfileState = {
  error?: string;
  message?: string;
};

const USERNAME_RE = /^[A-Za-z0-9_]{3,24}$/;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  if (!isSupabaseConfigured) return { error: "Supabase no está configurado." };

  const username = String(formData.get("username") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();

  if (!USERNAME_RE.test(username)) {
    return { error: "El nombre de usuario debe tener 3-24 caracteres: letras, números o _." };
  }
  if (bio.length > 280) return { error: "La bio no puede pasar de 280 caracteres." };
  if (avatarUrl && !/^https?:\/\//.test(avatarUrl)) {
    return { error: "La URL del avatar debe empezar por http:// o https://." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tienes que iniciar sesión." };

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      bio: bio || null,
      avatar_url: avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    // 23505 = unique_violation sobre profiles_username_lower_key
    if (error.code === "23505") return { error: "Ese nombre de usuario ya está cogido." };
    console.error("[profile] update:", error.message);
    return { error: "No hemos podido guardar los cambios." };
  }

  revalidatePath("/", "layout");
  return { message: "Perfil actualizado." };
}
