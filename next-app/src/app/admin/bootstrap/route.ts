import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { canAccessViaBootstrap, isBootstrapAccessEnabled } from "@/lib/auth/bootstrap-access";

export async function GET(request: NextRequest) {
  const supabaseResponse = NextResponse.next();
  const withSupabaseCookies = (outgoing: NextResponse) => {
    for (const cookie of supabaseResponse.cookies.getAll()) {
      outgoing.cookies.set(cookie);
    }
    return outgoing;
  };

  if (!isBootstrapAccessEnabled()) {
    return withSupabaseCookies(NextResponse.redirect(new URL("/", request.url)));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          supabaseResponse.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return withSupabaseCookies(NextResponse.redirect(new URL("/", request.url)));
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token || token !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return withSupabaseCookies(NextResponse.json({ error: "Invalid token." }, { status: 403 }));
  }

  if (!canAccessViaBootstrap(user.email)) {
    return withSupabaseCookies(NextResponse.json({ error: "Email not allowlisted." }, { status: 403 }));
  }

  return withSupabaseCookies(
    NextResponse.redirect(new URL("/admin/captions?bootstrapped=success", request.url))
  );
}
