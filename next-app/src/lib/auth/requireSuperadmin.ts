import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SuperadminProfile = {
  id: string;
  email: string | null;
  is_superadmin: boolean | null;
};

export async function requireSuperadmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,is_superadmin")
    .eq("id", user.id)
    .maybeSingle<SuperadminProfile>();

  if (error || !profile?.is_superadmin) {
    redirect("/not-authorized");
  }

  return { user, profile };
}
