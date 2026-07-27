import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Punto de retorno de OAuth (Google) y del enlace de confirmación por email.
 * Cambia el `code` por una sesión y deja las cookies puestas.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Evita open redirects: solo se admiten rutas internas.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (!code || !isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  // Detrás de un proxy (Vercel) el origin interno no es el público.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;

  return NextResponse.redirect(`${base}${safeNext}`);
}
