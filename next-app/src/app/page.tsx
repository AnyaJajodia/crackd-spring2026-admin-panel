import { redirect } from "next/navigation";

import LoginCard from "@/app/login-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin/captions");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-transparent via-white/40 to-transparent" />
      <LoginCard />
    </main>
  );
}
