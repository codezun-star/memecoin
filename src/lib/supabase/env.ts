/**
 * La app tiene que poder arrancar sin Supabase configurado: los precios y el
 * diseño se ven igual, y las partes de comunidad muestran un aviso en vez de
 * reventar. Esto hace que un `git clone && npm run dev` funcione a la primera.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith("http"),
);
