import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  if (process.env.ENABLE_BOOTSTRAP !== "true") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token || token !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "Invalid token." }, { status: 403 });
  }

  const allowedEmails = (process.env.BOOTSTRAP_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!user.email || !allowedEmails.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Email not allowlisted." }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_superadmin) {
    return NextResponse.redirect(new URL("/admin/captions?bootstrapped=already", request.url));
  }

  await admin.from("profiles").update({ is_superadmin: true }).eq("id", user.id);

  return NextResponse.redirect(new URL("/admin/captions?bootstrapped=success", request.url));
}
