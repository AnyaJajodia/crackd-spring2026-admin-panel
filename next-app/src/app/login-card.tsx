"use client";

import { Chrome } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginCard() {
  const handleGoogleLogin = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
  };

  return (
    <Card className="w-full max-w-md border-border/70 bg-white/80">
      <CardHeader>
        <CardTitle className="text-2xl">Crackd Admin</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sign in with Google to access the admin analytics dashboards.
        </p>
      </CardHeader>
      <CardContent>
        <Button className="w-full justify-center gap-2" onClick={handleGoogleLogin}>
          <Chrome className="h-4 w-4" />
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  );
}
