import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignupPage() {
  const session = await getSessionUser();
  if (session) redirect("/");

  return (
    <div className="shell flex justify-center py-16">
      <AuthForm mode="signup" />
    </div>
  );
}
