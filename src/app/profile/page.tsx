import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile-form";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="shell py-16">
        <div className="surface-card mx-auto max-w-xl p-6 text-sm text-doge-ink">
          Tu perfil no está disponible en este momento. Vuelve a intentarlo en un rato.
        </div>
      </div>
    );
  }

  const session = await getSessionUser();
  if (!session) redirect("/login?next=/profile");

  return (
    <div className="shell py-12 md:py-16">
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <p className="eyebrow mb-1">Tu cuenta</p>
          <h1 className="font-display text-display-lg">Mi perfil</h1>
          <p className="mt-2 text-sm text-ink-faint">{session.user.email}</p>
        </div>

        <div className="surface-card p-6">
          <ProfileForm
            username={session.profile?.username ?? ""}
            bio={session.profile?.bio ?? null}
            avatarUrl={session.profile?.avatar_url ?? null}
          />
        </div>
      </div>
    </div>
  );
}
