/**
 * Proveedores OAuth.
 *
 * El MVP entra solo con email + contraseña. Todo el camino de OAuth está
 * escrito y probado (acción de servidor, callback de intercambio de código,
 * creación de perfil desde los metadatos del proveedor), pero **ningún
 * proveedor está activado**: `ENABLED_PROVIDERS` va vacío a propósito.
 *
 * Para añadir Google o Discord más adelante:
 *   1. Actívalo en Supabase → Authentication → Providers y pega client id/secret.
 *   2. Añade su id a ENABLED_PROVIDERS aquí abajo.
 *   3. Ya está: el botón aparece solo en /login y /signup, la acción de servidor
 *      lo acepta y el trigger handle_new_user crea el perfil con el nombre y el
 *      avatar que devuelva el proveedor.
 *
 * No hace falta tocar ningún componente.
 */

export type OAuthProviderId = "google" | "discord";

export type OAuthProvider = {
  id: OAuthProviderId;
  label: string;
};

export const AVAILABLE_PROVIDERS: Record<OAuthProviderId, OAuthProvider> = {
  google: { id: "google", label: "Google" },
  discord: { id: "discord", label: "Discord" },
};

/** Vacío = solo email y contraseña. Añade aquí "google" o "discord" para activarlos. */
export const ENABLED_PROVIDERS: OAuthProviderId[] = [];

export function isProviderEnabled(id: string): id is OAuthProviderId {
  return (ENABLED_PROVIDERS as string[]).includes(id);
}
